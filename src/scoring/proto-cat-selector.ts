/**
 * src/scoring/proto-cat-selector.ts — Wave 4's ItemSelector impl.
 *
 * Blueprint §3.3: pick the next practice item at the desirable-difficulty
 * band (predicted success ~70–85%), constrained by curriculum coverage,
 * with light exposure control so popular items don't over-serve and leak.
 *
 * "Proto-CAT" — not formal Computerized Adaptive Testing (no IRT
 * calibration, no MLE re-estimation), but the streaming approximation:
 * given Elo ability + item difficulty, compute predicted success, keep
 * items in the band, randomly sample among the top-k most-informative
 * to avoid exposure concentration.
 *
 * Information score: a tent function peaked at success_probability = 0.5
 * (max ambiguity = max info gain), tapered to zero at 0 and 1. We then
 * REJECT items outside the success band, so the practical effect is
 * "pick the most-informative item in the desirable-difficulty zone."
 *
 * Retain mode: when `successBand[0]` is high (>= 0.85), the caller is
 * asking for an overdue-review pick — return the easiest available item
 * the student is most likely to nail, so the review feels validating
 * rather than punishing.
 *
 * Pure logic over an injected StudentModel + LearningObjectCatalog.
 * No DB. No clock. Caller provides RNG seed for deterministic tests.
 */

import { expectedSuccess } from '../gbrain/elo';
import type {
  ItemSelector,
  LearningObject,
  SelectionConstraints,
  StudentModel,
  StudentId,
  ObjectType,
} from '../core/interfaces';
import type { LearningObjectCatalog } from './learning-object-catalog';

// ────────────────────────────────────────────────────────────────────
// Tuneables — locked here so the selector doesn't silently drift.
// ────────────────────────────────────────────────────────────────────

/** Default desirable-difficulty band when caller doesn't supply one. */
export const DEFAULT_SUCCESS_BAND: readonly [number, number] = [0.7, 0.85];

/** Default top-k for exposure control. */
export const DEFAULT_EXPOSURE_K = 3;

/** Items shown more than this many times in the window get a penalty. */
export const OVEREXPOSURE_THRESHOLD = 5;

/** Item difficulty min/max we'd actually consider. Hard guardrails. */
export const DIFFICULTY_FLOOR = 600;
export const DIFFICULTY_CEILING = 2400;

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export interface ProtoCATSelectorDeps {
  studentModel: Pick<StudentModel, 'abilityFor'>;
  catalog: LearningObjectCatalog;
  /** Deterministic RNG for tests; defaults to Math.random in prod. */
  rng?: () => number;
}

export class ProtoCATSelector implements ItemSelector {
  constructor(private deps: ProtoCATSelectorDeps) {}

  async selectNext(
    studentId: StudentId,
    constraints: SelectionConstraints = {},
  ): Promise<LearningObject | null> {
    const band = constraints.successBand ?? DEFAULT_SUCCESS_BAND;
    const exposureK = Math.max(1, constraints.exposureK ?? DEFAULT_EXPOSURE_K);
    const allowedNodes = constraints.allowedNodes ?? [];
    const isRetainMode = band[0] >= 0.85;

    // Without an allowedNodes scope we can't query — selector returns null
    // and the engine falls back to diagnose.
    if (allowedNodes.length === 0) return null;

    const candidates: ScoredCandidate[] = [];

    for (const skillId of allowedNodes) {
      const ability = await this.deps.studentModel.abilityFor(studentId, skillId);

      // Translate the success band into an Elo-difficulty band the catalog
      // can filter on. Inverse logistic: solve `1 / (1 + 10^((d-a)/400)) = p`
      // for `d`, giving `d = a - 400 * log10((1-p)/p)`.
      const [pLo, pHi] = band;
      const dMin = Math.max(DIFFICULTY_FLOOR, eloFromSuccess(ability.rating, pHi));
      const dMax = Math.min(DIFFICULTY_CEILING, eloFromSuccess(ability.rating, pLo));

      const items = await this.deps.catalog.query({
        skillId,
        types: filterTypesForRetain(constraints.successBand, ['practice', 'worked_example']),
        diffMin: dMin,
        diffMax: dMax,
        limit: 50,
      });

      for (const item of items) {
        const successProb = expectedSuccess(ability.rating, item.difficulty);
        if (successProb < band[0] || successProb > band[1]) continue;

        const exposure = this.deps.catalog.exposureCount
          ? await this.deps.catalog.exposureCount(item.id)
          : 0;

        const score = scoreCandidate({
          successProb,
          exposure,
          isRetainMode,
          examRelevance: (item.payload as any)?.examRelevance ?? 0.5,
          estMinutes: item.estMinutes,
          timeBudgetMin: constraints.timeBudgetMin,
        });
        candidates.push({ item, score });
      }
    }

    if (candidates.length === 0) return null;

    // Take the top-k by score then sample one — exposure control.
    candidates.sort((a, b) => b.score - a.score);
    const topK = candidates.slice(0, exposureK);
    const rng = this.deps.rng ?? Math.random;
    const pick = topK[Math.floor(rng() * topK.length)];
    return pick.item;
  }
}

interface ScoredCandidate {
  item: LearningObject;
  score: number;
}

// ────────────────────────────────────────────────────────────────────
// Pure helpers (exported for tests)
// ────────────────────────────────────────────────────────────────────

/**
 * Inverse Elo: at what item difficulty does this ability rating have
 * a predicted success of `p`?
 */
export function eloFromSuccess(abilityRating: number, p: number): number {
  // expectedSuccess: p = 1 / (1 + 10^((d-a)/400))
  // Rearrange:        10^((d-a)/400) = (1-p)/p
  //                  (d-a)/400      = log10((1-p)/p)
  //                  d              = a + 400 * log10((1-p)/p)
  // Sanity: p>0.5 means log10(...) < 0 → d < a (item easier than student).
  const clamped = Math.min(0.999, Math.max(0.001, p));
  return abilityRating + 400 * Math.log10((1 - clamped) / clamped);
}

/**
 * Tent-shape information score peaked at p=0.5. Outside the desirable
 * band, the selector already filtered, so within band we still want
 * the item closest to maximum information — that's the one that
 * confirms or denies our ability estimate fastest.
 */
function infoScore(p: number): number {
  return Math.max(0, 1 - 2 * Math.abs(p - 0.5));
}

interface ScoreArgs {
  successProb: number;
  exposure: number;
  isRetainMode: boolean;
  examRelevance: number;
  estMinutes: number;
  timeBudgetMin?: number;
}

/**
 * Composite score combining information value, exam-relevance, exposure
 * penalty, and time-fit. Exported so tests can pin the ordering.
 */
export function scoreCandidate(args: ScoreArgs): number {
  // Retain mode flips the info heuristic: we want HIGH-recall items,
  // not maximally ambiguous ones. Score by success probability directly.
  const infoComponent = args.isRetainMode
    ? args.successProb
    : infoScore(args.successProb);

  const exposurePenalty = args.exposure >= OVEREXPOSURE_THRESHOLD
    ? Math.pow(0.7, args.exposure - OVEREXPOSURE_THRESHOLD + 1)
    : 1.0;

  const timeFit = args.timeBudgetMin !== undefined && args.estMinutes > args.timeBudgetMin
    ? 0.3                       // doesn't fit; heavy penalty but not zero
    : 1.0;

  return infoComponent * args.examRelevance * exposurePenalty * timeFit;
}

function filterTypesForRetain(
  band: readonly [number, number] | undefined,
  defaults: ObjectType[],
): ObjectType[] {
  // No filtering yet — retain mode still uses practice/worked_example.
  // Hook is here for the future "give a story / manim hint on retain".
  return defaults;
}

/** Convenience factory. */
export function makeProtoCATSelector(deps: ProtoCATSelectorDeps): ItemSelector {
  return new ProtoCATSelector(deps);
}
