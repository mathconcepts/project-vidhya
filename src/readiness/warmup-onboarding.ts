/**
 * src/readiness/warmup-onboarding.ts — T8 (Milestone A — A8, OV2-8).
 *
 * The single-skill bracketing diagnostic in diagnostic-warmup.ts is a
 * general-purpose primitive; this module is the ONBOARDING policy layered
 * on top of it: which concepts get bracketed (locked by OV2-8 to a curated
 * 5-concept LA spine, not all 26), what counts as "the student placed
 * through here", and how a converged/partial result gets written back as
 * priors.
 *
 * Scope lock (OV2-8, amendment 8 / amendment 7 in the plan doc): "warmup
 * brackets 4-6 curated LA spine concepts (~15-25 probes); ancestors
 * inferred from placement; the persist endpoint writes priors with `n` set
 * to clear 'learning' ONLY when the bracket converged". Full 26-concept
 * adaptive placement is an explicit TODO, not attempted here.
 *
 * `diagnostic-warmup.ts` itself is UNCHANGED — its WARMUP_MIN_ITEMS(4)/
 * MAX_ITEMS(8) bounds, combined with the fact that each curated spine
 * concept's committed catalog only has 4-5 authored items
 * (data/practice-items/gate-ma-la-spine.json, gate-ma-la-eigen.json), means
 * a typical concept run naturally exhausts (or converges) after ~4 probes
 * — 5 concepts × ~4 probes ≈ 20, landing inside the locked 15-25 total
 * without this module needing its own convergence policy.
 */

import { CONCEPT_MAP, getPrerequisites } from '../constants/concept-graph';
import type { WarmupReport } from './diagnostic-warmup';

// ────────────────────────────────────────────────────────────────────
// The curated spine — OV2-8 locks this to 4-6 concepts. Five chosen: the
// shortest connected chain that reaches eigenvalues (the "interesting
// part" the placement-result copy promises), in real prerequisite
// (topological) order so "You're solid through {last placed}" always
// names something the student has actually seen everything leading to.
// ────────────────────────────────────────────────────────────────────

export const WARMUP_SPINE_CONCEPTS: readonly string[] = [
  'matrix-operations',
  'determinants',
  'matrix-inverse',
  'systems-of-equations',
  'eigenvalues',
];

/** A student is judged to have genuinely demonstrated a concept (not just
 *  "the bracket algorithm terminated") when the bracket converged AND the
 *  predicted success rate at the converged ability is at least this —
 *  i.e., they're expected to succeed more often than not at their own
 *  level, not merely "ran out of probes near the floor". */
export const COMPETENCE_THRESHOLD = 0.5;

export interface SpineConceptLabel {
  id: string;
  label: string;
}

/** `{id, label}` pairs for the locked spine, in topological order — the
 *  single source of truth the `GET /api/readiness/warmup/spine` endpoint
 *  serves, so the frontend never hardcodes concept labels that could drift
 *  from data/curriculum/gate-ma.yml. */
export function spineConceptLabels(): SpineConceptLabel[] {
  return WARMUP_SPINE_CONCEPTS.map((id) => ({
    id,
    label: CONCEPT_MAP.get(id)?.label ?? id,
  }));
}

// ────────────────────────────────────────────────────────────────────
// Placement — deciding which spine concepts the student demonstrated,
// and where the frontier (their real starting point) sits.
// ────────────────────────────────────────────────────────────────────

export interface PerConceptWarmupResult {
  skillId: string;
  /** From diagnostic-warmup.ts's `isConverged()` (or `exhausted: true` on
   *  the client, which is treated the same as converged — the catalog ran
   *  out of probes, which is itself a form of "we know enough"). */
  converged: boolean;
  abilityEstimate: number;
  probesUsed: number;
  predictedSuccessAtClose: number;
}

export interface PlacementResult {
  /** Spine concept ids the student demonstrated competence on, in the
   *  locked spine order. Empty when the student stopped before answering
   *  anything with genuine competence (DR-2's "We'll start at the
   *  beginning." case). */
  placedConceptIds: string[];
  /** The concept where competence broke down — where the student starts.
   *  `null` only when every submitted concept was placed (frontier is
   *  "whatever comes after the spine", left to the caller / next-action). */
  frontierConceptId: string | null;
}

/**
 * Walks `results` in the caller-supplied order (expected: WARMUP_SPINE_CONCEPTS
 * order, or a prefix of it for a "Stop here" partial run) and marks each
 * concept placed while competence holds, stopping at the first concept
 * that didn't converge with real competence. This keeps the "You're solid
 * through X" narrative monotonic — a later concept is never marked placed
 * once an earlier one wasn't, even if it independently looks converged.
 */
export function computePlacement(results: ReadonlyArray<PerConceptWarmupResult>): PlacementResult {
  const placed: string[] = [];
  let frontier: string | null = null;
  for (const r of results) {
    const demonstrated = r.converged && r.predictedSuccessAtClose >= COMPETENCE_THRESHOLD;
    if (demonstrated) {
      placed.push(r.skillId);
    } else {
      frontier = r.skillId;
      break;
    }
  }
  return { placedConceptIds: placed, frontierConceptId: frontier };
}

/**
 * Extends a set of demonstrated spine concepts with their full real
 * prerequisite closure (BFS over `getPrerequisites`, using the ACTUAL
 * concept graph, not just the curated spine) — "ancestors of the
 * placement point are inferred placed" (A8 spec). For the locked 5-concept
 * spine this is mostly a no-op (the spine is already prereq-ordered, so
 * every ancestor of a placed concept is itself an earlier spine concept
 * already in the set) — it's written generically so a future wider spine
 * or a spine reordering can't silently produce an incomplete closure.
 *
 * Deduplicated; the closure never includes concepts outside `CONCEPT_MAP`
 * (defensive — a bad/foreign id in `placedConceptIds` is simply not
 * expanded, never thrown).
 */
export function inferPlacedAncestors(placedConceptIds: ReadonlyArray<string>): string[] {
  const closure = new Set<string>(placedConceptIds);
  const queue = [...placedConceptIds];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const prereq of getPrerequisites(id)) {
      if (!closure.has(prereq.id)) {
        closure.add(prereq.id);
        queue.push(prereq.id);
      }
    }
  }
  return [...closure];
}

// ────────────────────────────────────────────────────────────────────
// Persistence — writes priors for the placed set. DB-less degrades
// honestly (mirrors every other Wave 7+ persistence seam in this repo):
// nothing is written, the caller reports `recorded: false`, never a
// fabricated success.
// ────────────────────────────────────────────────────────────────────

/** Mirrors student-model-pg.ts's MASTERY_THRESHOLDS.learningN (2) — the
 *  minimum `n` needed to clear the 'learning' mastery state. Warmup priors
 *  stamp exactly this, deliberately not higher: a warmup placement is
 *  cold-start dignity, not a substitute for real practice — the FSRS/Elo
 *  gating for anything BEYOND "no longer starved for content" still comes
 *  from real attempts. */
const PLACEMENT_N = 2;

/** Score written into the legacy `mastery_vector` for a placed concept —
 *  just above `MASTERY_MASTERED` (0.7, src/api/knowledge-routes.ts) so
 *  downstream prereq-gating unlocks correctly, while the `provenance`
 *  marker keeps the frontier's visual distinct ("placed" tint, not solid
 *  mastered green — see MasteryEntry.provenance in student-model.ts). */
const PLACEMENT_SCORE = 0.75;

export interface PersistPriorsResult {
  placed: string[];
  frontier: string | null;
  /** false on any DB-less / failed-write path — never fabricated. */
  recorded: boolean;
}

/**
 * Writes the placement as priors for `studentId`:
 *   - `student_skill_elo(rating, n)` for every placed concept, upserted
 *     with GREATEST() so a double-apply (or a student who already has
 *     real attempts) never REGRESSES an existing higher rating/n — this
 *     is what makes the endpoint idempotent (§11 states table: "double-
 *     apply … server clamps + upserts priors idempotently").
 *   - `student_model.mastery_vector[conceptId]` (legacy read model,
 *     A5-bridged into every other route) with `provenance: 'warmup_placed'`
 *     for the full inferred-ancestor closure, so T13's frontier and the
 *     A9 concept-tree endpoint render "placed" dots immediately, without
 *     waiting on the derived-model-sync bus.
 *
 * DB-less (`!process.env.DATABASE_URL`): returns `recorded: false`
 * immediately, no partial writes attempted.
 */
export async function applyWarmupPriors(
  studentId: string,
  results: ReadonlyArray<PerConceptWarmupResult>,
): Promise<PersistPriorsResult> {
  const { placedConceptIds, frontierConceptId } = computePlacement(results);
  const placed = inferPlacedAncestors(placedConceptIds);

  if (!process.env.DATABASE_URL) {
    return { placed, frontier: frontierConceptId, recorded: false };
  }

  let pool: InstanceType<typeof import('pg').default.Pool> | null = null;
  try {
    // Late imports: keep this module importable (and its pure functions
    // testable) with zero DB driver / pool side effects when nothing here
    // is called from a DB-less path.
    const pg = await import('pg');
    pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
    const { getOrCreateStudentModel, saveStudentModel } = await import('../gbrain/student-model');

    const abilityByConcept = new Map(results.map((r) => [r.skillId, r.abilityEstimate]));

    for (const conceptId of placed) {
      // Ability estimate only exists for concepts that were actually
      // probed (the spine set); inferred-ancestor concepts outside the
      // literal probe set (none exist for today's 5-concept spine, but
      // the closure is written generically) get the lowest probed
      // ability as a conservative floor rather than a guessed number.
      const rating = abilityByConcept.get(conceptId)
        ?? Math.min(...[...abilityByConcept.values()], 800);
      await pool.query(
        `INSERT INTO student_skill_elo (student_id, skill_id, rating, n, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (student_id, skill_id) DO UPDATE SET
           rating = GREATEST(student_skill_elo.rating, EXCLUDED.rating),
           n = GREATEST(student_skill_elo.n, EXCLUDED.n),
           updated_at = now()`,
        [studentId, conceptId, rating, PLACEMENT_N],
      );
    }

    // Legacy mastery_vector — provenance-stamped so T13/A9 can render the
    // "placed" (not "demonstrated") dot immediately. Never overwrites a
    // concept that already has REAL attempt history (attempts > 0 without
    // the warmup marker) — a student who has already practiced a concept
    // for real must not have that evidence silently downgraded by a later
    // warmup run.
    const model = await getOrCreateStudentModel(studentId);
    const now = new Date().toISOString();
    for (const conceptId of placed) {
      const existing = model.mastery_vector[conceptId];
      const hasRealAttempts = existing && existing.attempts > 0 && existing.provenance !== 'warmup_placed';
      if (hasRealAttempts) continue;
      model.mastery_vector[conceptId] = {
        score: Math.max(existing?.score ?? 0, PLACEMENT_SCORE),
        attempts: Math.max(existing?.attempts ?? 0, PLACEMENT_N),
        correct: Math.max(existing?.correct ?? 0, PLACEMENT_N),
        last_update: now,
        provenance: 'warmup_placed',
      };
    }
    await saveStudentModel(model);

    return { placed, frontier: frontierConceptId, recorded: true };
  } catch (err) {
    console.error(`[warmup-onboarding] persist failed for student=${studentId}:`, (err as Error).message);
    return { placed, frontier: frontierConceptId, recorded: false };
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

/** Re-exported for callers that only have the wire-format WarmupReport
 *  summaries (readiness-routes.ts's warmup/apply response shape) rather
 *  than the slightly-renamed PerConceptWarmupResult fields. */
export function reportToResult(skillId: string, report: WarmupReport): PerConceptWarmupResult {
  return {
    skillId,
    converged: report.converged,
    abilityEstimate: report.abilityEstimate,
    probesUsed: report.probesUsed,
    predictedSuccessAtClose: report.predictedSuccessAtClose,
  };
}
