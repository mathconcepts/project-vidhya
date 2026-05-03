/**
 * Exam-fit scorer (Layer 2, weight 0.05).
 *
 * Each exam has natural atom-type preferences:
 *   - GATE-MA (mcq-rigorous): formal_definition + worked_example score high;
 *     intuition + visual_analogy score moderate; common_traps high (timed exam).
 *   - JEE Main (mcq-and-numerical): worked_example + practice score high;
 *     formal_definition moderate; visual_analogy moderate.
 *   - NEET-bio (descriptive-recall): intuition + retrieval_prompt high.
 *
 * v1 hardcodes the preferences; v2 can read from exam_packs.config.
 *
 * Pure function. Smallest weight in the layer mix because the signal is
 * coarse (per-exam, not per-student, not per-concept).
 */

import { getExam } from '../../curriculum/exam-loader';
import type { AtomShape, RankingContext } from '../types';

const EXAM_TYPE_AFFINITY: Record<string, Record<string, number>> = {
  // mcq-rigorous: rigor first
  'mcq-rigorous': {
    formal_definition: 1.0,
    worked_example: 0.95,
    common_traps: 0.85,
    practice: 0.80,
    intuition: 0.55,
    visual_analogy: 0.50,
    retrieval_prompt: 0.40,
    interactive_walkthrough: 0.65,
    interactive_manipulable: 0.50,
    interactive_simulation: 0.45,
  },
  // mcq-and-numerical: speed + procedure
  'mcq-and-numerical': {
    worked_example: 1.0,
    practice: 0.95,
    formal_definition: 0.70,
    common_traps: 0.85,
    intuition: 0.50,
    visual_analogy: 0.55,
    retrieval_prompt: 0.45,
    interactive_walkthrough: 0.75,
    interactive_manipulable: 0.55,
    interactive_simulation: 0.50,
  },
  // mcq-fast: pure recognition
  'mcq-fast': {
    retrieval_prompt: 1.0,
    common_traps: 0.85,
    formal_definition: 0.70,
    practice: 0.65,
    worked_example: 0.55,
    intuition: 0.50,
    visual_analogy: 0.45,
  },
  // subjective formats prefer narrative atoms
  'subjective-short': {
    intuition: 0.95,
    formal_definition: 0.85,
    worked_example: 0.80,
    visual_analogy: 0.60,
    common_traps: 0.50,
    practice: 0.40,
    retrieval_prompt: 0.30,
  },
  'subjective-long': {
    intuition: 1.0,
    formal_definition: 0.90,
    worked_example: 0.85,
    visual_analogy: 0.65,
    common_traps: 0.45,
    practice: 0.35,
    retrieval_prompt: 0.25,
  },
  // Default: balanced affinities
  '_default': {
    formal_definition: 0.70,
    worked_example: 0.70,
    practice: 0.70,
    intuition: 0.65,
    visual_analogy: 0.60,
    common_traps: 0.65,
    retrieval_prompt: 0.50,
  },
};

export function scoreByExamFit(
  atoms: AtomShape[],
  ctx: RankingContext,
): Map<string, number> {
  const out = new Map<string, number>();
  const exam = getExam(ctx.exam_pack_id);
  const scope = exam?.metadata.scope ?? '_default';
  const affinities = EXAM_TYPE_AFFINITY[scope] ?? EXAM_TYPE_AFFINITY._default;
  for (const a of atoms) {
    const v = affinities[a.atom_type];
    out.set(a.id, typeof v === 'number' ? v : 0.5);
  }
  return out;
}
