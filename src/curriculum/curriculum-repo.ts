/**
 * src/curriculum/curriculum-repo.ts — Wave 7: first concrete CurriculumRepo.
 *
 * Backed by `src/constants/concept-graph.ts` (`ALL_CONCEPTS` / `CONCEPT_MAP` /
 * `getPrerequisites`) — the ~80-node GATE Engineering Mathematics concept
 * dependency graph, organized under 10 topics (calculus, linear-algebra,
 * differential-equations, probability, complex, numerical, transforms,
 * vector-calc, discrete, graph). Each concept already carries a real
 * `prerequisites: string[]` edge list and a `gate_frequency` signal.
 *
 * Deviation from the task brief: the brief pointed at
 * `src/constants/topics.ts` for "the 10 GATE topics" with "prereqs [] unless
 * real prereq data exists." Investigation found `topics.ts` is dead code
 * (flagged for removal, zero consumers) that just re-wraps the *exam-scoped*
 * `topic-adapter.ts` (itself YAML-driven per exam, no prereq data at all).
 * The actual richest honest source is `concept-graph.ts`, which DOES carry
 * real prereq edges per concept — using it instead of the empty-prereqs
 * fallback is a strictly more honest mapping, per the task's own tie-break
 * rule ("simplest honest mapping wins"). The 10 topics still show up here
 * as the coarser `kind: 'exam_topic'` layer (see `topicNodes()` below); the
 * ~80 concepts are the `kind: 'skill'` layer the readiness engine actually
 * reasons over (StudentModel abilities are tracked per skill/concept id,
 * not per topic).
 *
 * Mapping onto `CurriculumNode` (src/core/interfaces.ts):
 *   - id             → ConceptNode.id (concept) or topic slug (topic node)
 *   - course         → fixed 'gate-ma' (the only course this graph covers)
 *   - kind           → 'skill' for concepts, 'exam_topic' for the 10 topics
 *   - title          → ConceptNode.label / topic slug title-cased
 *   - prereqs        → ConceptNode.prerequisites (real edges) / [] for topics
 *   - examRelevance  → gate_frequency mapped to a 0..1 scalar
 *                        high → 0.9, medium → 0.6, low → 0.35, rare → 0.15
 *   - gapClass       → left undefined; no gap-analysis signal wired yet
 *
 * `objectsForNode` has no learning-object store to draw from at the
 * concept-graph layer (concept-graph.ts is pure static metadata, not
 * content). It delegates to the injected `LearningObjectCatalog` — same
 * catalog the ItemSelector already queries (Wave 7 wires
 * `PgLearningObjectCatalog` at boot; DB-less falls back to an empty list,
 * never throws) — translating the `type`/`diffMin`/`diffMax` filter into a
 * `CatalogQuery` scoped to this node's skill id.
 *
 * A future phase should replace this with a real curriculum-graph table
 * (concept nodes + prereq edges + exam-relevance weights persisted in
 * Postgres, editable by curriculum admins) instead of the static TS array,
 * and extend coverage beyond GATE Engineering Mathematics to other exams.
 */

import {
  ALL_CONCEPTS,
  CONCEPT_MAP,
  getConceptsForTopic,
  getPrerequisites,
  type ConceptNode,
} from '../constants/concept-graph';
import type {
  ConceptId,
  CurriculumNode,
  CurriculumRepo,
  LearningObject,
  ObjectType,
} from '../core/interfaces';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';

/** The only course this static graph covers today. */
export const GATE_MA_COURSE = 'gate-ma';

/** gate_frequency → examRelevance (0..1). Locked here so callers can't drift. */
const FREQUENCY_RELEVANCE: Record<ConceptNode['gate_frequency'], number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.35,
  rare: 0.15,
};

/** The 10 topic slugs this graph is organized under (derived, not hand-typed). */
export const GATE_TOPIC_IDS: readonly string[] = Array.from(
  new Set(ALL_CONCEPTS.map(c => c.topic)),
);

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function conceptToNode(c: ConceptNode): CurriculumNode {
  return {
    id: c.id,
    course: GATE_MA_COURSE,
    kind: 'skill',
    title: c.label,
    prereqs: c.prerequisites,
    examRelevance: FREQUENCY_RELEVANCE[c.gate_frequency],
  };
}

/** Coarse topic-level node — averages its concepts' relevance. */
function topicToNode(topic: string): CurriculumNode {
  const concepts = getConceptsForTopic(topic);
  const avgRelevance = concepts.length > 0
    ? concepts.reduce((s, c) => s + FREQUENCY_RELEVANCE[c.gate_frequency], 0) / concepts.length
    : 0.5;
  return {
    id: topic,
    course: GATE_MA_COURSE,
    kind: 'exam_topic',
    title: titleCase(topic),
    prereqs: [],
    examRelevance: avgRelevance,
  };
}

export interface ConceptGraphCurriculumRepoDeps {
  /**
   * Learning-object store `objectsForNode` delegates to. Defaults to an
   * empty in-memory catalog so DB-less boots degrade honestly (no objects,
   * never throws) rather than requiring every caller to inject one.
   */
  catalog: LearningObjectCatalog;
}

export class ConceptGraphCurriculumRepo implements CurriculumRepo {
  constructor(private deps: ConceptGraphCurriculumRepoDeps) {}

  async getNode(nodeId: ConceptId): Promise<CurriculumNode | null> {
    const concept = CONCEPT_MAP.get(nodeId);
    if (concept) return conceptToNode(concept);
    if (GATE_TOPIC_IDS.includes(nodeId)) return topicToNode(nodeId);
    return null;
  }

  async prereqsOf(nodeId: ConceptId): Promise<CurriculumNode[]> {
    // Topic-level nodes carry no prereqs in this graph (topics don't
    // depend on other topics here — only concepts depend on concepts).
    return getPrerequisites(nodeId).map(conceptToNode);
  }

  async objectsForNode(
    nodeId: ConceptId,
    filter?: { type?: ObjectType; diffMin?: number; diffMax?: number },
  ): Promise<LearningObject[]> {
    return this.deps.catalog.query({
      skillId: nodeId,
      types: filter?.type ? [filter.type] : undefined,
      diffMin: filter?.diffMin,
      diffMax: filter?.diffMax,
    });
  }
}

/** Convenience factory — mirrors the `make*` naming used across src/readiness and src/teaching. */
export function makeConceptGraphCurriculumRepo(deps: ConceptGraphCurriculumRepoDeps): CurriculumRepo {
  return new ConceptGraphCurriculumRepo(deps);
}

/** All 10 topic ids as `CurriculumNode`s (kind 'exam_topic') — test/inspection helper. */
export function allTopicNodes(): CurriculumNode[] {
  return GATE_TOPIC_IDS.map(topicToNode);
}

/** All ~80 concept ids as `CurriculumNode`s (kind 'skill') — test/inspection helper. */
export function allConceptNodes(): CurriculumNode[] {
  return ALL_CONCEPTS.map(conceptToNode);
}
