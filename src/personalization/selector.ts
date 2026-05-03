/**
 * src/personalization/selector.ts
 *
 * The PersonalizedSelector — public entry point. Given a list of atoms
 * (typically returned by loadConceptAtoms()) and a RankingContext,
 * returns the same atoms RE-ORDERED by personalized score with
 * recently-seen atoms hard-dropped (with progressive dedup backoff).
 *
 * For ab_bucket = 'control', returns the input atoms unchanged. The
 * selector is the SOLE behavioural difference between control and
 * treatment cohorts.
 *
 * Eng-review locked behaviour:
 *   - 6-layer weighted-sum scoring (layers + weights in types.ts)
 *   - Dedup is a hard floor with progressive backoff (7d → 3d → 1d → 0d)
 *   - Realtime layer never persists (see scorers/realtime-nudge.ts)
 *   - No frontend imports from this module (verified by surveillance test)
 */

import { LAYER_WEIGHTS, type AtomShape, type RankingContext, type ScoredAtom } from './types';
import { scoreBySyllabus } from './scorers/syllabus-fit';
import { scoreByExamFit } from './scorers/exam-fit';
import { scoreByCohortLift } from './scorers/cohort-lift';
import { scoreByUserMastery } from './scorers/user-mastery-match';
import { scoreByUserError } from './scorers/user-error-match';
import { scoreByRealtime } from './scorers/realtime-nudge';
import { recentlySeen, DEFAULT_DEDUP_DAYS } from './dedup';

/**
 * Public entry. Re-orders + dedups atoms per the locked architecture.
 */
export async function applyPersonalizedRanking(
  atoms: AtomShape[],
  ctx: RankingContext,
): Promise<AtomShape[]> {
  // Control bucket → no-op. Treatment is the experimental condition.
  if (ctx.ab_bucket === 'control' || atoms.length === 0) return atoms;

  // Run all 6 scorers in parallel — pure functions over the input set
  // and (for the DB-backed ones) bounded read-only queries.
  const [syllabus, exam, cohort, userMastery, userError, realtime] = await Promise.all([
    Promise.resolve(scoreBySyllabus(atoms, ctx)),
    Promise.resolve(scoreByExamFit(atoms, ctx)),
    scoreByCohortLift(atoms, ctx),
    scoreByUserMastery(atoms, ctx),
    scoreByUserError(atoms, ctx),
    Promise.resolve(scoreByRealtime(atoms, ctx)),
  ]);

  // Compute combined score per atom
  const scored: ScoredAtom[] = atoms.map((a) => {
    const layers = {
      syllabus: syllabus.get(a.id) ?? 0,
      exam: exam.get(a.id) ?? 0,
      cohort: cohort.get(a.id) ?? 0,
      user_mastery: userMastery.get(a.id) ?? 0,
      user_error: userError.get(a.id) ?? 0,
      realtime: realtime.get(a.id) ?? 0,
    };
    const score =
      layers.syllabus * LAYER_WEIGHTS.syllabus +
      layers.exam * LAYER_WEIGHTS.exam +
      layers.cohort * LAYER_WEIGHTS.cohort +
      layers.user_mastery * LAYER_WEIGHTS.user_mastery +
      layers.user_error * LAYER_WEIGHTS.user_error +
      layers.realtime * LAYER_WEIGHTS.realtime;
    return { atom: a, score, layers, dropped_by_dedup: false };
  });

  // Progressive dedup backoff — try 7-day window first, shrink if it
  // would drop everything, until at least 1 atom survives.
  const survivors = await applyDedupWithBackoff(scored, ctx);

  // Sort by score descending; stable on ties (input order preserved).
  survivors.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Stable tie-break: original index
    return atoms.indexOf(a.atom) - atoms.indexOf(b.atom);
  });

  // Optional debug log — only when the env flag is set; never reaches
  // the student response. The surveillance-cliff invariant tests
  // verify no public route exposes the per-atom layers.
  if (process.env.LOG_PERSONALIZATION === 'on') {
    for (const s of survivors) {
      console.log(
        `[personalization] atom=${s.atom.id} score=${s.score.toFixed(3)} ` +
          `layers=${JSON.stringify(s.layers)}`,
      );
    }
  }

  return survivors.map((s) => s.atom);
}

/**
 * Try the configured dedup window first; if it would drop every atom,
 * shrink to 3 days, then 1 day, then 0 (no dedup). Always returns at
 * least one atom when the input was non-empty.
 */
async function applyDedupWithBackoff(
  scored: ScoredAtom[],
  ctx: RankingContext,
): Promise<ScoredAtom[]> {
  const windows = [DEFAULT_DEDUP_DAYS, 3, 1, 0];
  for (const win of windows) {
    if (win === 0) {
      // Last resort: no dedup. Mark nothing dropped.
      return scored;
    }
    const seenIds = await recentlySeen(scored.map((s) => s.atom), ctx, win);
    const survivors = scored.filter((s) => !seenIds.has(s.atom.id));
    if (survivors.length > 0) {
      return survivors;
    }
    // empty → loop and try a shorter window
  }
  return scored;
}

// Exported for tests
export const __testing = { applyDedupWithBackoff };
