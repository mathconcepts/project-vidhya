/**
 * Bridge Mapping — TN Class 12 Mathematics → IIT JEE Main Mathematics.
 *
 * Each entry maps one or more TN concepts to JEE topics and classifies the
 * gap. The 'bridge_note' field is the editorial reasoning we want GBrain
 * (or a human content author) to follow when generating the bridge units.
 *
 * Gap classification reminder:
 *   aligned       — TN covers what JEE needs, just deeper practice
 *   depth-gap     — same concept but JEE demands tougher problems / faster recall
 *   breadth-gap   — JEE needs adjacent concepts the TN textbook skips
 *   foundation    — TN doesn't cover this; build from scratch
 */

import type { BridgeMapping } from '../types';
import { JEE_MAIN_TOPIC_IDS } from './_jee-topics';

/**
 * Helper to keep entry construction terse.
 */
function entry(
  id: string,
  source_concept_ids: string[],
  target_topic_ids: string[],
  gap_class: 'aligned' | 'depth-gap' | 'breadth-gap' | 'foundation',
  difficulty_jump: 1 | 2 | 3 | 4 | 5,
  bridge_note: string,
) {
  return { id, source_concept_ids, target_topic_ids, gap_class, difficulty_jump, bridge_note };
}

export const TN_12_MATH_TO_JEE: BridgeMapping = {
  id: 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE',
  source_curriculum_id: 'TN-12-MATH',
  target_exam_id: 'EXM-JEEMAIN-MATH-SAMPLE',
  display_name: 'TN Class 12 Maths → JEE Main',
  entries: [
    // ----- Matrices & Determinants -----
    entry(
      'matrices.inverse',
      ['tn-12-math.matrices-determinants.inverse'],
      ['algebra'],
      'aligned',
      2,
      "TN teaches matrix inverse cleanly. For JEE, drill on adjoint method, properties of adjugate, and matrix equations like AX = B where A is 3x3 with parametric entries.",
    ),
    entry(
      'matrices.cramer-and-rank',
      ['tn-12-math.matrices-determinants.cramer', 'tn-12-math.matrices-determinants.consistency'],
      ['algebra'],
      'depth-gap',
      3,
      "TN ends at unique/no-solution/infinite cases. JEE expects rank + determinant arguments, parametric families, and quick mental case analysis under exam pressure.",
    ),

    // ----- Complex Numbers -----
    entry(
      'complex.algebra-and-argand',
      ['tn-12-math.complex.algebra', 'tn-12-math.complex.argand'],
      ['algebra'],
      'depth-gap',
      3,
      "TN covers polar form and Argand basics. JEE adds: locus problems (perpendicular bisector, circle, ellipse defined by |z-a|+|z-b|=k), rotation interpretation, and identifying triangles using complex numbers.",
    ),
    entry(
      'complex.de-moivre-roots-of-unity',
      ['tn-12-math.complex.de-moivre'],
      ['algebra'],
      'depth-gap',
      4,
      "TN derives roots of unity. JEE pushes into sum/product identities involving omega, geometric problems on regular polygons, and unstated nth-roots that the student must recognize.",
    ),

    // ----- Theory of Equations -----
    entry(
      'quadratic-extras',
      ['tn-12-math.theory-equations.roots-coeffs'],
      ['algebra'],
      'breadth-gap',
      3,
      "TN focuses on cubic/quartic root relations. JEE leans heavily on quadratic-equation tricks: common roots, condition for two real roots in a given interval, location of roots — concepts only lightly touched in the TN textbook.",
    ),
    entry(
      'polynomials.transformations',
      ['tn-12-math.theory-equations.transformations', 'tn-12-math.theory-equations.descartes'],
      ['algebra'],
      'aligned',
      2,
      "Direct alignment. Add practice problems where the student designs the transformation, not just applies it.",
    ),

    // ----- Inverse Trig -----
    entry(
      'inverse-trig.intro',
      ['tn-12-math.inverse-trig.basic'],
      ['trigonometry'],
      'aligned',
      2,
      "TN coverage is solid. JEE adds principal-value tricks and graph identification from a piecewise form.",
    ),
    entry(
      'inverse-trig.identities',
      ['tn-12-math.inverse-trig.properties'],
      ['trigonometry'],
      'depth-gap',
      4,
      "JEE's inverse-trig problems require chaining 3-4 identities and recognizing when arctan + arctan + arctan = pi. TN students typically know the identities but not when to apply which one — needs guided practice.",
    ),

    // ----- Conics / 2D Geometry -----
    entry(
      'conics.circle',
      ['tn-12-math.conics.circle'],
      ['coordinate-geometry'],
      'depth-gap',
      3,
      "Circle is well taught in TN. JEE expects: family of circles, radical axis, two-circle intersection conditions, and problems combining circle + line at JEE difficulty.",
    ),
    entry(
      'conics.parabola-ellipse-hyperbola',
      ['tn-12-math.conics.parabola', 'tn-12-math.conics.ellipse-hyperbola'],
      ['coordinate-geometry'],
      'depth-gap',
      4,
      "Major gap zone. TN covers definitions and equations of conics. JEE goes deep on: chord of contact, pole-polar duality, common tangent problems across two conics, and parametric coordinates. Generate at least 2 bridge explainers here.",
    ),

    // ----- Vectors -----
    entry(
      'vectors.basics',
      ['tn-12-math.vectors.products', 'tn-12-math.vectors.lines-planes'],
      ['vectors-3d'],
      'aligned',
      2,
      "TN coverage matches JEE expectations. Drill the standard problem types: angle between lines, foot of perpendicular, image of a point.",
    ),
    entry(
      'vectors.distances',
      ['tn-12-math.vectors.distances'],
      ['vectors-3d'],
      'depth-gap',
      4,
      "TN teaches the formulas. JEE problems hide the geometry: 'find the shortest distance between the path of two satellites' style. Need stretched problems with verbal framing.",
    ),

    // ----- Differential Calculus -----
    entry(
      'diff-calc.tangents-rates',
      ['tn-12-math.diff-calc.tangents-normals'],
      ['calculus'],
      'aligned',
      2,
      "Standard alignment. Add rate-of-change applied problems with physics flavor (rising water in a cone, shadow length, etc).",
    ),
    entry(
      'diff-calc.optimization',
      ['tn-12-math.diff-calc.maxima-minima'],
      ['calculus'],
      'depth-gap',
      4,
      "JEE's optimization problems require setting up the objective function from a verbal problem, which is rarely practiced at the TN level. Generate worked examples that emphasize the setup step.",
    ),
    entry(
      'diff-calc.mvt',
      ['tn-12-math.diff-calc.mvt'],
      ['calculus'],
      'aligned',
      2,
      "Well-aligned. Add a few proof-style problems where MVT is the key insight.",
    ),

    // ----- Partial Derivatives -----
    entry(
      'partial-diff.foundation',
      ['tn-12-math.partial-diff.basics', 'tn-12-math.partial-diff.eulers'],
      ['calculus'],
      'foundation',
      2,
      "Tricky case: TN has this, JEE Main does NOT (multivariable calc only appears in JEE Advanced). Mark as 'aligned for school' but de-prioritise for JEE Main. Useful for JEE Advanced or BITSAT aspirants.",
    ),

    // ----- Integration -----
    entry(
      'integration.applications',
      ['tn-12-math.integration.area', 'tn-12-math.integration.volume'],
      ['calculus'],
      'depth-gap',
      4,
      "TN covers area/volume formulas. JEE pushes for: areas requiring intersection of parametric curves, definite integrals using properties (King rule), and integration by partial fractions tricks. Major bridge zone.",
    ),
    entry(
      'integration.special-funcs',
      ['tn-12-math.integration.beta-gamma'],
      ['calculus'],
      'foundation',
      1,
      "Beta/Gamma functions are in TN but not in JEE Main syllabus. Note in admin UI; do NOT generate bridge content unless target switches to JEE Advanced or BITSAT.",
    ),

    // ----- ODEs -----
    entry(
      'ode.first-order',
      ['tn-12-math.ode.first-order'],
      ['calculus'],
      'aligned',
      3,
      "Solid alignment for the variable-separable and linear types. Drill non-obvious substitutions on homogeneous ODEs.",
    ),
    entry(
      'ode.second-order',
      ['tn-12-math.ode.second-order'],
      ['calculus'],
      'foundation',
      1,
      "Second-order ODEs are in TN but not in JEE Main. Tag accordingly.",
    ),

    // ----- Probability -----
    entry(
      'probability.distributions',
      ['tn-12-math.probability.discrete', 'tn-12-math.probability.continuous'],
      ['probability-stats'],
      'depth-gap',
      3,
      "TN teaches the formulas. JEE wires probability into combinatorics (selecting from sets, conditional probability with Bayes' theorem, expectation problems). Bridge content should connect distribution computations to event-counting problems.",
    ),

    // ----- Discrete -----
    entry(
      'discrete.logic-only',
      ['tn-12-math.discrete.logic'],
      ['algebra'],
      'foundation',
      1,
      "Truth tables / logical connectives are in JEE Main 'Mathematical Reasoning' which the JEE adapter currently tags under algebra. Bridge content here is small but valuable for completing the JEE syllabus.",
    ),
    entry(
      'discrete.binary-ops',
      ['tn-12-math.discrete.binary-ops'],
      [],
      'foundation',
      1,
      "Group theory basics — in TN, not in JEE. No bridge needed. Tagged for completeness.",
    ),
  ],
};

// Sanity-check that target_topic_ids reference real JEE topics
for (const e of TN_12_MATH_TO_JEE.entries) {
  for (const tid of e.target_topic_ids) {
    if (!JEE_MAIN_TOPIC_IDS.has(tid)) {
      // eslint-disable-next-line no-console
      console.warn(`[bridge:TN-12-MATH] entry '${e.id}' references unknown JEE topic '${tid}'`);
    }
  }
}
