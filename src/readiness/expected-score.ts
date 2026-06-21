/**
 * src/readiness/expected-score.ts — the headline north-star metric.
 *
 * Blueprint §8: "realized marks ÷ potential marks on mocks" is what
 * "scored to maximum potential" means in numbers. This module is the
 * function the cockpit hits.
 *
 * Pure logic: takes a student model + a curriculum repo and produces
 *   { realized, potential, byNode: { ... } }
 *
 * Realization formula per node:
 *   realized = sigmoid((ability - 1500) / 200) × exam_relevance × maxMarks
 *   potential = exam_relevance × maxMarks
 *
 * The sigmoid maps Elo rating to expected score share: at 1500 (avg)
 * a student earns ~50% of the available marks on questions calibrated
 * to mid-difficulty; at 1900 (strong) ~88%; at 1100 (weak) ~12%. This
 * is the same logistic the Elo expected-success formula uses.
 *
 * Why not roll this into DefaultReadinessEngine.expectedScore()?
 * Same logic, different concern: the engine wires it to live deps;
 * this module is the pure math, testable in isolation.
 *
 * The "byNode" breakdown is what powers the mock-to-marks report
 * (§2.5) — students see "you knew 8 of these and scored 5" because
 * we can compare attempted realization to predicted realization.
 */

import type { Ability, ConceptId, CurriculumRepo, StudentModel } from '../core/interfaces';

// ────────────────────────────────────────────────────────────────────
// Tuneables
// ────────────────────────────────────────────────────────────────────

/** Elo anchor — score share = 0.5 at this rating. */
export const ELO_MID = 1500;
/** Logistic slope. 200 ≈ Elo's natural scale (400 → 10:1 odds). */
export const ELO_SLOPE = 200;

/** Per-node max-marks proxy when the curriculum doesn't carry one. */
export const DEFAULT_NODE_MAX_MARKS = 4;

// ────────────────────────────────────────────────────────────────────
// Pure math (exported for tests)
// ────────────────────────────────────────────────────────────────────

/** Convert an Elo rating to expected mark share (0..1) on an avg-difficulty item. */
export function expectedShareFromRating(rating: number): number {
  return 1 / (1 + Math.exp(-(rating - ELO_MID) / ELO_SLOPE));
}

// ────────────────────────────────────────────────────────────────────
// Aggregator
// ────────────────────────────────────────────────────────────────────

export interface NodeBreakdown {
  nodeId: ConceptId;
  examRelevance: number;
  maxMarks: number;
  expectedShare: number;
  realized: number;
  potential: number;
}

export interface ExpectedScoreReport {
  realized: number;
  potential: number;
  /** Ratio in 0..1; null when potential is 0 (no curriculum data yet). */
  ratio: number | null;
  byNode: NodeBreakdown[];
}

export interface ComputeExpectedScoreDeps {
  studentModel: Pick<StudentModel, 'abilityFor'>;
  curriculum: CurriculumRepo;
  /** Restrict scoring to a course. The cockpit shows per-exam-pack scores. */
  course?: string;
}

/**
 * Compute the realized/potential headline for a student across a set of
 * curriculum nodes. The caller passes the node ids — typically the
 * full skill list for an exam pack, or just the at-risk subset for an
 * urgency view.
 */
export async function computeExpectedScore(
  studentId: string,
  nodeIds: ReadonlyArray<ConceptId>,
  deps: ComputeExpectedScoreDeps,
): Promise<ExpectedScoreReport> {
  const byNode: NodeBreakdown[] = [];
  let realizedSum = 0;
  let potentialSum = 0;

  for (const nodeId of nodeIds) {
    const node = await deps.curriculum.getNode(nodeId);
    if (!node) continue;
    if (deps.course && node.course !== deps.course) continue;

    // skill id is the node id for `skill` and `concept` nodes
    const ability: Ability = await deps.studentModel.abilityFor(studentId, nodeId);
    const share = expectedShareFromRating(ability.rating);

    // Try to read maxMarks from any practice object attached to the node.
    let maxMarks = DEFAULT_NODE_MAX_MARKS;
    try {
      const objs = await deps.curriculum.objectsForNode(nodeId, { type: 'practice' });
      if (objs.length > 0 && Number.isFinite((objs[0].payload as any)?.maxMarks)) {
        maxMarks = Number((objs[0].payload as any).maxMarks);
      }
    } catch { /* leave default */ }

    const relevance = node.examRelevance;
    const potential = relevance * maxMarks;
    const realized = share * potential;
    realizedSum += realized;
    potentialSum += potential;

    byNode.push({ nodeId, examRelevance: relevance, maxMarks, expectedShare: share, realized, potential });
  }

  const ratio = potentialSum > 0 ? realizedSum / potentialSum : null;
  return { realized: realizedSum, potential: potentialSum, ratio, byNode };
}
