// @ts-nocheck
/**
 * Exam Similarity — nearest-match finder
 *
 * Given a target exam, ranks all other exams (both dynamic registry AND
 * static catalog) by similarity. Used by:
 *
 *   - Admin UI — "Exams similar to this one" panel
 *   - New-exam flow — "Did you mean one of these?" before creating duplicate
 *   - Student content delivery — when target exam has partial data, the
 *     system can borrow structural hints from the nearest complete match
 *
 * Scoring delegates to exam-comparison.ts per pair, but optimizes for the
 * ranking use case (stops at top-k, uses cheap feature heuristics for
 * candidate pre-filtering).
 */

import { listExams } from './exam-store';
import { EXAMS as STATIC_EXAMS } from '../syllabus/exam-catalog';
import {
  compareExams,
  toCanonical,
  staticToCanonical,
  type CanonicalExam,
  type ExamComparison,
} from './exam-comparison';

// ============================================================================

export interface SimilarityResult {
  exam_id: string;
  exam_name: string;
  exam_code: string;
  source: 'dynamic' | 'static';
  similarity: number;
  shared_topic_count: number;
  notable_matches: string[];
  notable_differences: string[];
  /** Full comparison — provided for UI drill-down */
  comparison?: ExamComparison;
}

// ============================================================================
// Collect all candidate exams (dynamic registry + static catalog)
// ============================================================================

function collectAllCanonicalExams(): CanonicalExam[] {
  const dynamic = listExams({ include_drafts: true, include_archived: false })
    .map(toCanonical);
  const staticList = Object.values(STATIC_EXAMS).map(staticToCanonical);
  return [...dynamic, ...staticList];
}

// ============================================================================
// Main entry
// ============================================================================

/**
 * Find exams similar to the target. Returns top-k ranked results.
 *
 * @param target  The canonical exam to match against
 * @param k       Maximum results to return (default 5)
 * @param options.min_similarity  Filter out results below this threshold
 * @param options.include_comparison  Attach full comparison objects (heavier)
 */
export function findNearestMatches(
  target: CanonicalExam,
  k: number = 5,
  options: { min_similarity?: number; include_comparison?: boolean } = {},
): SimilarityResult[] {
  const minSim = options.min_similarity ?? 0.05;
  const candidates = collectAllCanonicalExams().filter(c => c.id !== target.id);

  const scored: SimilarityResult[] = candidates.map(candidate => {
    const cmp = compareExams(target, candidate);
    return {
      exam_id: candidate.id,
      exam_name: candidate.name,
      exam_code: candidate.code,
      source: candidate.source,
      similarity: cmp.overall_similarity,
      shared_topic_count: cmp.categories.content.shared_topics.length,
      notable_matches: collectNotableMatches(cmp),
      notable_differences: collectNotableDifferences(cmp),
      comparison: options.include_comparison ? cmp : undefined,
    };
  });

  return scored
    .filter(r => r.similarity >= minSim)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

function collectNotableMatches(cmp: ExamComparison): string[] {
  const out: string[] = [];
  if (cmp.categories.identity.matches.includes('level')) out.push('same level');
  if (cmp.categories.identity.matches.includes('country')) out.push('same country');
  if (cmp.categories.identity.matches.includes('issuing_body')) out.push('same issuing body');
  const topics = cmp.categories.content.shared_topics.length;
  if (topics >= 5) out.push(`${topics} shared topics`);
  else if (topics > 0) out.push(`${topics} shared topic${topics === 1 ? '' : 's'}`);
  if (cmp.categories.structure.matches.includes('marking_scheme')) out.push('same marking scheme');
  if (cmp.categories.structure.matches.includes('duration_minutes')) out.push('similar duration');
  return out;
}

function collectNotableDifferences(cmp: ExamComparison): string[] {
  const out: string[] = [];
  for (const diff of cmp.categories.identity.differences.slice(0, 2)) {
    out.push(`different ${diff.field.replace(/_/g, ' ')}`);
  }
  if (cmp.categories.content.only_in_a.length > cmp.categories.content.shared_topics.length) {
    out.push(`${cmp.categories.content.only_in_a.length} topics unique to this one`);
  }
  return out;
}

// ============================================================================
// Inverse — find exams SIMILAR TO A SEED (for admin create-flow dedup check)
// ============================================================================

/**
 * Light-weight pre-create check. Given just a name + level + optional
 * country, returns up to k existing exams that look like potential duplicates.
 * Used before the admin commits a new exam, so they can reuse rather than
 * create a near-duplicate.
 */
export function findSimilarByIdentity(seed: {
  name: string;
  level?: string;
  country?: string;
  issuing_body?: string;
}, k: number = 3): SimilarityResult[] {
  const pseudoTarget: CanonicalExam = {
    id: '__new__',
    code: '__new__',
    name: seed.name,
    level: seed.level,
    country: seed.country,
    issuing_body: seed.issuing_body,
    topics: [],
    source: 'dynamic',
  };

  const candidates = collectAllCanonicalExams();
  const nameLower = seed.name.toLowerCase();

  // Score by: name substring match + identity overlap
  const scored = candidates.map(c => {
    let nameScore = 0;
    const candName = c.name.toLowerCase();
    if (candName === nameLower) nameScore = 1.0;
    else if (candName.includes(nameLower) || nameLower.includes(candName)) nameScore = 0.7;
    else {
      // Token overlap
      const aTokens = new Set(nameLower.split(/\s+/).filter(t => t.length > 2));
      const bTokens = new Set(candName.split(/\s+/).filter(t => t.length > 2));
      const shared = [...aTokens].filter(t => bTokens.has(t)).length;
      const total = aTokens.size + bTokens.size - shared;
      nameScore = total > 0 ? shared / total : 0;
    }

    let idScore = 0;
    let idPoints = 0;
    if (seed.level && c.level) { idPoints++; if (seed.level === c.level) idScore++; }
    if (seed.country && c.country) { idPoints++; if (seed.country.toLowerCase() === c.country.toLowerCase()) idScore++; }
    if (seed.issuing_body && c.issuing_body) { idPoints++; if (seed.issuing_body.toLowerCase() === c.issuing_body.toLowerCase()) idScore++; }
    const identityScore = idPoints > 0 ? idScore / idPoints : 0;

    const combined = 0.7 * nameScore + 0.3 * identityScore;

    return {
      exam_id: c.id,
      exam_name: c.name,
      exam_code: c.code,
      source: c.source,
      similarity: combined,
      shared_topic_count: 0,
      notable_matches: [],
      notable_differences: [],
    };
  });

  return scored
    .filter(r => r.similarity >= 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

// ============================================================================
// Nearest complete exam — for student-context fallback
// ============================================================================

/**
 * Given a target exam that has incomplete structural data, find the
 * most-similar exam that's MORE complete. The returned exam can be used
 * as a structural hint (e.g., "your exam's marking scheme isn't defined,
 * but its nearest match uses 1/3 negative marking — we'll assume that
 * pending confirmation").
 *
 * Used by GBrain exam-context.ts to fill gaps for personalization.
 */
export function findMoreCompleteMatch(
  target: CanonicalExam,
  minSimilarity: number = 0.4,
): { match: SimilarityResult; full: CanonicalExam } | null {
  const candidates = collectAllCanonicalExams().filter(c => c.id !== target.id);
  const targetCompleteness = estimateCanonicalCompleteness(target);

  const scored = candidates
    .map(c => ({
      c,
      completeness: estimateCanonicalCompleteness(c),
      cmp: compareExams(target, c),
    }))
    .filter(x => x.cmp.overall_similarity >= minSimilarity)
    .filter(x => x.completeness > targetCompleteness + 0.15)
    .sort((a, b) => {
      // Prefer higher similarity; tiebreak on higher completeness
      if (Math.abs(a.cmp.overall_similarity - b.cmp.overall_similarity) > 0.05) {
        return b.cmp.overall_similarity - a.cmp.overall_similarity;
      }
      return b.completeness - a.completeness;
    });

  if (scored.length === 0) return null;
  const top = scored[0];

  return {
    match: {
      exam_id: top.c.id,
      exam_name: top.c.name,
      exam_code: top.c.code,
      source: top.c.source,
      similarity: top.cmp.overall_similarity,
      shared_topic_count: top.cmp.categories.content.shared_topics.length,
      notable_matches: collectNotableMatches(top.cmp),
      notable_differences: collectNotableDifferences(top.cmp),
    },
    full: top.c,
  };
}

function estimateCanonicalCompleteness(c: CanonicalExam): number {
  let filled = 0;
  let total = 0;
  const fields: (keyof CanonicalExam)[] = [
    'level', 'country', 'issuing_body',
    'duration_minutes', 'total_marks', 'marking_scheme',
    'question_types', 'frequency', 'typical_prep_weeks',
  ];
  for (const f of fields) {
    total++;
    const v = c[f];
    if (v !== undefined && v !== null && v !== '') filled++;
  }
  if (c.topics && c.topics.length > 0) filled += 2;  // topics are critical
  total += 2;
  if (c.topic_weights && Object.keys(c.topic_weights).length > 0) filled++;
  total++;
  return filled / total;
}
