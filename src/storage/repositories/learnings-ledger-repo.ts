/**
 * LearningsLedgerRepo — storage boundary for src/jobs/learnings-ledger.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * Same split as the other job repos: the job file keeps orchestration (the
 * promote/demote decision logic, digest markdown, the optional `gh pr
 * create` step); this repo owns the seven raw queries against
 * experiment_assignments, atom_versions, media_artifacts,
 * generated_problems, generation_runs, run_suggestions, and ledger_runs.
 *
 * `listExperiments`/`updateExperimentStatus`/`computeLift` (from
 * src/experiments/registry.ts and src/experiments/lift.ts) are untouched —
 * those go through src/experiments/db.ts's own pool, a separate file still
 * on the pg-allowlist and out of scope for this migration.
 *
 * No File implementation: promotion/demotion decisions and the operator
 * suggestion inbox only mean anything against the real experiment tables —
 * same reasoning as ContentFlywheelRepo. The factory returns `null` when
 * DATABASE_URL is unset; runLearningsLedger() already short-circuits to a
 * zeroed LedgerRunResult in that case (unchanged from before this move).
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';
import { resolveTreatmentSessions } from '../../experiments/lift';
import { LATENCY_BUCKETS } from '../../gbrain/attempt-facts';
import type { ModeAccuracyWindow } from '../../experiments/promote-guards';
import { CONTENT_GATES, gatesSatisfiedItemIds } from '../../generation/gate-ledger';

export interface RunConfigRow {
  experiment_id: string;
  config: unknown;
}

export interface SuggestionInsert {
  id: string;
  exam_pack_id: string;
  source_experiment_id: string;
  hypothesis: string;
  config: unknown;
  reason: string;
  expected_lift: number | null;
  expected_n: number | null;
}

export interface LedgerRunCompleteInput {
  id: string;
  experiments_evaluated: number;
  promotions: number;
  demotions: number;
  suggestions: number;
  pr_url: string | null;
  digest?: string;
}

/** W1.6 — guard 1's data: mean(mastery in a LATER window) − mean(mastery in the PRE window), same treatment cohort as lift_v1. */
export interface DelayedRetentionStats {
  delta: number;
  n: number;
}

/** W1.6 — guard 3's data. All null when there is not enough attempt_facts coverage to judge either way. */
export interface SpeedAccuracyStats {
  meanBucketIndexPre: number | null;
  meanBucketIndexPost: number | null;
  accuracyPre: number | null;
  accuracyPost: number | null;
  n: number | null;
}

export interface LearningsLedgerRepo {
  /** atom_id list assigned to an experiment with a non-control variant. */
  fetchAtomTargets(experimentId: string): Promise<string[]>;
  /** Flips atom_versions + media_artifacts + generated_problems to canonical=true for the winning targets. */
  applyPromotion(targets: string[], reason: string): Promise<void>;
  /** Flips media_artifacts.status='failed' and atom_versions.canonical=false for the losing targets. */
  applyDemotion(targets: string[], reason: string): Promise<void>;
  /** Most recent generation_runs.config per experiment id, for the suggester to scale/invert. */
  loadRecentRunConfigs(experimentIds: string[]): Promise<RunConfigRow[]>;
  upsertSuggestion(s: SuggestionInsert): Promise<void>;
  markLedgerRunRunning(id: string): Promise<void>;
  markLedgerRunComplete(input: LedgerRunCompleteInput): Promise<void>;
  /** W1.6 guard 1's input. `null` when the delayed window can't be measured yet (best-effort — never throws). */
  fetchDelayedRetention(experimentId: string, examPackId: string, startedAtIso: string, windowDays: number): Promise<DelayedRetentionStats | null>;
  /** W1.6 guard 2's input — one entry per gradable kind found. Best-effort — never throws. */
  fetchModeSplitAccuracy(experimentId: string, examPackId: string, startedAtIso: string, windowDays: number): Promise<ModeAccuracyWindow[]>;
  /** W1.6 guard 3's input. Best-effort — never throws. */
  fetchSpeedAccuracy(experimentId: string, examPackId: string, startedAtIso: string, windowDays: number): Promise<SpeedAccuracyStats | null>;
}

export class PgLearningsLedgerRepo implements LearningsLedgerRepo {
  constructor(private pool: Pool) {}

  async fetchAtomTargets(experimentId: string): Promise<string[]> {
    const { rows } = await this.pool.query<{ target_id: string }>(
      `SELECT target_id
         FROM experiment_assignments
        WHERE experiment_id = $1
          AND target_kind = 'atom'
          AND variant <> 'control'`,
      [experimentId],
    );
    return rows.map((r) => r.target_id);
  }

  async applyPromotion(targets: string[], reason: string): Promise<void> {
    if (targets.length === 0) return;

    await this.pool.query(
      `UPDATE atom_versions
         SET canonical = TRUE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[])`,
      [targets, reason],
    );

    await this.pool.query(
      `UPDATE media_artifacts
         SET canonical = TRUE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[]) AND status = 'done'`,
      [targets, reason],
    );

    // generated_problems uses `id`, not atom_id, but the experiment may
    // have assigned problem ids directly under the same target_kind=atom
    // bucket (we don't currently distinguish). Best-effort: try by id.
    //
    // W1.3 / plan E8 — the PROMOTION half of gate enforcement. A problem
    // row carrying `generation_run_id` provenance may not be flipped
    // canonical until all five named gates in `content_gate_ledger` are
    // passed-or-waived. Rows WITHOUT provenance (hand-authored, file-bank
    // seeded, pre-020) are promoted exactly as before — the ledger has no
    // jurisdiction over them and is never consulted for them.
    const promotable = await this.gatePromotableProblemIds(targets);
    if (promotable.length > 0) {
      await this.pool.query(
        `UPDATE generated_problems
           SET canonical = TRUE,
               canonical_at = NOW(),
               canonical_reason = $2
         WHERE id::TEXT = ANY($1::TEXT[]) AND verified = TRUE`,
        [promotable, reason],
      );
    }
  }

  /**
   * Of `targets`, the problem ids that may be promoted: everything without
   * `generation_run_id` provenance, plus the provenance-carrying ids whose
   * five gates are satisfied. Fails CLOSED — if the provenance lookup
   * itself errors we drop every id that could possibly be provenanced
   * rather than promote an unreviewed answer key.
   */
  private async gatePromotableProblemIds(targets: string[]): Promise<string[]> {
    let provenanced: string[];
    try {
      const { rows } = await this.pool.query<{ id: string }>(
        `SELECT id::TEXT AS id
           FROM generated_problems
          WHERE id::TEXT = ANY($1::TEXT[])
            AND generation_run_id IS NOT NULL`,
        [targets],
      );
      provenanced = rows.map((r) => r.id);
    } catch (err) {
      console.error(
        `[learnings-ledger] provenance lookup failed for ${targets.length} promotion target(s) — ` +
          `skipping generated_problems promotion entirely rather than promoting ungated content: ${(err as Error).message}`,
      );
      return [];
    }
    if (provenanced.length === 0) return targets;
    const satisfied = await gatesSatisfiedItemIds(provenanced, this.pool);
    const blocked = provenanced.filter((id) => !satisfied.has(id));
    if (blocked.length > 0) {
      console.warn(
        `[learnings-ledger] refusing to promote ${blocked.length} of ${provenanced.length} provenance-carrying problem(s): ` +
          `not all ${CONTENT_GATES.length} gates (${CONTENT_GATES.join(', ')}) are passed-or-waived. ` +
          `Blocked ids: ${blocked.join(', ')}. Review at /admin/review-queue.`,
      );
    }
    const provenancedSet = new Set(provenanced);
    return targets.filter((id) => !provenancedSet.has(id) || satisfied.has(id));
  }

  async applyDemotion(targets: string[], reason: string): Promise<void> {
    if (targets.length === 0) return;

    // Flip media artifacts to 'failed' so applyMediaUrls skips them
    await this.pool.query(
      `UPDATE media_artifacts
         SET status = 'failed',
             canonical = FALSE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[])`,
      [targets, reason],
    );

    // Mark atom_versions explicitly non-canonical (operator may regen)
    await this.pool.query(
      `UPDATE atom_versions
         SET canonical = FALSE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[])`,
      [targets, reason],
    );
  }

  async loadRecentRunConfigs(experimentIds: string[]): Promise<RunConfigRow[]> {
    if (experimentIds.length === 0) return [];
    const { rows } = await this.pool.query<RunConfigRow>(
      `SELECT DISTINCT ON (experiment_id) experiment_id, config
         FROM generation_runs
        WHERE experiment_id = ANY($1::TEXT[])
        ORDER BY experiment_id, created_at DESC`,
      [experimentIds],
    );
    return rows;
  }

  async upsertSuggestion(s: SuggestionInsert): Promise<void> {
    await this.pool.query(
      `INSERT INTO run_suggestions (id, exam_pack_id, source_experiment_id, hypothesis, config, reason, expected_lift, expected_n)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         hypothesis = EXCLUDED.hypothesis,
         config     = EXCLUDED.config,
         reason     = EXCLUDED.reason,
         expected_lift = EXCLUDED.expected_lift,
         expected_n    = EXCLUDED.expected_n`,
      [
        s.id,
        s.exam_pack_id,
        s.source_experiment_id,
        s.hypothesis,
        JSON.stringify(s.config),
        s.reason,
        s.expected_lift,
        s.expected_n,
      ],
    );
  }

  async markLedgerRunRunning(id: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO ledger_runs (id, status) VALUES ($1, 'running')
       ON CONFLICT (id) DO NOTHING`,
      [id],
    );
  }

  /**
   * W1.6 guard 1 — the treatment cohort's own mastery delta at a window
   * FURTHER OUT than the one lift_v1 measured: mean(mastery in
   * [start+windowDays, start+2*windowDays]) − mean(mastery in
   * [start-windowDays, start)). Reuses `resolveTreatmentSessions` (the
   * SAME cohort resolution lift_v1 used) rather than re-deriving it.
   * Best-effort: any failure (unresolvable cohort, no rows, a query
   * error) degrades to `null` — "not enough data yet", never a thrown
   * exception that could take the promote step down with it.
   */
  async fetchDelayedRetention(
    experimentId: string,
    examPackId: string,
    startedAtIso: string,
    windowDays: number,
  ): Promise<DelayedRetentionStats | null> {
    try {
      const sessions = await resolveTreatmentSessions(experimentId, examPackId);
      if (sessions.size === 0) return null;

      const { rows } = await this.pool.query<{
        session_id: string; concept_id: string;
        pre_mastery: number | null; delayed_mastery: number | null;
      }>(
        `WITH bounds AS (
           SELECT $2::TIMESTAMPTZ AS exp_start,
                  $2::TIMESTAMPTZ - ($4::TEXT || ' days')::INTERVAL AS pre_start,
                  $2::TIMESTAMPTZ + ($4::TEXT || ' days')::INTERVAL AS delayed_start,
                  $2::TIMESTAMPTZ + (($4::NUMERIC * 2)::TEXT || ' days')::INTERVAL AS delayed_end
         )
         SELECT s.session_id, s.concept_id,
                (SELECT mastery FROM mastery_snapshots ms
                   WHERE ms.session_id = s.session_id AND ms.concept_id = s.concept_id
                     AND ms.taken_at >= (SELECT pre_start FROM bounds)
                     AND ms.taken_at <  (SELECT exp_start FROM bounds)
                   ORDER BY ms.taken_at DESC LIMIT 1) AS pre_mastery,
                (SELECT mastery FROM mastery_snapshots ms
                   WHERE ms.session_id = s.session_id AND ms.concept_id = s.concept_id
                     AND ms.taken_at >= (SELECT delayed_start FROM bounds)
                     AND ms.taken_at <= (SELECT delayed_end FROM bounds)
                   ORDER BY ms.taken_at DESC LIMIT 1) AS delayed_mastery
           FROM (
             SELECT DISTINCT session_id, concept_id FROM mastery_snapshots
              WHERE exam_pack_id = $3 AND session_id = ANY($1::TEXT[])
           ) s`,
        [Array.from(sessions), startedAtIso, examPackId, String(windowDays)],
      );

      const perSession = new Map<string, { sum: number; n: number }>();
      for (const r of rows) {
        if (r.pre_mastery == null || r.delayed_mastery == null) continue;
        const delta = Number(r.delayed_mastery) - Number(r.pre_mastery);
        const cur = perSession.get(r.session_id) ?? { sum: 0, n: 0 };
        cur.sum += delta;
        cur.n += 1;
        perSession.set(r.session_id, cur);
      }
      const perSessionDeltas: number[] = [];
      for (const { sum, n } of perSession.values()) if (n > 0) perSessionDeltas.push(sum / n);
      if (perSessionDeltas.length === 0) return null;

      const total = perSessionDeltas.reduce((a, b) => a + b, 0);
      return { delta: total / perSessionDeltas.length, n: perSessionDeltas.length };
    } catch (err) {
      console.error(`[learnings-ledger] fetchDelayedRetention failed for experiment=${experimentId}:`, (err as Error).message);
      return null;
    }
  }

  /**
   * W1.6 guard 2 — pre/post accuracy per gradable kind for the treatment
   * cohort. `attempt_facts.student_id` is the authenticated user id, not
   * `mastery_snapshots.session_id` (see migration 051's header); the
   * bridge is `mastery_snapshots.user_id`, a nullable mirror of the same
   * identity. A session that never authenticated contributes no student
   * id and so no attempt_facts rows here — an honest gap, not a wrong
   * number. "Correct" is read as `marks_earned = marks_max`, which holds
   * for mcq/nat under every registered marking strategy today (both are
   * all-or-nothing; see deterministic-scorer.ts).
   */
  async fetchModeSplitAccuracy(
    experimentId: string,
    examPackId: string,
    startedAtIso: string,
    windowDays: number,
  ): Promise<ModeAccuracyWindow[]> {
    try {
      const studentIds = await this.treatmentStudentIds(experimentId, examPackId);
      if (studentIds.length === 0) return [];

      const { rows } = await this.pool.query<{
        question_kind: 'mcq' | 'nat';
        n_pre: string; correct_pre: string;
        n_post: string; correct_post: string;
      }>(
        `SELECT question_kind,
                COUNT(*) FILTER (WHERE created_at < $3::TIMESTAMPTZ) AS n_pre,
                COUNT(*) FILTER (WHERE created_at < $3::TIMESTAMPTZ AND marks_earned = marks_max) AS correct_pre,
                COUNT(*) FILTER (WHERE created_at >= $3::TIMESTAMPTZ) AS n_post,
                COUNT(*) FILTER (WHERE created_at >= $3::TIMESTAMPTZ AND marks_earned = marks_max) AS correct_post
           FROM attempt_facts
          WHERE student_id = ANY($1::TEXT[])
            AND skipped = FALSE
            AND question_kind IN ('mcq', 'nat')
            AND marks_earned IS NOT NULL AND marks_max IS NOT NULL
            AND created_at >= $3::TIMESTAMPTZ - ($4::TEXT || ' days')::INTERVAL
            AND created_at <= $3::TIMESTAMPTZ + ($4::TEXT || ' days')::INTERVAL
          GROUP BY question_kind`,
        [studentIds, examPackId, startedAtIso, String(windowDays)],
      );

      return rows.map((r) => {
        const nPre = Number(r.n_pre);
        const nPost = Number(r.n_post);
        return {
          kind: r.question_kind,
          accuracyPre: nPre > 0 ? Number(r.correct_pre) / nPre : null,
          nPre,
          accuracyPost: nPost > 0 ? Number(r.correct_post) / nPost : null,
          nPost,
        };
      });
    } catch (err) {
      console.error(`[learnings-ledger] fetchModeSplitAccuracy failed for experiment=${experimentId}:`, (err as Error).message);
      return [];
    }
  }

  /**
   * W1.6 guard 3 — mean latency-bucket index + accuracy, pre/post, over
   * ALL gradable kinds combined (this guard asks about overall rushing,
   * not a per-kind split — that's guard 2's job). `LATENCY_BUCKETS`'
   * order is the SAME list attempt-facts.ts's writer bucketed against and
   * the guard's own reader ranks against — imported once, never restated.
   */
  async fetchSpeedAccuracy(
    experimentId: string,
    examPackId: string,
    startedAtIso: string,
    windowDays: number,
  ): Promise<SpeedAccuracyStats | null> {
    try {
      const studentIds = await this.treatmentStudentIds(experimentId, examPackId);
      if (studentIds.length === 0) return null;

      const { rows } = await this.pool.query<{
        is_pre: boolean; latency_bucket: string; n: string; correct: string;
      }>(
        `SELECT (created_at < $3::TIMESTAMPTZ) AS is_pre,
                latency_bucket,
                COUNT(*) AS n,
                COUNT(*) FILTER (WHERE marks_earned = marks_max) AS correct
           FROM attempt_facts
          WHERE student_id = ANY($1::TEXT[])
            AND skipped = FALSE
            AND latency_bucket IS NOT NULL
            AND marks_earned IS NOT NULL AND marks_max IS NOT NULL
            AND created_at >= $3::TIMESTAMPTZ - ($4::TEXT || ' days')::INTERVAL
            AND created_at <= $3::TIMESTAMPTZ + ($4::TEXT || ' days')::INTERVAL
          GROUP BY is_pre, latency_bucket`,
        [studentIds, examPackId, startedAtIso, String(windowDays)],
      );
      if (rows.length === 0) return null;

      const agg = (isPre: boolean) => {
        let n = 0, correct = 0, bucketSum = 0;
        for (const r of rows) {
          if (r.is_pre !== isPre) continue;
          const idx = LATENCY_BUCKETS.indexOf(r.latency_bucket as (typeof LATENCY_BUCKETS)[number]);
          if (idx < 0) continue;
          const rn = Number(r.n);
          n += rn;
          correct += Number(r.correct);
          bucketSum += idx * rn;
        }
        return n > 0 ? { n, meanBucketIndex: bucketSum / n, accuracy: correct / n } : null;
      };
      const pre = agg(true);
      const post = agg(false);
      if (!post) return null;

      return {
        meanBucketIndexPre: pre?.meanBucketIndex ?? null,
        meanBucketIndexPost: post.meanBucketIndex,
        accuracyPre: pre?.accuracy ?? null,
        accuracyPost: post.accuracy,
        n: Math.min(pre?.n ?? 0, post.n) || post.n,
      };
    } catch (err) {
      console.error(`[learnings-ledger] fetchSpeedAccuracy failed for experiment=${experimentId}:`, (err as Error).message);
      return null;
    }
  }

  /**
   * Bridges the treatment cohort's session ids (resolved the same way
   * lift_v1 resolves them) to authenticated student ids via
   * `mastery_snapshots.user_id` — see fetchModeSplitAccuracy's header for
   * why this bridge exists. Best-effort: a resolution failure returns an
   * empty list rather than throwing.
   */
  private async treatmentStudentIds(experimentId: string, examPackId: string): Promise<string[]> {
    const sessions = await resolveTreatmentSessions(experimentId, examPackId);
    if (sessions.size === 0) return [];
    const { rows } = await this.pool.query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM mastery_snapshots WHERE session_id = ANY($1::TEXT[]) AND user_id IS NOT NULL`,
      [Array.from(sessions)],
    );
    return rows.map((r) => String(r.user_id));
  }

  async markLedgerRunComplete(input: LedgerRunCompleteInput): Promise<void> {
    await this.pool.query(
      `UPDATE ledger_runs
          SET experiments_evaluated = $2,
              promotions = $3,
              demotions = $4,
              suggestions = $5,
              pr_url = $6,
              digest_md = COALESCE($7, digest_md),
              status = 'complete'
        WHERE id = $1`,
      [
        input.id,
        input.experiments_evaluated,
        input.promotions,
        input.demotions,
        input.suggestions,
        input.pr_url,
        input.digest ?? null,
      ],
    );
  }
}

/** Test/reference only — never returned by the factory (runLearningsLedger() already short-circuits on a null repo). */
export class NullLearningsLedgerRepo implements LearningsLedgerRepo {
  async fetchAtomTargets(): Promise<string[]> {
    return [];
  }
  async applyPromotion(): Promise<void> {}
  async applyDemotion(): Promise<void> {}
  async loadRecentRunConfigs(): Promise<RunConfigRow[]> {
    return [];
  }
  async upsertSuggestion(): Promise<void> {}
  async markLedgerRunRunning(): Promise<void> {}
  async markLedgerRunComplete(): Promise<void> {}
  async fetchDelayedRetention(): Promise<DelayedRetentionStats | null> { return null; }
  async fetchModeSplitAccuracy(): Promise<ModeAccuracyWindow[]> { return []; }
  async fetchSpeedAccuracy(): Promise<SpeedAccuracyStats | null> { return null; }
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise (matches pre-migration DB-less behavior). */
export function getLearningsLedgerRepo(): LearningsLedgerRepo | null {
  const pool = getSharedPool();
  return pool ? new PgLearningsLedgerRepo(pool) : null;
}
