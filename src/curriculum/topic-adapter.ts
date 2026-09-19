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
import { CONCEPT_MAP } from '../constants/concept-graph';

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
  // JEE Main (v4.86.0). Distinct glyphs per section for the same reason the
  // GATE rows above have them: eight identical 'book' icons carry no
  // information, and the topic list is the first thing a student scans.
  'jee-algebra': 'grid',
  'jee-calculus': 'activity',
  'jee-coordinate-geometry': 'crosshair',
  'jee-trigonometry': 'triangle',
  'jee-vectors-3d': 'navigation',
  'jee-probability-statistics': 'bar-chart',
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
  // JEE Main (v4.86.0). Deliberately NOT copies of the GATE rows above:
  // these drive topic DETECTION, and a JEE student asking about "matrices"
  // should land on jee-algebra, not GATE's postgraduate linear-algebra.
  'jee-algebra': ['set', 'relation', 'function', 'quadratic', 'roots', 'discriminant', 'complex number', 'argand', 'modulus', 'permutation', 'combination', 'ncr', 'npr', 'binomial theorem', 'arithmetic progression', 'geometric progression', 'ap', 'gp', 'matrix', 'determinant', 'cramer'],
  'jee-calculus': ['limit', 'continuity', 'differentiability', 'derivative', 'tangent', 'normal', 'maxima', 'minima', 'increasing', 'decreasing', 'indefinite integral', 'definite integral', 'substitution', 'integration by parts', 'differential equation', 'integrating factor', 'variable separable'],
  'jee-coordinate-geometry': ['straight line', 'slope', 'circle', 'tangent to a circle', 'parabola', 'ellipse', 'hyperbola', 'conic', 'eccentricity', 'focus', 'directrix', 'latus rectum', 'chord of contact', 'director circle', 'auxiliary circle', 'pole', 'polar'],
  'jee-trigonometry': ['sin', 'cos', 'tan', 'trigonometric identity', 'compound angle', 'multiple angle', 'inverse trigonometric', 'principal value', 'height and distance', 'angle of elevation', 'angle of depression'],
  'jee-vectors-3d': ['vector', 'dot product', 'cross product', 'scalar triple product', 'direction cosine', 'direction ratio', 'skew lines', 'shortest distance', 'plane', 'angle between planes', 'three dimensional geometry'],
  'jee-probability-statistics': ['probability', 'conditional probability', 'bayes', 'independent events', 'mutually exclusive', 'mean', 'median', 'mode', 'variance', 'standard deviation', 'dispersion', 'coefficient of variation'],
};

/**
 * Returns ordered topic metadata for an exam, derived from its syllabus sections.
 * Falls back gracefully if an exam is not found.
 */
export function getTopicsForExam(examId: string): TopicMeta[] {
  const exam = getExam(examId);
  if (!exam) return [];
  return exam.syllabus
    // A section none of whose concepts exist in the graph is a section a
    // student cannot study (v4.86.0). jee-main declares Physics and
    // Chemistry because its syllabus genuinely IS PCM and saying otherwise
    // in the pack would be a lie — but every one of their ids is still a
    // `stub_concepts:` placeholder, so rendering them as top-level topics
    // offers two doors that open onto nothing.
    //
    // Filtered HERE, in the topic view, rather than by editing the pack:
    // `getSyllabus()` must keep reporting those ids as unresolved so a
    // partly-migrated pack is never mistaken for a finished one. The
    // section reappears by itself the moment its concepts land.
    //
    // Exam-agnostic and self-clearing: it keys on whether concepts resolve,
    // never on a pack id. Every gate-ma section resolves, so its list is
    // unchanged.
    .filter(section => (section.concept_ids ?? []).some(id => CONCEPT_MAP.has(id)))
    .map(section => ({
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
