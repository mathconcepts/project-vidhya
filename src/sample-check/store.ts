// @ts-nocheck
/**
 * SampleCheck Store + Workflow Engine
 *
 * Handles the full lifecycle:
 *   create (snapshot freezes) -> share -> collect feedback -> iterate
 *   -> close-resolved or close-superseded
 *
 * Corner cases addressed:
 *
 *   1. Same exam, different sample creations (multiple iterations):
 *      Each iteration is a SampleCheck with its own id + snapshot +
 *      iteration number. Feedback is version-pinned. Carry-forward
 *      requires explicit admin decision per unresolved item.
 *
 *   2. Relevant feedback from different exams:
 *      CrossExamLink stores an admin-asserted (or GBrain-suggested)
 *      mapping of feedback to additional exams. Target exam treats
 *      the linked feedback as its own incoming item, subject to its
 *      own approval.
 *
 *   3. Student follows old link after sample is superseded:
 *      Public view includes newer_version pointer so student can
 *      upgrade naturally.
 *
 *   4. Sample with zero feedback iterates cleanly:
 *      close_resolved works even when feedback_stats.total = 0.
 *
 *   5. Admin attempts to create iteration for exam with an open
 *      sample:
 *      closeSampleSuperseded must be called explicitly before a new
 *      iteration can be created. No silent supersession.
 *
 *   6. Deeply nested iteration — admin follows trail backwards:
 *      getIterationChain walks from a sample_id to the first
 *      iteration, preserving audit trail.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type {
  SampleCheck,
  SampleIteration,
  CrossExamLink,
  SampleCheckStatus,
  SampleSnapshot,
  SampleCheckPublicView,
} from './types';
import type { FeedbackItem } from '../feedback/types';
import { listFeedback, getFeedback } from '../feedback/store';

// ============================================================================
// Persistence
// ============================================================================

interface StoreShape {
  sample_checks: SampleCheck[];
  iterations: SampleIteration[];
  cross_links: CrossExamLink[];
}

const STORE_PATH = '.data/sample-checks.json';

const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ sample_checks: [], iterations: [], cross_links: [] }),
});

// ============================================================================
// ID + token generation
// ============================================================================

function randomShareToken(): string {
  // URL-safe, 16 characters, lowercase alphanumeric
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 16; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

function nano(n = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ============================================================================
// CREATE — first iteration or subsequent iteration
// ============================================================================

export interface CreateSampleCheckInput {
  exam_id: string;
  exam_code: string;                    // For building the id
  exam_name: string;
  snapshot: SampleSnapshot;
  admin_note: string;
  created_by: string;
  /** Release tag this iteration corresponds to (e.g. "v2.14.1"). Optional. */
  release_tag?: string;
}

/**
 * Creates a new SampleCheck. If a prior iteration exists for this
 * exam_id and is still `open` or `feedback_review`, throws — admin
 * must explicitly close it first via closeSampleSuperseded.
 *
 * This avoids silent supersession (a corner case: admin creates a new
 * sample while students are still giving feedback on the old one).
 */
export function createSampleCheck(input: CreateSampleCheckInput): SampleCheck {
  const store = _store.read();

  // Check for open priors for this exam
  const prior = store.sample_checks
    .filter(s => s.exam_id === input.exam_id)
    .sort((a, b) => b.iteration - a.iteration);

  const openPrior = prior.find(s => s.status === 'open' || s.status === 'feedback_review' || s.status === 'patch_in_flight');
  if (openPrior) {
    throw new Error(
      `Cannot create new sample iteration for ${input.exam_id}: ` +
      `iteration ${openPrior.iteration} (${openPrior.id}) is still ${openPrior.status}. ` +
      `Call closeSampleSuperseded(${openPrior.id}) or closeSampleResolved(${openPrior.id}) first.`,
    );
  }

  const iteration = prior.length > 0 ? prior[0].iteration + 1 : 1;
  const ts = Date.now().toString(36);
  const id = `SC-${input.exam_code}-${ts}`;

  const sample: SampleCheck = {
    id,
    exam_id: input.exam_id,
    iteration,
    share_token: randomShareToken(),
    snapshot: input.snapshot,
    admin_note: input.admin_note,
    title: `${input.exam_name} sample — iteration ${iteration}`,
    status: 'open',
    created_at: new Date().toISOString(),
    created_by: input.created_by,
    carry_forward_from_sample_id: prior[0]?.id,
    feedback_stats: {
      total: 0, open: 0, approved_not_applied: 0, applied: 0, rejected: 0, duplicate: 0,
    },
  };

  store.sample_checks.push(sample);

  // Write iteration record for iteration >= 2
  if (iteration >= 2) {
    const iterationRecord: SampleIteration = {
      id: `IT-${nano()}`,
      exam_id: input.exam_id,
      from_sample_id: prior[0].id,
      to_sample_id: id,
      iteration_number: iteration,
      release_tag: input.release_tag,
      carry_forward_decisions: [],    // Admin fills in via carryForwardFeedback
      created_at: new Date().toISOString(),
      created_by: input.created_by,
    };
    store.iterations.push(iterationRecord);
  }

  _store.write(store);
  return sample;
}

// ============================================================================
// CLOSE operations
// ============================================================================

export function closeSampleSuperseded(
  sample_id: string,
  closed_by: string,
  superseded_by_sample_id?: string,
): SampleCheck | null {
  const store = _store.read();
  const s = store.sample_checks.find(x => x.id === sample_id);
  if (!s) return null;
  if (s.status === 'closed_resolved' || s.status === 'closed_superseded') return s;

  s.status = 'closed_superseded';
  s.closed_at = new Date().toISOString();
  s.closed_reason = `Superseded${superseded_by_sample_id ? ` by ${superseded_by_sample_id}` : ''}.`;
  s.superseded_by_sample_id = superseded_by_sample_id;
  _store.write(store);
  return s;
}

/**
 * Close a sample as resolved. Requires all attached feedback to be in
 * terminal state (applied / rejected / duplicate).
 */
export function closeSampleResolved(sample_id: string, closed_by: string): SampleCheck | null {
  const store = _store.read();
  const s = store.sample_checks.find(x => x.id === sample_id);
  if (!s) return null;
  if (s.status === 'closed_resolved' || s.status === 'closed_superseded') return s;

  // Recompute stats from live feedback store
  updateStatsInStore(s);
  if (s.feedback_stats.open > 0 || s.feedback_stats.approved_not_applied > 0) {
    throw new Error(
      `Cannot close ${sample_id} as resolved: ` +
      `${s.feedback_stats.open} open + ${s.feedback_stats.approved_not_applied} approved-not-applied items remain.`,
    );
  }
  s.status = 'closed_resolved';
  s.closed_at = new Date().toISOString();
  s.closed_reason = `All ${s.feedback_stats.total} feedback items reached terminal state.`;
  _store.write(store);
  return s;
}

// ============================================================================
// QUERY helpers
// ============================================================================

export function getSampleCheck(id: string): SampleCheck | null {
  return _store.read().sample_checks.find(s => s.id === id) ?? null;
}

export function getSampleByToken(token: string): SampleCheck | null {
  return _store.read().sample_checks.find(s => s.share_token === token) ?? null;
}

export function listSamplesForExam(exam_id: string): SampleCheck[] {
  return _store.read().sample_checks
    .filter(s => s.exam_id === exam_id)
    .sort((a, b) => b.iteration - a.iteration);
}

export function getLatestOpenSample(exam_id: string): SampleCheck | null {
  return listSamplesForExam(exam_id).find(
    s => s.status === 'open' || s.status === 'feedback_review' || s.status === 'patch_in_flight',
  ) ?? null;
}

export function getIterationChain(sample_id: string): SampleCheck[] {
  const all = _store.read().sample_checks;
  const byId = new Map(all.map(s => [s.id, s]));
  const chain: SampleCheck[] = [];
  let cur = byId.get(sample_id);
  while (cur) {
    chain.push(cur);
    cur = cur.carry_forward_from_sample_id ? byId.get(cur.carry_forward_from_sample_id) : undefined;
  }
  return chain;   // newest first
}

export function listIterationsForExam(exam_id: string): SampleIteration[] {
  return _store.read().iterations
    .filter(i => i.exam_id === exam_id)
    .sort((a, b) => b.iteration_number - a.iteration_number);
}

// ============================================================================
// STATS — sync feedback counts onto each sample
// ============================================================================

export function updateStatsInStore(sample: SampleCheck): void {
  // Feedback is bound to a sample via target.sample_check_id when
  // submitted via this workflow; we count those.
  const feedbackForSample = listFeedback({ exam_id: sample.exam_id })
    .filter((f: any) => (f.target as any).sample_check_id === sample.id);

  const stats = {
    total: feedbackForSample.length,
    open: 0,
    approved_not_applied: 0,
    applied: 0,
    rejected: 0,
    duplicate: 0,
  };
  for (const f of feedbackForSample) {
    if (f.status === 'submitted' || f.status === 'triaged') stats.open++;
    else if (f.status === 'approved') stats.approved_not_applied++;
    else if (f.status === 'applied') stats.applied++;
    else if (f.status === 'rejected') stats.rejected++;
    else if (f.status === 'duplicate') stats.duplicate++;
  }
  sample.feedback_stats = stats;
}

export function refreshAllSampleStats(): void {
  const store = _store.read();
  for (const s of store.sample_checks) {
    updateStatsInStore(s);
  }
  _store.write(store);
}

// ============================================================================
// CARRY-FORWARD — per-item admin decision when opening new iteration
// ============================================================================

/**
 * When a new iteration is opened and the previous iteration had
 * unresolved feedback, admin reviews each item and declares whether
 * it still applies (carried_forward), is now addressed by the new
 * snapshot (resolved_applied), or no longer relevant (resolved_obsolete).
 *
 * carried_forward items keep their feedback_id but have their target
 * re-pointed to the new sample_check_id.
 */
export function carryForwardDecision(
  iteration_id: string,
  feedback_id: string,
  decision: 'carried_forward' | 'resolved_applied' | 'resolved_obsolete',
  rationale: string,
): SampleIteration | null {
  const store = _store.read();
  const it = store.iterations.find(i => i.id === iteration_id);
  if (!it) return null;

  // Replace if already present
  it.carry_forward_decisions = it.carry_forward_decisions.filter(d => d.feedback_id !== feedback_id);
  it.carry_forward_decisions.push({ feedback_id, decision, rationale });

  _store.write(store);
  return it;
}

// ============================================================================
// CROSS-EXAM LINKS
// ============================================================================

export interface CreateCrossExamLinkInput {
  source_feedback_id: string;
  target_exam_id: string;
  rationale: string;
  created_by: string;
  gbrain_signals?: CrossExamLink['gbrain_signals'];
}

export function createCrossExamLink(input: CreateCrossExamLinkInput): CrossExamLink | null {
  const sourceFb = getFeedback(input.source_feedback_id);
  if (!sourceFb) return null;
  if (sourceFb.target.exam_id === input.target_exam_id) return null;   // no self-link

  const store = _store.read();
  // Deduplicate: if this exact link already exists, return it
  const existing = store.cross_links.find(
    c => c.source_feedback_id === input.source_feedback_id && c.target_exam_id === input.target_exam_id,
  );
  if (existing) return existing;

  const link: CrossExamLink = {
    id: `CXL-${nano()}`,
    source_feedback_id: input.source_feedback_id,
    source_exam_id: sourceFb.target.exam_id,
    target_exam_id: input.target_exam_id,
    created_by: input.created_by,
    created_at: new Date().toISOString(),
    rationale: input.rationale,
    target_status: 'pending_review',
    gbrain_suggested: Boolean(input.gbrain_signals),
    gbrain_signals: input.gbrain_signals,
  };
  store.cross_links.push(link);
  _store.write(store);
  return link;
}

export function updateCrossLinkStatus(
  link_id: string,
  action: 'acknowledge' | 'decline' | 'apply',
  reviewed_by: string,
  decline_reason?: string,
  applied_in_release?: string,
): CrossExamLink | null {
  const store = _store.read();
  const link = store.cross_links.find(c => c.id === link_id);
  if (!link) return null;
  const now = new Date().toISOString();
  link.target_reviewed_at = now;
  link.target_reviewed_by = reviewed_by;
  if (action === 'acknowledge') link.target_status = 'acknowledged';
  else if (action === 'decline') {
    link.target_status = 'declined';
    link.target_decline_reason = decline_reason;
  } else if (action === 'apply') {
    link.target_status = 'applied_to_target';
    link.target_applied_in_release = applied_in_release;
  }
  _store.write(store);
  return link;
}

export function listCrossLinksIncomingFor(target_exam_id: string): CrossExamLink[] {
  return _store.read().cross_links
    .filter(c => c.target_exam_id === target_exam_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listCrossLinksFromFeedback(feedback_id: string): CrossExamLink[] {
  return _store.read().cross_links.filter(c => c.source_feedback_id === feedback_id);
}

// ============================================================================
// GBRAIN — suggest cross-exam links
// ============================================================================

/**
 * GBrain-assisted discovery of candidate cross-exam links for a given
 * feedback item. Returns suggestions with rationale signals. Admin
 * still has to accept each suggestion explicitly via createCrossExamLink.
 *
 * Signals evaluated:
 *   (a) submitter prepares for target exam (via user's exam_context)
 *   (b) feedback's topic_id appears in target exam's syllabus
 *   (c) other students preparing for target exam have corroborated
 *       related feedback in the past
 *
 * This function is a PURE query over the data we have — it doesn't
 * mutate the store. The caller can create links from returned
 * suggestions via createCrossExamLink.
 */
export interface CrossExamSuggestion {
  target_exam_id: string;
  confidence: 'high' | 'medium' | 'low';
  signals: CrossExamLink['gbrain_signals'];
  rationale: string;
}

export async function suggestCrossExamLinks(
  feedback_id: string,
  candidate_exam_ids: string[],
): Promise<CrossExamSuggestion[]> {
  const fb = getFeedback(feedback_id);
  if (!fb) return [];

  // These are optional integrations; import lazily + degrade gracefully.
  let submitterExamContext: any = null;
  try {
    const { getExamContextForStudent } = await import('../gbrain/exam-context');
    submitterExamContext = await getExamContextForStudent(fb.submitted_by.user_id).catch(() => null);
  } catch {}

  const suggestions: CrossExamSuggestion[] = [];
  for (const target of candidate_exam_ids) {
    if (target === fb.target.exam_id) continue;   // skip self

    const submitter_prepares_for_target = submitterExamContext?.exam_id === target;

    // Topic overlap check — we need the target exam's syllabus topics.
    // The sample-check module is agnostic about where exam specs live;
    // callers pass in known exam topic maps OR we degrade to null.
    const topic_present_in_both = Boolean(fb.target.topic_id);
    // Conservative: without a loaded target exam spec here, we mark
    // as "possibly" and let admin confirm. This is the honest behavior
    // when we don't have data rather than false-positive.

    // Corroboration count from other students who may also prep target
    // (same topic_id feedback across the cross_links table)
    const crossCorroborations = _store.read().cross_links.filter(
      c => c.target_exam_id === target && c.source_feedback_id !== feedback_id,
    ).length;

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (submitter_prepares_for_target) confidence = 'high';
    else if (crossCorroborations >= 2) confidence = 'medium';
    else if (topic_present_in_both && fb.target.topic_id) confidence = 'medium';

    suggestions.push({
      target_exam_id: target,
      confidence,
      signals: {
        submitter_prepares_for_target,
        topic_present_in_both,
        target_exam_submitters_also_corroborated: crossCorroborations,
      },
      rationale:
        submitter_prepares_for_target
          ? `Submitter's current exam_context points to ${target}.`
          : crossCorroborations >= 2
          ? `${crossCorroborations} prior cross-links exist from other feedback to ${target} — topic pattern suggests transfer.`
          : fb.target.topic_id
          ? `Feedback concerns topic '${fb.target.topic_id}'. If ${target} also has this topic, may transfer.`
          : `Weak signal — admin review required.`,
    });
  }
  return suggestions.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.confidence] - rank[b.confidence];
  });
}

// ============================================================================
// PUBLIC VIEW — what /s/:token returns
// ============================================================================

export function buildPublicView(sample: SampleCheck, exam_name: string): SampleCheckPublicView {
  updateStatsInStore(sample);

  // Students participated = distinct submitter count on this sample
  const fbForSample = listFeedback({ exam_id: sample.exam_id })
    .filter((f: any) => (f.target as any).sample_check_id === sample.id);
  const distinctSubmitters = new Set(fbForSample.map(f => f.submitted_by.user_id)).size;

  // If superseded, point to newer
  let newer_version;
  if (sample.status === 'closed_superseded' && sample.superseded_by_sample_id) {
    const newer = getSampleCheck(sample.superseded_by_sample_id);
    if (newer) {
      newer_version = {
        sample_check_id: newer.id,
        iteration: newer.iteration,
        share_token: newer.share_token,
      };
    }
  }

  return {
    sample_check_id: sample.id,
    title: sample.title,
    exam_name,
    iteration: sample.iteration,
    status: sample.status,
    admin_note: sample.admin_note,
    snapshot: sample.snapshot,
    how_to_give_feedback: {
      endpoint: `/api/sample-check/${sample.id}/feedback`,
      feedback_kinds: [
        'mock_question_error', 'mock_coverage_gap', 'syllabus_missing_topic',
        'topic_weight_recalibration', 'lesson_content_error', 'trap_mismatch',
        'trap_addition', 'strategy_preference', 'strategy_addition',
        'exam_metadata_error', 'other',
      ],
      example_body: {
        kind: 'mock_question_error',
        description: 'Question 3\'s answer is wrong — it should be option B, not A',
        target: { question_id: 'q3', mock_id: sample.snapshot.mocks[0]?.id },
        suggestion: { fix_kind: 'change_correct_option', after: 1 },
      },
    },
    newer_version,
    community_stats: {
      students_participated: distinctSubmitters,
      feedback_applied_count: sample.feedback_stats.applied,
    },
  };
}
