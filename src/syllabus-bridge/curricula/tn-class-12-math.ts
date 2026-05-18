/**
 * Tamil Nadu State Board — Class 12 Mathematics.
 *
 * Source: TN Board Higher Secondary Mathematics syllabus (2023 revision).
 * Concepts and chapter numbers map to the standard NCERT-aligned TN textbook
 * (Volumes 1 + 2). Hour estimates reflect the school's classroom budget,
 * not the time a student would spend self-studying for JEE.
 */

import type { Curriculum } from '../types';

export const TN_CLASS_12_MATH: Curriculum = {
  id: 'TN-12-MATH',
  source_name: 'Tamil Nadu State Board',
  grade: 'Class 12',
  subject: 'Mathematics',
  display_name: 'TN Class 12 Mathematics',
  knowledge_track_id: 'TN-HSE-12-MATH',
  topics: [
    {
      id: 'tn-12-math.matrices-determinants',
      name: 'Applications of Matrices and Determinants',
      chapter_number: 1,
      estimated_hours: 18,
      concepts: [
        { id: 'tn-12-math.matrices-determinants.inverse', name: 'Inverse of a matrix using elementary row operations', source_ref: '1.2', difficulty: 3 },
        { id: 'tn-12-math.matrices-determinants.cramer', name: "Cramer's rule for system of equations", source_ref: '1.3', difficulty: 3 },
        { id: 'tn-12-math.matrices-determinants.consistency', name: 'Consistency and rank of a system', source_ref: '1.5', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.complex',
      name: 'Complex Numbers',
      chapter_number: 2,
      estimated_hours: 16,
      concepts: [
        { id: 'tn-12-math.complex.algebra', name: 'Algebra of complex numbers', source_ref: '2.2', difficulty: 2 },
        { id: 'tn-12-math.complex.argand', name: 'Argand diagram and polar form', source_ref: '2.4', difficulty: 3 },
        { id: 'tn-12-math.complex.de-moivre', name: "De Moivre's theorem and roots of unity", source_ref: '2.7', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.theory-equations',
      name: 'Theory of Equations',
      chapter_number: 3,
      estimated_hours: 12,
      concepts: [
        { id: 'tn-12-math.theory-equations.roots-coeffs', name: 'Relations between roots and coefficients', source_ref: '3.2', difficulty: 3 },
        { id: 'tn-12-math.theory-equations.transformations', name: 'Transformations of equations', source_ref: '3.4', difficulty: 4 },
        { id: 'tn-12-math.theory-equations.descartes', name: "Descartes' rule of signs", source_ref: '3.6', difficulty: 3 },
      ],
    },
    {
      id: 'tn-12-math.inverse-trig',
      name: 'Inverse Trigonometric Functions',
      chapter_number: 4,
      estimated_hours: 12,
      concepts: [
        { id: 'tn-12-math.inverse-trig.basic', name: 'Definition and graphs of inverse trig functions', source_ref: '4.2', difficulty: 2 },
        { id: 'tn-12-math.inverse-trig.properties', name: 'Properties and identities of inverse trig functions', source_ref: '4.5', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.conics',
      name: 'Two Dimensional Analytical Geometry-II',
      chapter_number: 5,
      estimated_hours: 18,
      concepts: [
        { id: 'tn-12-math.conics.circle', name: 'Equation of a circle and tangents', source_ref: '5.2', difficulty: 2 },
        { id: 'tn-12-math.conics.parabola', name: 'Parabola: focal chord, latus rectum', source_ref: '5.3', difficulty: 3 },
        { id: 'tn-12-math.conics.ellipse-hyperbola', name: 'Ellipse and hyperbola: eccentricity, foci, directrix', source_ref: '5.4', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.vectors',
      name: 'Applications of Vector Algebra',
      chapter_number: 6,
      estimated_hours: 16,
      concepts: [
        { id: 'tn-12-math.vectors.products', name: 'Scalar triple product and vector triple product', source_ref: '6.2', difficulty: 3 },
        { id: 'tn-12-math.vectors.lines-planes', name: 'Equations of lines and planes in space', source_ref: '6.4', difficulty: 3 },
        { id: 'tn-12-math.vectors.distances', name: 'Distance between skew lines, line and plane', source_ref: '6.6', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.diff-calc',
      name: 'Applications of Differential Calculus',
      chapter_number: 7,
      estimated_hours: 18,
      concepts: [
        { id: 'tn-12-math.diff-calc.tangents-normals', name: 'Tangents, normals, and rates of change', source_ref: '7.2', difficulty: 3 },
        { id: 'tn-12-math.diff-calc.maxima-minima', name: 'Maxima, minima, and inflection points', source_ref: '7.5', difficulty: 4 },
        { id: 'tn-12-math.diff-calc.mvt', name: "Mean value theorems (Rolle's, Lagrange's)", source_ref: '7.7', difficulty: 3 },
      ],
    },
    {
      id: 'tn-12-math.partial-diff',
      name: 'Differentials and Partial Derivatives',
      chapter_number: 8,
      estimated_hours: 10,
      concepts: [
        { id: 'tn-12-math.partial-diff.basics', name: 'Partial derivatives and total differentials', source_ref: '8.2', difficulty: 3 },
        { id: 'tn-12-math.partial-diff.eulers', name: "Euler's theorem on homogeneous functions", source_ref: '8.4', difficulty: 3 },
      ],
    },
    {
      id: 'tn-12-math.integration',
      name: 'Applications of Integration',
      chapter_number: 9,
      estimated_hours: 18,
      concepts: [
        { id: 'tn-12-math.integration.area', name: 'Area between curves', source_ref: '9.2', difficulty: 3 },
        { id: 'tn-12-math.integration.volume', name: 'Volume of revolution', source_ref: '9.3', difficulty: 3 },
        { id: 'tn-12-math.integration.beta-gamma', name: 'Beta and gamma functions (introduction)', source_ref: '9.5', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.ode',
      name: 'Ordinary Differential Equations',
      chapter_number: 10,
      estimated_hours: 16,
      concepts: [
        { id: 'tn-12-math.ode.first-order', name: 'First-order ODEs: variable separable, homogeneous, linear', source_ref: '10.3', difficulty: 3 },
        { id: 'tn-12-math.ode.second-order', name: 'Second-order linear ODEs with constant coefficients', source_ref: '10.6', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.probability',
      name: 'Probability Distributions',
      chapter_number: 11,
      estimated_hours: 12,
      concepts: [
        { id: 'tn-12-math.probability.discrete', name: 'Discrete distributions (binomial)', source_ref: '11.3', difficulty: 3 },
        { id: 'tn-12-math.probability.continuous', name: 'Continuous distributions and normal distribution', source_ref: '11.5', difficulty: 4 },
      ],
    },
    {
      id: 'tn-12-math.discrete',
      name: 'Discrete Mathematics',
      chapter_number: 12,
      estimated_hours: 10,
      concepts: [
        { id: 'tn-12-math.discrete.binary-ops', name: 'Binary operations and group structure', source_ref: '12.2', difficulty: 3 },
        { id: 'tn-12-math.discrete.logic', name: 'Mathematical logic: statements, connectives, truth tables', source_ref: '12.4', difficulty: 2 },
      ],
    },
  ],
};
