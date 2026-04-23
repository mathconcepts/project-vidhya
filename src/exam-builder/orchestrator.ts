// @ts-nocheck
/**
 * Master Orchestrator — single entry point for building or updating
 * exam content. Coordinates:
 *
 *   1. Feedback lookup (ALWAYS runs first — never generate fresh
 *      content without consulting what students have said)
 *   2. Pre-application of high-confidence approved feedback
 *   3. LLM generation of genuinely-missing pieces (cost-bounded)
 *   4. Snapshot stitching + adapter post-processing
 *   5. SampleCheck creation (for iteration) OR direct course promotion
 *   6. Append-only event logging throughout
 *
 * Two entry modes:
 *
 *   buildOrUpdateCourse({ exam_id, build_kind: 'new' })
 *     - For an exam with no prior SampleCheck OR one being re-piloted
 *     - Creates a new SampleCheck wrapping generated content
 *     - Does NOT auto-promote — student feedback still needs to flow
 *
 *   buildOrUpdateCourse({ exam_id, build_kind: 'iterate' })
 *     - For an exam with closed SampleCheck(s) ready to promote
 *     - Uses promote-from-samples path under the hood
 *     - Produces a LiveCourse version, not a SampleCheck
 *
 * Every decision is logged via the build event log. The returned
 * BuildTrace gives admins a complete audit of what the orchestrator
 * did and why.
 */

import { getExamAdapter } from './registry';
import { lookupFeedbackForBuild, type FeedbackLookupReport } from './feedback-lookup';
import {
  logBuildEvent, newBuildId, type BuildEvent,
} from './event-log';
import {
  generateSampleContent, stitchSnapshot,
  type GenerationSection, type GenerationOptions, type GenerationResult,
} from '../sample-check/llm-generator';
import { createSampleCheck } from '../sample-check/store';
import { applyPatch, proposePatch } from '../feedback/scope-applicator';
import { listFeedback } from '../feedback/store';
import { promoteToCourse, versionToString } from '../course/promoter';
import type { SampleSnapshot } from '../sample-check/types';

// ============================================================================
// Input / output contracts
// ============================================================================

export type BuildKind = 'new' | 'iterate';

export interface BuildOptions {
  /** Used for LLM generation */
  llm?: GenerationOptions;
  /**
   * Optional: restrict generation to these topic_ids. If omitted,
   * the adapter's defaultGenerationSections() decides.
   */
  topic_ids?: string[];
  /** Optional: override the per-topic question count */
  count_per_topic?: number;
  /**
   * Optional: for 'iterate' builds, which closed sample IDs to
   * promote from. Defaults to all closed samples for the exam.
   */
  source_sample_ids?: string[];
  /** Release tag for logging & promotion records */
  release_tag?: string;
  /** Admin note for the created SampleCheck */
  admin_note?: string;
  /**
   * If true, skip LLM generation entirely even if sections are
   * available. Useful when admin wants to produce a sample purely
   * from hand-authored content + prior feedback applications.
   */
  skip_llm?: boolean;
  /**
   * If true and build_kind='new', automatically supersede any
   * existing open sample for this exam before creating the new one.
   * Default false — safer default is to reject rather than
   * silently supersede in-flight student feedback.
   */
  auto_supersede_open?: boolean;
  /**
   * Attention budget — if provided, the orchestrator scales the
   * build output for short-session consumption.
   *
   *   - mock_question_count: capped by strategy for the budget
   *   - snapshot carries _attention_strategy in _exam_day_notes so
   *     downstream renderers (mock UI, lesson delivery) can adapt
   *
   * Respected by adapters that implement buildMicroMock() or that
   * honor opts.attention_strategy in defaultGenerationSections.
   *
   * If omitted, full-fidelity content is produced (same as pre-v2.20
   * behavior).
   */
  attention_budget_minutes?: number;
}

export interface BuildOrUpdateInput {
  exam_id: string;
  build_kind: BuildKind;
  options?: BuildOptions;
  actor: string;                       // admin user_id
}

export interface BuildTrace {
  build_id: string;
  exam_id: string;
  build_kind: BuildKind;
  status: 'succeeded' | 'failed' | 'requires_review';
  feedback_lookup?: FeedbackLookupReport;
  pre_applied_feedback_ids: string[];
  llm_generation?: {
    attempted: boolean;
    skipped_reason?: string;
    result?: GenerationResult;
  };
  snapshot_summary?: {
    mock_count: number;
    question_count: number;
    lesson_count: number;
    strategy_count: number;
  };
  sample_check_id?: string;
  course_promotion?: {
    course_id: string;
    version_before?: string;
    version_after: string;
    promotion_record_id: string;
    created_new_version: boolean;
  };
  total_cost_usd: number;
  duration_ms: number;
  review_required_feedback_ids?: string[];
  errors: string[];
}

// ============================================================================
// The orchestrator
// ============================================================================

export async function buildOrUpdateCourse(
  input: BuildOrUpdateInput,
): Promise<BuildTrace> {
  const build_id = newBuildId();
  const started = Date.now();
  const errors: string[] = [];

  const trace: BuildTrace = {
    build_id,
    exam_id: input.exam_id,
    build_kind: input.build_kind,
    status: 'failed',
    pre_applied_feedback_ids: [],
    total_cost_usd: 0,
    duration_ms: 0,
    errors,
  };

  logBuildEvent({
    build_id, exam_id: input.exam_id, kind: 'build_started', actor: input.actor,
    payload: { build_kind: input.build_kind, options: input.options ?? {} },
  });

  // ─── Step 0: resolve adapter ─────────────────────────────────────────
  const adapter = getExamAdapter(input.exam_id);
  if (!adapter) {
    errors.push(`No exam adapter registered for ${input.exam_id}`);
    logBuildEvent({
      build_id, exam_id: input.exam_id, kind: 'build_failed', actor: input.actor,
      payload: { reason: errors[0] },
    });
    trace.duration_ms = Date.now() - started;
    return trace;
  }

  // ─── Step 1: ALWAYS consult feedback first ───────────────────────────
  let lookup: FeedbackLookupReport;
  try {
    lookup = await lookupFeedbackForBuild(input.exam_id);
    trace.feedback_lookup = lookup;
    logBuildEvent({
      build_id, exam_id: input.exam_id, kind: 'feedback_lookup_completed', actor: input.actor,
      payload: { counts: lookup.counts, recommendation_counts: {
        pre_apply: lookup.recommendations.pre_apply_ids.length,
        review_required: lookup.recommendations.review_required_ids.length,
        defer: lookup.recommendations.defer_ids.length,
      } },
    });
  } catch (err: any) {
    errors.push(`feedback lookup failed: ${err.message ?? err}`);
    logBuildEvent({
      build_id, exam_id: input.exam_id, kind: 'build_failed', actor: input.actor,
      payload: { phase: 'feedback_lookup', error: errors[errors.length - 1] },
    });
    trace.duration_ms = Date.now() - started;
    return trace;
  }

  // ─── Step 2: pre-apply high-confidence approved feedback ─────────────
  let base = adapter.loadBaseContent();
  if (lookup.recommendations.pre_apply_ids.length > 0) {
    try {
      const items = lookup.recommendations.pre_apply_ids
        .map(id => listFeedback({}).find(f => f.id === id))
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        // proposePatch requires status='approved'; treat 'applied' as approved-like
        .map(f => (f.status === 'applied' ? { ...f, status: 'approved' } : f));

      if (items.length > 0) {
        const patch = proposePatch(items as any, input.actor);
        if (patch) {
          base = applyPatch(base, patch);
          trace.pre_applied_feedback_ids = items.map(i => i.id);
          logBuildEvent({
            build_id, exam_id: input.exam_id, kind: 'pre_apply_completed', actor: input.actor,
            payload: { applied_ids: trace.pre_applied_feedback_ids, ops: patch.ops.length },
          });
        }
      }
    } catch (err: any) {
      errors.push(`pre-apply failed: ${err.message ?? err}`);
      // Non-fatal — continue with un-patched base
    }
  }

  // ─── Step 3: LLM generation (only if not skipped + sections defined) ──
  let llmResult: GenerationResult | null = null;
  if (input.options?.skip_llm) {
    trace.llm_generation = { attempted: false, skipped_reason: 'options.skip_llm=true' };
  } else {
    const sections: GenerationSection[] = adapter.defaultGenerationSections({
      topic_ids: input.options?.topic_ids,
      count_per_topic: input.options?.count_per_topic,
    });
    if (sections.length === 0) {
      trace.llm_generation = { attempted: false, skipped_reason: 'adapter returned no sections' };
    } else {
      logBuildEvent({
        build_id, exam_id: input.exam_id, kind: 'llm_generation_started', actor: input.actor,
        payload: { section_count: sections.length, options: input.options?.llm ?? {} },
      });
      try {
        llmResult = await generateSampleContent(sections, input.options?.llm ?? {});
        trace.llm_generation = { attempted: true, result: llmResult };
        trace.total_cost_usd += llmResult.provenance.total_cost_usd;
        logBuildEvent({
          build_id, exam_id: input.exam_id,
          kind: llmResult.error ? 'llm_generation_failed' : 'llm_generation_completed',
          actor: input.actor,
          payload: {
            pieces_generated: llmResult.provenance.pieces_generated,
            wolfram_verified: llmResult.provenance.pieces_verified_by_wolfram,
            failures: llmResult.provenance.failures.length,
            error: llmResult.error,
          },
          duration_ms: llmResult.provenance.total_latency_ms,
          cost_usd: llmResult.provenance.total_cost_usd,
        });
      } catch (err: any) {
        errors.push(`LLM generation threw: ${err.message ?? err}`);
        trace.llm_generation = { attempted: true, skipped_reason: err.message ?? String(err) };
        logBuildEvent({
          build_id, exam_id: input.exam_id, kind: 'llm_generation_failed', actor: input.actor,
          payload: { error: errors[errors.length - 1] },
        });
      }
    }
  }

  // ─── Step 4: stitch snapshot ─────────────────────────────────────────
  let snapshot: SampleSnapshot;
  if (llmResult && !llmResult.error) {
    snapshot = stitchSnapshot({
      exam_spec: base.exam,
      generation_result: llmResult,
      hand_authored: {
        mocks: base.mocks,
        lessons: base.lessons,
        strategies: base.strategies,
      },
    });
  } else {
    // No LLM content — use base as-is
    snapshot = {
      exam: base.exam,
      mocks: base.mocks,
      lessons: base.lessons,
      strategies: base.strategies,
    };
  }

  // Adapter post-processing (dedup, metadata injection, schema checks)
  if (adapter.postProcessSnapshot) {
    snapshot = adapter.postProcessSnapshot(snapshot);
  }

  // ─── Step 4.5: attention-budget-aware filtering ─────────────────────
  // If the caller passed an attention_budget_minutes, scale mocks and
  // lessons to match what a student at that attention level can
  // actually complete. The must-include floor in the resolver
  // guarantees short ≠ shallow.
  if (typeof input.options?.attention_budget_minutes === 'number') {
    try {
      const {
        budgetFromMinutes, resolveStrategy, filterMockForStrategy, filterLessonForStrategy,
      } = await import('../attention');
      const budget = budgetFromMinutes(input.options.attention_budget_minutes);
      const strategy = resolveStrategy(budget);

      // Filter each mock to the strategy's question count + difficulty mix
      snapshot.mocks = (snapshot.mocks ?? []).map((m: any) => ({
        ...m,
        questions: filterMockForStrategy(m.questions ?? [], strategy),
        _attention_applied: true,
      }));

      // Filter each lesson to the components the strategy surfaces
      snapshot.lessons = (snapshot.lessons ?? []).map((l: any) =>
        filterLessonForStrategy(l, strategy),
      );

      // Attach the strategy to the snapshot for downstream transparency
      snapshot._attention_strategy = strategy;
    } catch (err: any) {
      // Non-fatal — if attention module is missing somehow, fall back
      // to full-fidelity content. This preserves the v2.18.0 behavior
      // as the graceful degradation path.
      errors.push(`attention filtering failed (non-fatal): ${err.message ?? err}`);
    }
  }

  trace.snapshot_summary = {
    mock_count: snapshot.mocks?.length ?? 0,
    question_count: (snapshot.mocks ?? []).reduce((n, m) => n + (m.questions?.length ?? 0), 0),
    lesson_count: snapshot.lessons?.length ?? 0,
    strategy_count: snapshot.strategies?.length ?? 0,
  };

  logBuildEvent({
    build_id, exam_id: input.exam_id, kind: 'snapshot_stitched', actor: input.actor,
    payload: trace.snapshot_summary,
  });

  // ─── Step 5: route by build_kind ─────────────────────────────────────
  if (input.build_kind === 'new') {
    // Optional auto-supersession of any open sample for this exam
    if (input.options?.auto_supersede_open) {
      try {
        const { getLatestOpenSample, closeSampleSuperseded } = await import('../sample-check/store');
        const open = getLatestOpenSample(adapter.exam_id);
        if (open) {
          closeSampleSuperseded(open.id, input.actor);
          // Log the supersede as its own event kind. Reusing
          // 'sample_check_created' would be misleading; adding a
          // dedicated kind would proliferate kinds for every side
          // effect. Using the generic 'snapshot_stitched' in
          // payload form is wrong too — cleanest fix is a distinct
          // payload on build_started itself, which we already have
          // from the initial logBuildEvent call. Emit a dedicated
          // 'build_aborted' would imply termination. The right kind
          // here is the existing 'admin_review_required' but as
          // a supersession marker — actually the cleanest thing is
          // just to not double-log and keep the info on the initial
          // build_started payload via the trace.
          //
          // Implementation: attach to the trace, not a new event.
          (trace as any).auto_superseded_sample_id = open.id;
        }
      } catch (err: any) {
        errors.push(`auto-supersede failed: ${err.message ?? err}`);
      }
    }

    try {
      const sc = createSampleCheck({
        exam_id: adapter.exam_id,
        exam_code: adapter.exam_code,
        exam_name: adapter.exam_name,
        snapshot,
        admin_note: input.options?.admin_note ?? `Orchestrator-generated build ${build_id}`,
        created_by: input.actor,
        release_tag: input.options?.release_tag,
      });
      trace.sample_check_id = sc.id;
      logBuildEvent({
        build_id, exam_id: input.exam_id, kind: 'sample_check_created', actor: input.actor,
        payload: { sample_check_id: sc.id, iteration: sc.iteration, share_token: sc.share_token },
      });
    } catch (err: any) {
      errors.push(`sample check creation failed: ${err.message ?? err}`);
      logBuildEvent({
        build_id, exam_id: input.exam_id, kind: 'build_failed', actor: input.actor,
        payload: { phase: 'create_sample', error: errors[errors.length - 1] },
      });
      trace.duration_ms = Date.now() - started;
      return trace;
    }
  } else if (input.build_kind === 'iterate') {
    // Promotion path — requires at least one closed sample to source from
    const sourceIds = input.options?.source_sample_ids ?? [];
    // Collect applied feedback bound to the named source samples.
    // CRITICAL: filter by status === 'applied' FIRST, then by sample
    // membership. Earlier (buggy) precedence let rejected items slip
    // into applied_feedback_ids when sourceIds was non-empty.
    const appliedIds = lookup.streams.direct
      .filter(r => r.feedback.status === 'applied')
      .filter(r => {
        if (sourceIds.length === 0) return true;
        const pinnedSampleId = (r.feedback.target as any).sample_check_id;
        return pinnedSampleId && sourceIds.includes(pinnedSampleId);
      })
      .map(r => r.feedback.id);

    if (sourceIds.length === 0) {
      errors.push('iterate build_kind requires options.source_sample_ids');
      trace.status = 'failed';
      logBuildEvent({
        build_id, exam_id: input.exam_id, kind: 'build_failed', actor: input.actor,
        payload: { phase: 'promotion', error: errors[errors.length - 1] },
      });
      trace.duration_ms = Date.now() - started;
      return trace;
    }

    try {
      const result = promoteToCourse({
        exam_id: adapter.exam_id,
        exam_code: adapter.exam_code,
        exam_name: adapter.exam_name,
        source_sample_ids: sourceIds,
        applied_feedback_ids: appliedIds,
        candidate_content: snapshot,
        release_tag: input.options?.release_tag,
        promoted_by: input.actor,
      });
      trace.course_promotion = {
        course_id: result.course.id,
        version_before: result.record.version_before ? versionToString(result.record.version_before) : undefined,
        version_after: versionToString(result.record.version_after),
        promotion_record_id: result.record.id,
        created_new_version: result.created_new_version,
      };
      logBuildEvent({
        build_id, exam_id: input.exam_id, kind: 'course_promoted', actor: input.actor,
        payload: trace.course_promotion,
      });

      // Announce on the marketing sync bus — articles referencing this
      // exam can now detect content drift and mark themselves stale if
      // referenced features changed. Lazy-imported so marketing module
      // is optional (same degradation pattern as attention filtering).
      try {
        const { publishToSyncBus } = await import('../marketing/sync-engine');
        publishToSyncBus({
          kind: 'exam_content_promoted',
          exam_id: input.exam_id,
          course_version: versionToString(result.record.version_after),
        });
      } catch {
        // Non-fatal if marketing module unavailable
      }
    } catch (err: any) {
      errors.push(`promotion failed: ${err.message ?? err}`);
      logBuildEvent({
        build_id, exam_id: input.exam_id, kind: 'build_failed', actor: input.actor,
        payload: { phase: 'promotion', error: errors[errors.length - 1] },
      });
      trace.duration_ms = Date.now() - started;
      return trace;
    }
  }

  // ─── Step 6: status + review surface ─────────────────────────────────
  if (lookup.recommendations.review_required_ids.length > 0) {
    trace.review_required_feedback_ids = lookup.recommendations.review_required_ids;
    trace.status = 'requires_review';
    logBuildEvent({
      build_id, exam_id: input.exam_id, kind: 'admin_review_required', actor: input.actor,
      payload: { review_required_ids: trace.review_required_feedback_ids },
    });
  } else {
    trace.status = 'succeeded';
  }

  logBuildEvent({
    build_id, exam_id: input.exam_id,
    kind: trace.status === 'succeeded' ? 'build_completed' : 'admin_review_required',
    actor: input.actor,
    payload: { status: trace.status },
  });

  trace.duration_ms = Date.now() - started;
  return trace;
}
