// @ts-nocheck
/**
 * Concept ↔ Exam Mapper
 *
 * Bidirectional lookups between concepts and exams. The shared-concept
 * strategy: one concept, many exams, each with its own ConceptExamLink.
 *
 * Built on top of exam-loader; cached in a flat Map after first query.
 */

import { loadAllExams, getExam } from './exam-loader';
import type {
  ConceptExamLink,
  ConceptDepth,
  CurriculumContext,
  ExamDefinition,
} from './types';

// ============================================================================
// Indexes built once (lazy)
// ============================================================================

interface Indexes {
  /** concept_id → array of (exam_id, link) */
  byConcept: Map<string, Array<{ exam_id: string; link: ConceptExamLink }>>;
  /** (concept_id, exam_id) → link */
  byPair: Map<string, ConceptExamLink>;
}

let _indexes: Indexes | null = null;

function buildIndexes(): Indexes {
  const byConcept = new Map<string, Array<{ exam_id: string; link: ConceptExamLink }>>();
  const byPair = new Map<string, ConceptExamLink>();

  for (const [exam_id, exam] of loadAllExams()) {
    for (const link of exam.concept_links) {
      const list = byConcept.get(link.concept_id) || [];
      list.push({ exam_id, link });
      byConcept.set(link.concept_id, list);
      byPair.set(`${link.concept_id}|${exam_id}`, link);
    }
  }
  return { byConcept, byPair };
}

function indexes(): Indexes {
  if (_indexes) return _indexes;
  _indexes = buildIndexes();
  return _indexes;
}

/** Reset caches — used after hot-reloading exam files */
export function resetCurriculumCache(): void {
  _indexes = null;
  // exam-loader has its own cache; force reload there too
  loadAllExams(true);
}

// ============================================================================
// Queries
// ============================================================================

/** Get the link describing how a concept appears in a specific exam */
export function getConceptLink(concept_id: string, exam_id: string): ConceptExamLink | null {
  return indexes().byPair.get(`${concept_id}|${exam_id}`) || null;
}

/** Get all exams that cover a concept, with the per-exam link details */
export function getExamsForConcept(concept_id: string): Array<{ exam_id: string; link: ConceptExamLink }> {
  return indexes().byConcept.get(concept_id) || [];
}

/** Get all concept_ids in a given exam (order preserved from YAML) */
export function getConceptsInExam(exam_id: string): string[] {
  const exam = getExam(exam_id);
  if (!exam) return [];
  return exam.concept_links.map(l => l.concept_id);
}

/**
 * Check whether a concept is on the syllabus for an exam.
 * Used by guardrails for fast-path filtering.
 */
export function isConceptInExam(concept_id: string, exam_id: string): boolean {
  return !!getConceptLink(concept_id, exam_id);
}

/**
 * Find the set of exams that BOTH cover a given concept. Useful when a
 * student signals they're prepping for multiple exams.
 */
export function findOverlappingExams(concept_id: string, candidate_exam_ids: string[]): string[] {
  const all = new Set(getExamsForConcept(concept_id).map(e => e.exam_id));
  return candidate_exam_ids.filter(id => all.has(id));
}

// ============================================================================
// Depth → difficulty ceiling
// ============================================================================

const DEPTH_TO_MAX_DIFFICULTY: Record<ConceptDepth, number> = {
  'introductory': 0.4,
  'standard': 0.7,
  'advanced': 0.95,
};

export function depthToMaxDifficulty(depth: ConceptDepth): number {
  return DEPTH_TO_MAX_DIFFICULTY[depth] ?? 0.7;
}

// ============================================================================
// Curriculum context — the filter bag the Lesson composer consumes
// ============================================================================

/**
 * Build the curriculum filter context for (concept × exam). If the concept
 * is not in the exam, returns a context with link=null — the composer
 * can then decide whether to fall back or refuse.
 *
 * When exam_id is undefined, returns a permissive context (all content
 * allowed) — this is the anonymous/no-exam case.
 */
export function buildContext(concept_id: string, exam_id?: string): CurriculumContext {
  if (!exam_id) {
    return {
      exam_id: '',
      concept_id,
      link: null,
      allowed_difficulty_max: 0.95,
      allowed_emphasis: [],
      restrictions: [],
    };
  }
  const link = getConceptLink(concept_id, exam_id);
  if (!link) {
    // Concept not in this exam — composer should either fall back to
    // permissive mode or refuse; we return restrictive context.
    return {
      exam_id,
      concept_id,
      link: null,
      allowed_difficulty_max: 0.3,
      allowed_emphasis: [],
      restrictions: ['concept-not-in-exam'],
    };
  }
  return {
    exam_id,
    concept_id,
    link,
    allowed_difficulty_max: depthToMaxDifficulty(link.depth),
    allowed_emphasis: link.emphasis.slice(),
    restrictions: link.restrictions.slice(),
  };
}

// ============================================================================
// Shared-concept helper
// ============================================================================

/**
 * For a concept, summarize how it appears across all exams — used for
 * admin oversight of cross-exam concept treatment consistency.
 */
export interface SharedConceptSummary {
  concept_id: string;
  appears_in: Array<{
    exam_id: string;
    depth: ConceptDepth;
    weight: number;
    emphasis_count: number;
    restriction_count: number;
  }>;
  depth_range: [ConceptDepth, ConceptDepth] | null;
  total_weight: number;
}

export function summarizeSharedConcept(concept_id: string): SharedConceptSummary {
  const appearances = getExamsForConcept(concept_id);
  const depths = appearances.map(a => a.link.depth);
  const depthOrder: ConceptDepth[] = ['introductory', 'standard', 'advanced'];
  let minDepth: ConceptDepth | null = null;
  let maxDepth: ConceptDepth | null = null;
  for (const d of depths) {
    if (!minDepth || depthOrder.indexOf(d) < depthOrder.indexOf(minDepth)) minDepth = d;
    if (!maxDepth || depthOrder.indexOf(d) > depthOrder.indexOf(maxDepth)) maxDepth = d;
  }
  return {
    concept_id,
    appears_in: appearances.map(a => ({
      exam_id: a.exam_id,
      depth: a.link.depth,
      weight: a.link.weight,
      emphasis_count: a.link.emphasis.length,
      restriction_count: a.link.restrictions.length,
    })),
    depth_range: minDepth && maxDepth ? [minDepth, maxDepth] : null,
    total_weight: appearances.reduce((s, a) => s + a.link.weight, 0),
  };
}
