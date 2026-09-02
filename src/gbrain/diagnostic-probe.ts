/**
 * src/gbrain/diagnostic-probe.ts
 *
 * docs/designs/2026-09-02-content-strategy-research-integration-plan.md
 * (P6, follow-up named in TODOS.md): the research framework's backward
 * diagnostic algorithm (docs/content-spec/adaptive-content-generation-
 * framework.md §10) is:
 *
 *   1. validate item quality and target mapping
 *   2. identify the failed target atomic node
 *   3. filter the graph by learner paper, year and official scope
 *   4. traverse incoming edges to a BOUNDED depth
 *   5. RANK candidate prerequisites by edge confidence and learner evidence
 *   6. choose the SMALLEST DISCRIMINATING PROBE
 *   7. test target/prerequisite/representation/mode/constraint hypotheses
 *   8. require CONVERGING EVIDENCE before declaring a root-cause hypothesis
 *   9. attach the smallest bridge delta
 *  10. check immediately, after delay and on changed surface
 *  11. update learner state and store the graph path shown
 *
 * `traceWeakestPrerequisite` (src/constants/concept-graph.ts) is Vidhya's
 * existing mechanism and stays exactly as-is — it is the LIVE path
 * `src/gbrain/student-model.ts`'s `refreshPrerequisiteAlerts` writes real
 * prerequisite_alerts from, gating real interventions for real students.
 * Changing its behavior is out of scope for an infrastructure pass: a
 * regression there is student-facing. This module is ADDITIVE — a second,
 * bounded, ranked view for on-demand diagnosis (wired into `student-audit`,
 * below), never a replacement, and it changes nothing the live path reads.
 *
 * What this module implements: steps 4-6 and 8 above, honestly scoped.
 * Steps 1-3 (item/scope validation) and 7/9-11 (an interactive probe loop,
 * a bridge-delta attachment, and a check-after-delay schedule) need a live
 * interaction with a specific student attempt and a delta-composition
 * pipeline this pass doesn't build — see TODOS.md for what's still open.
 * This module answers one narrower, real question well: given a target
 * concept and a mastery vector, which ONE upstream concept is the smallest
 * discriminating thing to test next, and is there even enough evidence to
 * recommend one at all?
 */

import { CONCEPT_MAP, type ConceptNode } from '../constants/concept-graph';
import { FIRE_MAX_DEPTH } from './fire';

export interface DiagnosticCandidate {
  concept_id: string;
  label: string;
  /** Graph distance from the target concept (1 = direct prerequisite). */
  distance: number;
  mastery: number;
}

export interface DiagnosticProbeResult {
  target_concept_id: string;
  target_mastery: number;
  /**
   * False when the target itself isn't actually weak — recommending a
   * prerequisite probe from a single ambiguous signal is exactly the
   * overclaim research step 8 exists to prevent. See `reason`.
   */
  evidence_sufficient: boolean;
  reason: string;
  /** Every prerequisite within maxDepth, weak or not, ranked closest+weakest first. */
  candidates: DiagnosticCandidate[];
  /** The single smallest discriminating probe to test next, or null when evidence_sufficient is false or no candidate is weak. */
  recommended_probe: DiagnosticCandidate | null;
}

export interface DiagnosticProbeOptions {
  /** Mastery below this counts as "weak" for both the target and candidates. Matches traceWeakestPrerequisite's default. */
  threshold?: number;
  /** How many prerequisite hops upstream to traverse. Defaults to FIRe's own bound (src/gbrain/fire.ts) — one bounded-depth convention across the codebase, not two independently-tuned numbers. */
  maxDepth?: number;
}

const DEFAULT_THRESHOLD = 0.3;

function masteryOf(masteryVector: Record<string, { score: number }>, conceptId: string): number {
  return masteryVector[conceptId]?.score ?? 0;
}

/**
 * Bounded-depth backward traversal from `targetConceptId`, ranked by
 * distance (closer = more likely direct cause) then by mastery ascending
 * (weaker = more suspicious) within the same distance — research step 5's
 * "edge confidence and learner evidence" read literally: confidence is
 * approximated by graph proximity (no separate edge-confidence data exists
 * in the graph today), evidence by the stored mastery score.
 *
 * Pure, synchronous, no I/O — same discipline as pedagogy-engine.ts's
 * selectAtoms() and traceWeakestPrerequisite() itself.
 */
export function diagnoseWrongAnswer(
  targetConceptId: string,
  masteryVector: Record<string, { score: number }>,
  opts: DiagnosticProbeOptions = {},
): DiagnosticProbeResult {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const maxDepth = opts.maxDepth ?? FIRE_MAX_DEPTH;
  const target_mastery = masteryOf(masteryVector, targetConceptId);

  // Bounded-depth BFS over incoming prerequisite edges, recording the FIRST
  // (shortest) distance each concept is reached at — a concept reachable via
  // two paths is ranked by its closest one, not double-counted.
  const distanceOf = new Map<string, number>();
  let frontier = [targetConceptId];
  distanceOf.set(targetConceptId, 0);
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const conceptId of frontier) {
      const node = CONCEPT_MAP.get(conceptId);
      if (!node) continue;
      for (const prereqId of node.prerequisites) {
        if (distanceOf.has(prereqId)) continue;
        distanceOf.set(prereqId, depth);
        next.push(prereqId);
      }
    }
    frontier = next;
  }
  distanceOf.delete(targetConceptId);

  const candidates: DiagnosticCandidate[] = [];
  for (const [conceptId, distance] of distanceOf) {
    const node = CONCEPT_MAP.get(conceptId) as ConceptNode | undefined;
    if (!node) continue;
    candidates.push({ concept_id: conceptId, label: node.label, distance, mastery: masteryOf(masteryVector, conceptId) });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.mastery - b.mastery);

  // Step 8 — converging evidence gate. A student can fail one question for
  // many reasons unrelated to a prerequisite gap (a careless slip, an
  // unfamiliar representation, time pressure) — recommending a specific
  // prerequisite probe needs the target concept's OWN mastery to actually
  // be weak first. A single well-mastered concept having one bad attempt is
  // not evidence of a prerequisite hole.
  if (target_mastery >= threshold) {
    return {
      target_concept_id: targetConceptId,
      target_mastery,
      evidence_sufficient: false,
      reason: `target concept mastery (${target_mastery.toFixed(2)}) is at or above the weak threshold (${threshold}) — one wrong answer on an otherwise-mastered concept is not evidence of a prerequisite gap`,
      candidates,
      recommended_probe: null,
    };
  }

  const weakCandidates = candidates.filter((c) => c.mastery < threshold);
  if (weakCandidates.length === 0) {
    return {
      target_concept_id: targetConceptId,
      target_mastery,
      evidence_sufficient: false,
      reason: 'target concept is weak, but no prerequisite within the bounded traversal is also weak — the gap is likely in the target concept itself, not upstream',
      candidates,
      recommended_probe: null,
    };
  }

  // Step 6 — smallest discriminating probe: already sorted closest+weakest
  // first, so the head of the ranked, weak-only list is the single best
  // next question to ask.
  return {
    target_concept_id: targetConceptId,
    target_mastery,
    evidence_sufficient: true,
    reason: `target concept is weak (${target_mastery.toFixed(2)}) AND ${weakCandidates.length} upstream prerequisite(s) within ${maxDepth} hop(s) are also weak — converging evidence for a prerequisite-gap hypothesis`,
    candidates,
    recommended_probe: weakCandidates[0],
  };
}
