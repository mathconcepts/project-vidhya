/**
 * src/curriculum/topic-namespace.ts
 *
 * The logic behind `npm run ci:topic-namespace`. Kept in src/ (with the thin
 * runner in scripts/check-topic-namespace.ts) so the vitest suite can reach
 * it. Vitest only collects test files under src/, matching how
 * src/content/variant-agreement.ts backs ci:variant-agreement.
 *
 * WHY THIS GATE EXISTS
 *
 * `ConceptNode.id` is globally unique and that uniqueness is ENFORCED —
 * `buildConceptUniverse()` in src/constants/concept-graph.ts throws at boot,
 * naming both files, if two exam packs declare the same concept id.
 *
 * `ConceptNode.topic` has no such protection. It is a free string, nothing
 * namespaces it, and nothing detects a collision. That asymmetry is the
 * single largest latent defect in the multi-exam concept graph shipped in
 * v4.84.0, because roughly twenty call sites select concepts BY TOPIC STRING
 * rather than by id. A representative sample, all of them reading the merged
 * universe with no exam filter:
 *
 *   src/constants/concept-graph.ts:getConceptsForTopic  — the root primitive
 *   src/syllabus/generator.ts                           — personalised plan scope
 *   src/api/lesson-routes.ts                            — interleaving candidates
 *   src/gbrain/student-model.ts                         — topic mastery averaging
 *   src/gbrain/operations/moat-operations.ts            — GATE marks weights
 *   src/api/concept-resolve-routes.ts                   — module-level result cache
 *
 * GATE-MA owns ten topic strings today, six of which name subject areas any
 * other Indian engineering-entrance pack would reach for first: `calculus`,
 * `linear-algebra`, `probability-statistics`, `differential-equations`,
 * `complex-variables`, `vector-calculus`. If a second pack declared
 * `topic: calculus`, every site above would silently merge two exams' concepts
 * — a GATE student's study plan would pull in JEE concepts, their topic
 * mastery would average over another exam's attempts, and no id collision
 * would ever fire to reveal it. Nothing would fail loudly.
 *
 * Scoping all twenty-odd sites is the thorough fix and is real work (several
 * have no exam id anywhere in their call chain). This gate buys the same
 * safety for a fraction of the cost by making the collision impossible
 * instead: a topic string belongs to exactly one pack. A new pack picks
 * namespaced topics (`jee-calculus`, not `calculus`) and the topic-string
 * sites keep working unmodified, because a filter on a topic only one pack
 * uses is already exam-scoped.
 *
 * This is a floor, not a ceiling. It does NOT make the topic-string sites
 * correct in general — it removes the one input that makes them wrong. The
 * per-site scoping work stays tracked in TODOS.md.
 */

import { CONCEPT_GRAPH_SOURCES, conceptsDeclaredByExam } from '../constants/concept-graph';

export interface TopicClaim {
  topic: string;
  exam_id: string;
  concept_ids: string[];
}

/**
 * Read the live merged concept graph and report, per exam pack, which topic
 * strings that pack claims and with which concepts.
 */
export function collectTopicClaims(): TopicClaim[] {
  const claims: TopicClaim[] = [];
  for (const source of CONCEPT_GRAPH_SOURCES) {
    const byTopic = new Map<string, string[]>();
    for (const concept of conceptsDeclaredByExam(source.exam_id)) {
      const list = byTopic.get(concept.topic) ?? [];
      list.push(concept.id);
      byTopic.set(concept.topic, list);
    }
    for (const [topic, concept_ids] of byTopic) {
      claims.push({ topic, exam_id: source.exam_id, concept_ids });
    }
  }
  return claims;
}

/**
 * Pure: the topics claimed by more than one pack. Exported separately from
 * collectTopicClaims so the suite can drive the failing branch with synthetic
 * claims — the real graph has one declaring pack today, so a test that only
 * ran the live path could never exercise it.
 */
export function findTopicCollisions(claims: TopicClaim[]): Array<[string, TopicClaim[]]> {
  const byTopic = new Map<string, TopicClaim[]>();
  for (const claim of claims) {
    const list = byTopic.get(claim.topic) ?? [];
    list.push(claim);
    byTopic.set(claim.topic, list);
  }
  return [...byTopic.entries()].filter(([, cs]) => cs.length > 1);
}
