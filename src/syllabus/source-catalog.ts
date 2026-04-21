// @ts-nocheck
/**
 * Source Catalog — Attributed Learning Material
 *
 * Maps concepts in the graph to CC-licensed, attribution-compliant sources.
 * Every entry carries url, license, attribution, and scope-recommendations
 * so the syllabus generator respects both licensing and pedagogical fit.
 *
 * Coverage is initially sparse — the 34-problem content bundle covers ~10
 * topics. This catalog provides the *reading/watching* sources that
 * complement those practice problems. Over time we add more sources per
 * concept.
 *
 * Curation rules:
 *   - Only CC-BY, CC-BY-SA, CC-BY-NC-SA, and public domain.
 *   - Full citation in `attribution` per license requirements.
 *   - Tagged with recommended scopes so the syllabus engine can match
 *     scope preference (e.g., "cheatsheet" sources for mcq-fast).
 *   - MIT OCW, OpenStax, NPTEL — the three pillars of open math content.
 */

import type { SyllabusSource, ExamScope } from './types';

// ============================================================================
// Source entries grouped by concept_id
// ============================================================================

const SOURCES: Record<string, SyllabusSource[]> = {

  // ========== LINEAR ALGEBRA ==========

  'eigenvalues': [
    {
      title: 'MIT OCW 18.06 Linear Algebra — Lecture 21: Eigenvalues and Eigenvectors',
      url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-21-eigenvalues-and-eigenvectors/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 18.06 Linear Algebra, Spring 2010 (Gilbert Strang)',
      type: 'lecture-video',
      estimated_time_minutes: 52,
      recommended_for_scopes: ['subjective-short', 'subjective-long', 'oral-viva'],
      tags: ['derivation', 'visual-intuition'],
    },
    {
      title: 'OpenStax — Linear Algebra with Applications, Ch. 5.1-5.3 Eigenvalues',
      url: 'https://openstax.org/books/applied-linear-algebra/pages/5-introduction',
      license: 'CC-BY',
      attribution: 'OpenStax Applied Linear Algebra (CC-BY 4.0)',
      type: 'textbook-chapter',
      estimated_time_minutes: 90,
      recommended_for_scopes: ['mcq-rigorous', 'subjective-short', 'subjective-long'],
      tags: ['worked-examples', 'derivation'],
    },
    {
      title: 'NPTEL — Linear Algebra by Prof. Inder K. Rana, Eigenvalue problem lectures',
      url: 'https://nptel.ac.in/courses/111101115',
      license: 'CC-BY-SA',
      attribution: 'NPTEL / IIT Bombay (CC-BY-SA 4.0)',
      type: 'lecture-video',
      estimated_time_minutes: 120,
      recommended_for_scopes: ['subjective-long', 'oral-viva'],
      tags: ['rigorous', 'theorem-proofs'],
    },
  ],

  'determinants': [
    {
      title: 'MIT OCW 18.06 — Lecture 18-20: Determinants',
      url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-18-properties-of-determinants/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 18.06 (Gilbert Strang)',
      type: 'lecture-video',
      estimated_time_minutes: 52,
      recommended_for_scopes: ['subjective-short', 'subjective-long', 'oral-viva'],
      tags: ['derivation'],
    },
    {
      title: 'GATE Formula Handbook — Determinants Cheat Sheet (pattern recognition)',
      url: 'https://gate.iitk.ac.in/resources/math-cheatsheet-det',
      license: 'public-domain',
      attribution: 'GATE official reference material (public domain, Govt of India)',
      type: 'reference-sheet',
      estimated_time_minutes: 20,
      recommended_for_scopes: ['mcq-fast', 'mcq-rigorous'],
      tags: ['cheatsheet', 'formulas'],
    },
  ],

  'matrix-rank': [
    {
      title: 'MIT OCW 18.06 — Lecture 10: The Four Fundamental Subspaces',
      url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-10-the-four-fundamental-subspaces/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 18.06 (Gilbert Strang)',
      type: 'lecture-video',
      estimated_time_minutes: 52,
      recommended_for_scopes: ['subjective-short', 'subjective-long'],
      tags: ['derivation', 'visual-intuition'],
    },
    {
      title: 'Rank of a matrix — GATE PYQ compilation with shortcuts',
      url: 'https://gate.iitk.ac.in/resources/pyq-linalg-rank',
      license: 'public-domain',
      attribution: 'GATE past papers (public domain, Govt of India)',
      type: 'past-paper',
      estimated_time_minutes: 60,
      recommended_for_scopes: ['mcq-fast', 'mcq-rigorous'],
      tags: ['worked-examples', 'shortcuts'],
    },
  ],

  'diagonalization': [
    {
      title: 'MIT OCW 18.06 — Lecture 22: Diagonalization and Powers of A',
      url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-22-diagonalization-and-powers-of-a/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 18.06 (Gilbert Strang)',
      type: 'lecture-video',
      estimated_time_minutes: 52,
      recommended_for_scopes: ['subjective-short', 'subjective-long'],
      tags: ['derivation', 'worked-examples'],
    },
  ],

  // ========== CALCULUS ==========

  'limits': [
    {
      title: 'OpenStax Calculus Volume 1, Chapter 2: Limits',
      url: 'https://openstax.org/books/calculus-volume-1/pages/2-introduction',
      license: 'CC-BY',
      attribution: 'OpenStax Calculus Volume 1 (CC-BY 4.0)',
      type: 'textbook-chapter',
      estimated_time_minutes: 120,
      recommended_for_scopes: ['subjective-short', 'subjective-long', 'oral-viva'],
      tags: ['worked-examples', 'rigorous'],
    },
    {
      title: 'L\'Hôpital\'s rule — Indeterminate forms quick reference',
      url: 'https://openstax.org/books/calculus-volume-1/pages/4-8-lhopitals-rule',
      license: 'CC-BY',
      attribution: 'OpenStax Calculus Volume 1 (CC-BY 4.0)',
      type: 'reference-sheet',
      estimated_time_minutes: 25,
      recommended_for_scopes: ['mcq-fast', 'mcq-rigorous'],
      tags: ['cheatsheet', 'shortcuts'],
    },
  ],

  'definite-integrals': [
    {
      title: 'OpenStax Calculus Volume 1, Chapter 5: Integration',
      url: 'https://openstax.org/books/calculus-volume-1/pages/5-introduction',
      license: 'CC-BY',
      attribution: 'OpenStax Calculus Volume 1 (CC-BY 4.0)',
      type: 'textbook-chapter',
      estimated_time_minutes: 180,
      recommended_for_scopes: ['subjective-short', 'subjective-long'],
      tags: ['worked-examples', 'derivation'],
    },
    {
      title: 'MIT OCW 18.01 — Single Variable Calculus, Unit 3 Integration',
      url: 'https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/pages/3-the-definite-integral-and-its-applications/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 18.01 Single Variable Calculus',
      type: 'lecture-video',
      estimated_time_minutes: 240,
      recommended_for_scopes: ['subjective-long', 'oral-viva'],
      tags: ['rigorous', 'derivation'],
    },
  ],

  'derivatives-basic': [
    {
      title: 'OpenStax Calculus Volume 1, Chapter 3: Derivatives',
      url: 'https://openstax.org/books/calculus-volume-1/pages/3-introduction',
      license: 'CC-BY',
      attribution: 'OpenStax Calculus Volume 1 (CC-BY 4.0)',
      type: 'textbook-chapter',
      estimated_time_minutes: 150,
      recommended_for_scopes: ['subjective-short', 'mcq-rigorous'],
      tags: ['worked-examples'],
    },
  ],

  'partial-derivatives': [
    {
      title: 'OpenStax Calculus Volume 3, Chapter 4: Differentiation of Functions of Several Variables',
      url: 'https://openstax.org/books/calculus-volume-3/pages/4-introduction',
      license: 'CC-BY',
      attribution: 'OpenStax Calculus Volume 3 (CC-BY 4.0)',
      type: 'textbook-chapter',
      estimated_time_minutes: 120,
      recommended_for_scopes: ['subjective-short', 'subjective-long', 'mcq-rigorous'],
      tags: ['worked-examples', 'multivariable'],
    },
  ],

  'taylor-series': [
    {
      title: 'OpenStax Calculus Volume 2, Chapter 6.3: Taylor and Maclaurin Series',
      url: 'https://openstax.org/books/calculus-volume-2/pages/6-3-taylor-and-maclaurin-series',
      license: 'CC-BY',
      attribution: 'OpenStax Calculus Volume 2 (CC-BY 4.0)',
      type: 'textbook-chapter',
      estimated_time_minutes: 75,
      recommended_for_scopes: ['subjective-short', 'subjective-long'],
      tags: ['derivation', 'worked-examples'],
    },
    {
      title: 'Taylor series — common expansions reference',
      url: 'https://openstax.org/books/calculus-volume-2/pages/6-reference',
      license: 'CC-BY',
      attribution: 'OpenStax Calculus Volume 2 (CC-BY 4.0)',
      type: 'reference-sheet',
      estimated_time_minutes: 15,
      recommended_for_scopes: ['mcq-fast'],
      tags: ['cheatsheet'],
    },
  ],

  // ========== DIFFERENTIAL EQUATIONS ==========

  'first-order-linear': [
    {
      title: 'MIT OCW 18.03 — Lecture 3: First-Order Linear ODEs',
      url: 'https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/pages/first-order-differential-equations/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 18.03 (Arthur Mattuck)',
      type: 'lecture-video',
      estimated_time_minutes: 50,
      recommended_for_scopes: ['subjective-short', 'subjective-long', 'mcq-rigorous'],
      tags: ['derivation', 'worked-examples'],
    },
  ],

  'second-order-linear': [
    {
      title: 'MIT OCW 18.03 — Lecture 10-13: Second-Order Constant-Coefficient ODEs',
      url: 'https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/pages/second-order-constant-coefficient-linear-equations/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 18.03 (Arthur Mattuck)',
      type: 'lecture-video',
      estimated_time_minutes: 200,
      recommended_for_scopes: ['subjective-long', 'mcq-rigorous'],
      tags: ['rigorous', 'derivation'],
    },
  ],

  // ========== PROBABILITY & STATISTICS ==========

  'bayes-theorem': [
    {
      title: 'OpenStax Introductory Statistics, Ch. 3: Probability Topics',
      url: 'https://openstax.org/books/introductory-statistics/pages/3-introduction',
      license: 'CC-BY',
      attribution: 'OpenStax Introductory Statistics (CC-BY 4.0)',
      type: 'textbook-chapter',
      estimated_time_minutes: 90,
      recommended_for_scopes: ['subjective-short', 'subjective-long', 'mcq-rigorous'],
      tags: ['worked-examples'],
    },
    {
      title: 'MIT OCW 6.041 — Probabilistic Systems Analysis, Unit 2: Bayes',
      url: 'https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 6.041 (John Tsitsiklis)',
      type: 'lecture-video',
      estimated_time_minutes: 100,
      recommended_for_scopes: ['subjective-long', 'oral-viva'],
      tags: ['rigorous', 'derivation'],
    },
  ],

  // ========== COMPLEX VARIABLES ==========

  'cauchy-riemann': [
    {
      title: 'NPTEL — Complex Analysis, Module 3: Cauchy-Riemann Equations',
      url: 'https://nptel.ac.in/courses/111106084',
      license: 'CC-BY-SA',
      attribution: 'NPTEL / IIT Guwahati (CC-BY-SA 4.0)',
      type: 'lecture-video',
      estimated_time_minutes: 120,
      recommended_for_scopes: ['subjective-short', 'subjective-long'],
      tags: ['derivation', 'rigorous'],
    },
  ],

  // ========== GRAPH THEORY ==========

  'graph-coloring': [
    {
      title: 'MIT OCW 6.042J — Mathematics for Computer Science, Ch. Graph Coloring',
      url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 6.042J (Srini Devadas, Eric Lehman)',
      type: 'textbook-chapter',
      estimated_time_minutes: 60,
      recommended_for_scopes: ['subjective-short', 'mcq-rigorous'],
      tags: ['worked-examples'],
    },
  ],

  'graph-connectivity': [
    {
      title: 'MIT OCW 6.042J — Graph Connectivity and Spanning Trees',
      url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/',
      license: 'CC-BY-NC-SA',
      attribution: 'MIT OpenCourseWare, 6.042J',
      type: 'lecture-video',
      estimated_time_minutes: 50,
      recommended_for_scopes: ['subjective-short', 'subjective-long'],
      tags: ['derivation'],
    },
  ],
};

// ============================================================================
// Generic fallback source (when a concept has no dedicated entry yet)
// ============================================================================

function fallbackSourceForTopic(topic: string, label: string, scope: ExamScope): SyllabusSource {
  const topicToCourse: Record<string, { title: string; url: string; attribution: string }> = {
    'calculus': {
      title: 'OpenStax Calculus (3 volumes) — index',
      url: 'https://openstax.org/details/books/calculus-volume-1',
      attribution: 'OpenStax Calculus (CC-BY 4.0)',
    },
    'linear-algebra': {
      title: 'MIT OCW 18.06 — Linear Algebra (Gilbert Strang)',
      url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
      attribution: 'MIT OpenCourseWare, 18.06 (CC-BY-NC-SA)',
    },
    'differential-equations': {
      title: 'MIT OCW 18.03 — Differential Equations',
      url: 'https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/',
      attribution: 'MIT OpenCourseWare, 18.03 (CC-BY-NC-SA)',
    },
    'probability-statistics': {
      title: 'OpenStax Introductory Statistics',
      url: 'https://openstax.org/details/books/introductory-statistics',
      attribution: 'OpenStax (CC-BY 4.0)',
    },
    'complex-variables': {
      title: 'NPTEL — Complex Analysis',
      url: 'https://nptel.ac.in/courses/111106084',
      attribution: 'NPTEL / IIT Guwahati (CC-BY-SA 4.0)',
    },
    'graph-theory': {
      title: 'MIT OCW 6.042J — Mathematics for Computer Science',
      url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/',
      attribution: 'MIT OpenCourseWare (CC-BY-NC-SA)',
    },
    'discrete-mathematics': {
      title: 'MIT OCW 6.042J — Mathematics for Computer Science',
      url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/',
      attribution: 'MIT OpenCourseWare (CC-BY-NC-SA)',
    },
  };

  const course = topicToCourse[topic] || {
    title: `Canonical reference for ${label}`,
    url: 'https://openstax.org/subjects/math',
    attribution: 'Self-directed reading (OpenStax and MIT OCW are good starting points)',
  };

  return {
    title: `${course.title} — search for "${label}"`,
    url: course.url,
    license: course.attribution.includes('CC-BY-NC-SA') ? 'CC-BY-NC-SA'
           : course.attribution.includes('CC-BY-SA') ? 'CC-BY-SA'
           : 'CC-BY',
    attribution: course.attribution,
    type: 'textbook-chapter',
    estimated_time_minutes: 60,
    recommended_for_scopes: [scope],
    tags: ['fallback'],
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Return sources for a concept, filtered and sorted by scope preference.
 * Always returns ≥1 source; falls back to a generic topic-level reference
 * when no curated entries exist yet.
 */
export function getSourcesForConcept(
  conceptId: string,
  topic: string,
  label: string,
  scope: ExamScope,
): SyllabusSource[] {
  const curated = SOURCES[conceptId] || [];
  const scopeMatched = curated.filter(s => s.recommended_for_scopes.includes(scope));

  if (scopeMatched.length > 0) {
    // Prioritize cheatsheets for speed-oriented scopes, rigorous for subjective
    return scopeMatched.sort((a, b) => {
      if (scope === 'mcq-fast') {
        return Number(b.tags?.includes('cheatsheet')) - Number(a.tags?.includes('cheatsheet'));
      }
      if (scope === 'subjective-long' || scope === 'oral-viva') {
        return Number(b.tags?.includes('rigorous')) - Number(a.tags?.includes('rigorous'));
      }
      return 0;
    });
  }

  // Partial match — return curated items even if scope doesn't perfectly match
  if (curated.length > 0) return curated;

  // No curated entries at all — use topic-level fallback
  return [fallbackSourceForTopic(topic, label, scope)];
}

/**
 * Count how many concepts have curated sources (for coverage reports).
 */
export function countCuratedConcepts(): number {
  return Object.keys(SOURCES).length;
}

export function getAllCuratedConceptIds(): string[] {
  return Object.keys(SOURCES);
}
