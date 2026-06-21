/**
 * src/readiness/mock-to-marks.ts — the Extraction-half deliverable.
 *
 * Blueprint §2.5 / §3.5: after any mock the report isn't just a score,
 * it's "you knew 8 of these and scored 5 — here are the 3 marks lost
 * to mechanics, and the drill to stop it."
 *
 * Pure function over a list of Attempts (which carry partial-marks +
 * errorTags). Produces:
 *
 *   - earned: marks actually awarded
 *   - knewIt: marks the student would have earned with no slips
 *   - leftOnTable: knewIt - earned  (the Extraction gap)
 *   - lossByErrorType: how the gap breaks down across careless modes
 *   - byNode: per-skill breakdown (what to drill next)
 *   - topDrillRecommendation: the one error tag that wins the most marks back
 *
 * "Knew it" is operationalised as: any attempt with partial marks
 * > 0 OR errorTags including 'careless'/'sign'/'unit'/'misread'/
 * 'transcription' (signals the student had the right method).
 * 'method' tag means they didn't know it; not in the knew-it bucket.
 *
 * The student-facing UI reads `topDrillRecommendation` and points them
 * at the matching error drill — closing the loop §2.5 promises.
 */

import type { Attempt, ErrorTag, SkillId } from '../core/interfaces';

const KNEW_IT_TAGS: ReadonlyArray<ErrorTag> = [
  'sign', 'unit', 'misread', 'transcription', 'careless',
];

export interface NodeMockSummary {
  skillId: SkillId;
  attempts: number;
  earned: number;
  maxAvailable: number;
  /** Marks earnable had the careless errors not occurred. */
  knewIt: number;
}

export interface MockToMarksReport {
  earned: number;
  knewIt: number;
  leftOnTable: number;
  maxAvailable: number;
  lossByErrorType: Partial<Record<ErrorTag, number>>;
  byNode: NodeMockSummary[];
  /** The error tag that recovers the most marks; null if none clear. */
  topDrillRecommendation: ErrorTag | null;
  /** Plain-English headline ready for the student UI. */
  headline: string;
}

// ────────────────────────────────────────────────────────────────────
// Pure aggregator
// ────────────────────────────────────────────────────────────────────

export function summarizeMock(attempts: ReadonlyArray<Attempt>): MockToMarksReport {
  let earned = 0;
  let maxAvailable = 0;
  let knewIt = 0;

  const lossByErrorType: Partial<Record<ErrorTag, number>> = {};
  const byNodeMap = new Map<SkillId, NodeMockSummary>();

  for (const a of attempts) {
    const partial = a.partialMarks;
    const gotMarks = partial?.earned ?? (a.correct ? 1 : 0);
    const maxMarks = partial?.max ?? 1;
    earned += gotMarks;
    maxAvailable += maxMarks;

    const tags = a.errorTags ?? [];
    const carelessTags = tags.filter(t => KNEW_IT_TAGS.includes(t));
    const isKnewItSlip = !a.correct && carelessTags.length > 0;
    if (isKnewItSlip) {
      knewIt += maxMarks;            // they had the method; would have scored full
      const lost = maxMarks - gotMarks;
      // Attribute the loss to each careless tag evenly — students see "sign error
      // cost you N marks", not "sign error + unit error cost you N/2 each".
      const perTagLoss = lost / carelessTags.length;
      for (const t of carelessTags) {
        lossByErrorType[t] = (lossByErrorType[t] ?? 0) + perTagLoss;
      }
    } else {
      knewIt += gotMarks;              // baseline: what they actually got is what they "knew"
    }

    // per-skill rollup
    const cur = byNodeMap.get(a.skillId) ?? {
      skillId: a.skillId, attempts: 0, earned: 0, maxAvailable: 0, knewIt: 0,
    };
    cur.attempts += 1;
    cur.earned += gotMarks;
    cur.maxAvailable += maxMarks;
    cur.knewIt += isKnewItSlip ? maxMarks : gotMarks;
    byNodeMap.set(a.skillId, cur);
  }

  const leftOnTable = Math.max(0, knewIt - earned);

  // Top drill = error type with the largest reclaimable marks.
  let topDrillRecommendation: ErrorTag | null = null;
  let topLoss = 0;
  for (const [tag, loss] of Object.entries(lossByErrorType)) {
    if ((loss ?? 0) > topLoss) {
      topLoss = loss ?? 0;
      topDrillRecommendation = tag as ErrorTag;
    }
  }

  const headline = buildHeadline({ earned, knewIt, leftOnTable, topDrillRecommendation });

  return {
    earned: round1(earned),
    knewIt: round1(knewIt),
    leftOnTable: round1(leftOnTable),
    maxAvailable: round1(maxAvailable),
    lossByErrorType: Object.fromEntries(
      Object.entries(lossByErrorType).map(([k, v]) => [k, round1(v ?? 0)]),
    ) as Partial<Record<ErrorTag, number>>,
    byNode: Array.from(byNodeMap.values()).map(s => ({
      ...s,
      earned: round1(s.earned),
      maxAvailable: round1(s.maxAvailable),
      knewIt: round1(s.knewIt),
    })),
    topDrillRecommendation,
    headline,
  };
}

function buildHeadline(args: {
  earned: number; knewIt: number; leftOnTable: number; topDrillRecommendation: ErrorTag | null;
}): string {
  if (args.leftOnTable < 0.5) {
    return `You scored ${round1(args.earned)} marks — extracted everything you knew. Clean run.`;
  }
  const drill = args.topDrillRecommendation
    ? ` Mostly ${args.topDrillRecommendation} errors — drill that.`
    : '';
  return `You knew ${round1(args.knewIt)} marks of work and scored ${round1(args.earned)}.` +
    ` Left ${round1(args.leftOnTable)} on the table.${drill}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
