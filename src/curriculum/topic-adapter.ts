// @ts-nocheck
/**
 * Topic Adapter — derives the topic list from curriculum YAML sections.
 *
 * Replaces src/constants/topics.ts as the single source of truth for exam topics.
 * Topic IDs, names, and weights come from the YAML syllabus sections.
 * Icons and keywords are static extensions (design assets / search taxonomies —
 * they don't belong in academic YAML).
 *
 * Usage:
 *   import { getTopicsForExam, getTopicKeywords } from '../curriculum/topic-adapter';
 *   const topics = getTopicsForExam('gate-ma');  // [{id, name, icon, weight_pct}]
 */

import { getExam } from './exam-loader';

export interface TopicMeta {
  id: string;
  name: string;
  icon: string;
  weight_pct: number;
}

// Static icon + keyword extensions keyed by section id.
// New exams drop new entries here; existing exams work without changes.
const ICON_MAP: Record<string, string> = {
  'linear-algebra': 'grid',
  'calculus': 'activity',
  'differential-equations': 'git-branch',
  'complex-variables': 'circle',
  'probability-statistics': 'bar-chart',
  'numerical-methods': 'hash',
  'transforms': 'repeat',
  'transform-theory': 'repeat',
  'discrete': 'layers',
  'discrete-mathematics': 'layers',
  'graph-theory': 'share-2',
  'vector-calculus': 'navigation',
};

const KEYWORD_MAP: Record<string, string[]> = {
  'linear-algebra': ['matrix', 'matrices', 'eigenvalue', 'eigenvector', 'determinant', 'rank', 'linear algebra', 'vector space', 'basis', 'orthogonal', 'cayley-hamilton', 'linear transformation'],
  'calculus': ['integral', 'derivative', 'limit', 'differentiation', 'integration', 'calculus', 'maxima', 'minima', 'continuity', 'taylor', 'maclaurin', 'rolle', 'mean value theorem', 'series', 'convergence'],
  'differential-equations': ['ode', 'pde', 'differential equation', 'laplace', 'bernoulli equation', 'exact equation', 'first order', 'second order', 'homogeneous', 'particular solution', 'boundary value', 'initial value'],
  'complex-variables': ['complex', 'analytic', 'residue', 'contour', 'cauchy', 'laurent', 'singularity', 'conformal', 'harmonic', 'complex analysis', 'holomorphic'],
  'probability-statistics': ['probability', 'statistics', 'distribution', 'random variable', 'bayes', 'expected value', 'variance', 'poisson', 'binomial', 'normal distribution', 'gaussian'],
  'numerical-methods': ['interpolation', 'newton-raphson', 'numerical', 'bisection', 'trapezoidal', 'simpson', 'runge-kutta', 'gauss elimination', 'numerical method', 'numerical integration', 'finite difference'],
  'transforms': ['fourier', 'laplace transform', 'z-transform', 'inverse transform', 'convolution', 'transfer function', 'fourier series', 'dft', 'fft'],
  'transform-theory': ['fourier', 'laplace transform', 'z-transform', 'inverse transform', 'convolution', 'transfer function', 'fourier series', 'dft', 'fft'],
  'discrete': ['combinatorics', 'recurrence', 'logic', 'boolean', 'set theory', 'relation', 'function', 'pigeonhole', 'permutation', 'combination', 'boolean algebra', 'lattice', 'group theory'],
  'discrete-mathematics': ['combinatorics', 'recurrence', 'logic', 'boolean', 'set theory', 'relation', 'function', 'pigeonhole', 'permutation', 'combination', 'boolean algebra', 'lattice', 'group theory'],
  'graph-theory': ['graph', 'tree', 'vertex', 'edge', 'coloring', 'eulerian', 'hamiltonian', 'adjacency', 'degree', 'planar', 'graph theory', 'spanning tree', 'shortest path', 'euler'],
  'vector-calculus': ['gradient', 'divergence', 'curl', 'stokes', "green's theorem", 'line integral', 'surface integral', 'flux', 'gauss divergence', 'vector calculus', 'green theorem'],
};

/**
 * Returns ordered topic metadata for an exam, derived from its syllabus sections.
 * Falls back gracefully if an exam is not found.
 */
export function getTopicsForExam(examId: string): TopicMeta[] {
  const exam = getExam(examId);
  if (!exam) return [];
  return exam.syllabus.map(section => ({
    id: section.id,
    name: section.title,
    icon: ICON_MAP[section.id] ?? 'book',
    weight_pct: section.weight_pct,
  }));
}

/** Returns keyword list for a topic section id, or [] if unknown. */
export function getTopicKeywords(sectionId: string): string[] {
  return KEYWORD_MAP[sectionId] ?? [];
}

/** Returns a flat map of all keyword lists for an exam's topics. */
export function getKeywordsForExam(examId: string): Record<string, string[]> {
  const topics = getTopicsForExam(examId);
  return Object.fromEntries(topics.map(t => [t.id, getTopicKeywords(t.id)]));
}

/** Returns just the topic IDs for an exam. */
export function getTopicIdsForExam(examId: string): string[] {
  return getTopicsForExam(examId).map(t => t.id);
}
