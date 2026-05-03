/**
 * Syllabus-fit scorer (Layer 1, weight 0.10).
 *
 * Reads the static `concept_links` weight from the exam YAML pack — heavier-
 * weighted concepts in the syllabus contribute more. This is the lowest-
 * variance signal: same for every student, same for every session.
 *
 * Pure function over the exam-loader's output; no DB.
 */

import { getExam } from '../../curriculum/exam-loader';
import type { AtomShape, RankingContext } from '../types';

/**
 * Returns syllabus weight ∈ [0, 1] for each atom's concept. Atoms whose
 * concept is not in the exam's syllabus get 0 (neutral).
 */
export function scoreBySyllabus(
  atoms: AtomShape[],
  ctx: RankingContext,
): Map<string, number> {
  const out = new Map<string, number>();
  const exam = getExam(ctx.exam_pack_id);
  if (!exam) {
    for (const a of atoms) out.set(a.id, 0);
    return out;
  }
  // Build a (concept_id → max-weight) map from concept_links
  const conceptWeight = new Map<string, number>();
  for (const link of exam.concept_links) {
    const cur = conceptWeight.get(link.concept_id) ?? 0;
    if (link.weight > cur) conceptWeight.set(link.concept_id, link.weight);
  }
  // Normalize: max weight in the exam → 1.0; everything else proportional.
  let maxW = 0;
  for (const w of conceptWeight.values()) if (w > maxW) maxW = w;
  for (const a of atoms) {
    const w = conceptWeight.get(a.concept_id) ?? 0;
    out.set(a.id, maxW > 0 ? w / maxW : 0);
  }
  return out;
}
