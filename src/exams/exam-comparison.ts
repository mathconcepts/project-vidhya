// @ts-nocheck
/**
 * Exam Comparison — structured diff between two exams
 *
 * Given two exam profiles (dynamic or static), compute:
 *   - Per-category similarity scores (identity, structure, content, schedule)
 *   - Shared features, unique features, notable differences
 *   - Overall similarity (0..1, weighted average of categories)
 *   - Human-readable recommendation
 *
 * Used by:
 *   - Admin "Compare" view in ExamSetupPage
 *   - Nearest-match ranking (exam-similarity.ts) — delegates per-pair comparison here
 *   - GBrain personalization context (exam-context.ts) — reads exam metadata directly
 *
 * Pure functions. No I/O. No side effects.
 */

import type { Exam, SyllabusTopic, MarkingScheme, QuestionTypeMix } from './types';

// ============================================================================
// Unified exam shape — accepts both dynamic (Exam) and static (ExamDefinition)
// ============================================================================

/**
 * A canonical exam shape used internally for comparison. Both the dynamic
 * Exam type and the static ExamDefinition type are adapted into this via
 * toCanonical().
 */
export interface CanonicalExam {
  id: string;
  code: string;
  name: string;
  level?: string;
  country?: string;
  issuing_body?: string;

  duration_minutes?: number;
  total_marks?: number;
  marking_scheme?: MarkingScheme;
  question_types?: QuestionTypeMix;

  // Topic list (preferred) OR derive from syllabus
  topics: string[];
  topic_weights?: Record<string, number>;

  frequency?: string;
  typical_prep_weeks?: number;

  source: 'dynamic' | 'static';
}

/** Adapt a dynamic Exam into the canonical shape */
export function toCanonical(exam: Exam): CanonicalExam {
  const topics: string[] = exam.syllabus
    ? exam.syllabus.map(t => t.topic_id).filter(Boolean)
    : exam.topic_weights
    ? Object.keys(exam.topic_weights)
    : [];

  return {
    id: exam.id,
    code: exam.code,
    name: exam.name,
    level: exam.level,
    country: exam.country,
    issuing_body: exam.issuing_body,
    duration_minutes: exam.duration_minutes,
    total_marks: exam.total_marks,
    marking_scheme: exam.marking_scheme,
    question_types: exam.question_types,
    topics,
    topic_weights: exam.topic_weights,
    frequency: exam.frequency,
    typical_prep_weeks: exam.typical_prep_weeks,
    source: 'dynamic',
  };
}

/** Adapt a static catalog entry — simpler shape */
export function staticToCanonical(staticExam: any): CanonicalExam {
  return {
    id: staticExam.id,
    code: staticExam.id,
    name: staticExam.name,
    issuing_body: staticExam.authority,
    topics: staticExam.topics || [],
    topic_weights: staticExam.topic_weights,
    typical_prep_weeks: staticExam.typical_prep_weeks,
    source: 'static',
  };
}

// ============================================================================
// Per-category comparisons
// ============================================================================

export interface FieldDifference {
  field: string;
  a: any;
  b: any;
}

export interface CategoryComparison {
  matches: string[];
  differences: FieldDifference[];
  score: number;           // 0..1 — 1 means identical, 0 means nothing aligned
  data_coverage: number;   // 0..1 — how much of this category has data in both exams
}

export interface ContentComparison extends CategoryComparison {
  shared_topics: string[];
  only_in_a: string[];
  only_in_b: string[];
  jaccard: number;
  weight_deltas: Array<{ topic: string; a_weight: number; b_weight: number; delta: number }>;
}

function compareIdentity(a: CanonicalExam, b: CanonicalExam): CategoryComparison {
  const fields = ['level', 'country', 'issuing_body'];
  const matches: string[] = [];
  const differences: FieldDifference[] = [];
  let both_filled = 0;
  let filled_in_any = 0;

  for (const f of fields) {
    const aVal = (a as any)[f];
    const bVal = (b as any)[f];
    if (aVal || bVal) filled_in_any++;
    if (aVal && bVal) {
      both_filled++;
      if (String(aVal).toLowerCase() === String(bVal).toLowerCase()) {
        matches.push(f);
      } else {
        differences.push({ field: f, a: aVal, b: bVal });
      }
    }
  }

  const score = both_filled === 0 ? 0 : matches.length / both_filled;
  const data_coverage = filled_in_any / fields.length;
  return { matches, differences, score, data_coverage };
}

function compareStructure(a: CanonicalExam, b: CanonicalExam): CategoryComparison {
  const matches: string[] = [];
  const differences: FieldDifference[] = [];
  let both_filled = 0;
  let filled_in_any = 0;
  const fields_total = 4;

  // Duration — fuzzy match (within 15% = match)
  if (a.duration_minutes || b.duration_minutes) filled_in_any++;
  if (a.duration_minutes && b.duration_minutes) {
    both_filled++;
    const ratio = Math.min(a.duration_minutes, b.duration_minutes) / Math.max(a.duration_minutes, b.duration_minutes);
    if (ratio >= 0.85) matches.push('duration_minutes');
    else differences.push({ field: 'duration_minutes', a: a.duration_minutes, b: b.duration_minutes });
  }

  // Total marks — exact
  if (a.total_marks || b.total_marks) filled_in_any++;
  if (a.total_marks && b.total_marks) {
    both_filled++;
    if (a.total_marks === b.total_marks) matches.push('total_marks');
    else differences.push({ field: 'total_marks', a: a.total_marks, b: b.total_marks });
  }

  // Marking scheme — compare negative marking
  const aMark = a.marking_scheme;
  const bMark = b.marking_scheme;
  if (aMark || bMark) filled_in_any++;
  if (aMark && bMark) {
    both_filled++;
    const aNeg = aMark.negative_marks_per_wrong;
    const bNeg = bMark.negative_marks_per_wrong;
    if (aNeg === bNeg || (Math.abs((aNeg || 0) - (bNeg || 0)) < 0.01)) matches.push('marking_scheme');
    else differences.push({ field: 'marking_scheme.negative', a: aNeg, b: bNeg });
  }

  // Question types — fuzzy match on dominant type
  if (a.question_types || b.question_types) filled_in_any++;
  if (a.question_types && b.question_types) {
    both_filled++;
    const aDom = dominantQuestionType(a.question_types);
    const bDom = dominantQuestionType(b.question_types);
    if (aDom === bDom) matches.push('question_types');
    else differences.push({ field: 'question_types.dominant', a: aDom, b: bDom });
  }

  const score = both_filled === 0 ? 0 : matches.length / both_filled;
  const data_coverage = filled_in_any / fields_total;
  return { matches, differences, score, data_coverage };
}

function dominantQuestionType(qt: QuestionTypeMix): string | null {
  if (!qt) return null;
  const kinds: Array<['mcq' | 'msq' | 'numerical' | 'descriptive' | 'other', number]> = [
    ['mcq', qt.mcq || 0],
    ['msq', qt.msq || 0],
    ['numerical', qt.numerical || 0],
    ['descriptive', qt.descriptive || 0],
    ['other', qt.other || 0],
  ];
  kinds.sort((x, y) => y[1] - x[1]);
  return kinds[0][1] > 0 ? kinds[0][0] : null;
}

function compareContent(a: CanonicalExam, b: CanonicalExam): ContentComparison {
  const aSet = new Set(a.topics || []);
  const bSet = new Set(b.topics || []);

  const shared: string[] = [];
  const only_in_a: string[] = [];
  const only_in_b: string[] = [];

  for (const t of aSet) {
    if (bSet.has(t)) shared.push(t);
    else only_in_a.push(t);
  }
  for (const t of bSet) {
    if (!aSet.has(t)) only_in_b.push(t);
  }

  const union = aSet.size + bSet.size - shared.length;
  const jaccard = union === 0 ? 0 : shared.length / union;

  // Weight deltas on shared topics
  const weight_deltas: ContentComparison['weight_deltas'] = [];
  for (const t of shared) {
    const aw = a.topic_weights?.[t] ?? 0;
    const bw = b.topic_weights?.[t] ?? 0;
    weight_deltas.push({ topic: t, a_weight: aw, b_weight: bw, delta: Math.abs(aw - bw) });
  }
  weight_deltas.sort((x, y) => y.delta - x.delta);

  // Matches/differences reframed for content
  const matches: string[] = shared.length > 0 ? ['shared_topics'] : [];
  const differences: FieldDifference[] = [];
  if (only_in_a.length > 0) differences.push({ field: 'topics_only_in_a', a: only_in_a.length, b: 0 });
  if (only_in_b.length > 0) differences.push({ field: 'topics_only_in_b', a: 0, b: only_in_b.length });

  const data_coverage = aSet.size > 0 && bSet.size > 0 ? 1 : (aSet.size + bSet.size > 0 ? 0.5 : 0);

  return {
    matches,
    differences,
    score: jaccard,
    data_coverage,
    shared_topics: shared,
    only_in_a,
    only_in_b,
    jaccard,
    weight_deltas,
  };
}

function compareSchedule(a: CanonicalExam, b: CanonicalExam): CategoryComparison {
  const matches: string[] = [];
  const differences: FieldDifference[] = [];
  let both_filled = 0;
  let filled_in_any = 0;

  if (a.frequency || b.frequency) filled_in_any++;
  if (a.frequency && b.frequency) {
    both_filled++;
    if (a.frequency === b.frequency) matches.push('frequency');
    else differences.push({ field: 'frequency', a: a.frequency, b: b.frequency });
  }

  if (a.typical_prep_weeks || b.typical_prep_weeks) filled_in_any++;
  if (a.typical_prep_weeks && b.typical_prep_weeks) {
    both_filled++;
    const ratio = Math.min(a.typical_prep_weeks, b.typical_prep_weeks) / Math.max(a.typical_prep_weeks, b.typical_prep_weeks);
    if (ratio >= 0.75) matches.push('typical_prep_weeks');
    else differences.push({ field: 'typical_prep_weeks', a: a.typical_prep_weeks, b: b.typical_prep_weeks });
  }

  const score = both_filled === 0 ? 0 : matches.length / both_filled;
  const data_coverage = filled_in_any / 2;
  return { matches, differences, score, data_coverage };
}

// ============================================================================
// Main comparison entry
// ============================================================================

export interface ExamComparison {
  a: { id: string; code: string; name: string };
  b: { id: string; code: string; name: string };
  overall_similarity: number;
  categories: {
    identity: CategoryComparison;
    structure: CategoryComparison;
    content: ContentComparison;
    schedule: CategoryComparison;
  };
  recommendation: string;
}

const CATEGORY_WEIGHTS = {
  identity: 0.20,
  structure: 0.25,
  content: 0.40,  // syllabus overlap dominates similarity
  schedule: 0.15,
};

export function compareExams(a: CanonicalExam, b: CanonicalExam): ExamComparison {
  const identity = compareIdentity(a, b);
  const structure = compareStructure(a, b);
  const content = compareContent(a, b);
  const schedule = compareSchedule(a, b);

  // Weighted overall — only counts categories with data_coverage > 0
  let weightedSum = 0;
  let weightTotal = 0;
  const cats = { identity, structure, content, schedule };
  for (const [key, cat] of Object.entries(cats)) {
    const w = (CATEGORY_WEIGHTS as any)[key] * (cat as CategoryComparison).data_coverage;
    weightedSum += (cat as CategoryComparison).score * w;
    weightTotal += w;
  }
  const overall = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // Recommendation — human-readable
  const recommendation = composeRecommendation(a, b, overall, content, identity);

  return {
    a: { id: a.id, code: a.code, name: a.name },
    b: { id: b.id, code: b.code, name: b.name },
    overall_similarity: overall,
    categories: { identity, structure, content, schedule },
    recommendation,
  };
}

function composeRecommendation(
  a: CanonicalExam,
  b: CanonicalExam,
  overall: number,
  content: ContentComparison,
  identity: CategoryComparison,
): string {
  const pct = Math.round(overall * 100);

  if (overall >= 0.8) {
    return `**${a.name}** and **${b.name}** are highly similar (${pct}% overall). They share ${content.shared_topics.length} syllabus topics. If one has more complete structural data, you could use it as a template for the other.`;
  }
  if (overall >= 0.5) {
    return `Moderate similarity (${pct}%). **${a.name}** and **${b.name}** overlap on ${content.shared_topics.length} topics${identity.matches.length > 0 ? ` and share ${identity.matches.join(', ')}` : ''}. Students preparing for one could use materials from the other for the shared topics.`;
  }
  if (overall >= 0.25) {
    return `Partial similarity (${pct}%). Some overlap but these are substantially different exams. ${content.shared_topics.length} topics are shared — useful for cross-references but not a substitute.`;
  }
  return `Low similarity (${pct}%). **${a.name}** and **${b.name}** appear to be different exams. They share ${content.shared_topics.length} topics.`;
}
