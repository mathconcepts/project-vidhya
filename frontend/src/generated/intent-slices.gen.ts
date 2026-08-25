/**
 * frontend/src/generated/intent-slices.gen.ts
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source of truth:
 *   data/curriculum/gate-em/atomic-catalogue.json
 *   frontend/public/data/pyq-bank.json
 *   src/blueprints/intent-tables.gen.ts
 *
 * Regenerate:
 *   cd frontend && npm run gen:intent-slices
 *   (or: npx tsx frontend/scripts/generate-intent-slices.ts)
 *
 * Edit the source files above, then regenerate — never edit this file
 * directly. A CI drift test re-runs the codegen's pure builder in-memory
 * and fails the build if this file is out of sync.
 *
 * Deliberately self-contained (no imports): this file ships into the
 * client bundle, so it carries only labels and counts — no question text,
 * no per-student data, no import of any backend module.
 */

/** Mirrors src/blueprints/intent-tables.gen.ts's IntentId — duplicated here
 * (not imported) so this file stays import-free for the client bundle. */
export type IntentId =
  | 'foundation_learning'
  | 'concept_clarification'
  | 'guided_problem_solving'
  | 'pyq_targeted_practice';

export interface IntentSlice {
  concept_id: string;
  dominant_intent: IntentId;
  /** The module-level pain point this concept's mapped atoms share (design
   * doc §5: "the pain point + the exam intent + the marks at stake"). */
  pain_point: string;
  /** What GATE actually tests on this concept (gate_examination_intent). */
  exam_intent: string;
  /** Subtopic labels of every catalogue atom mapped to this concept. */
  subtopics: string[];
  /** Count of PYQ-bank problems mapped to this concept. Honest — 0 is a
   * real value; the DPS renderer omits the PYQ sentence rather than the
   * codegen fabricating or hiding a nonzero count. */
  pyq_count: number;
  /** Sum of mapped atoms' question_inventory.target_total. */
  inventory_total: number;
  /** The dominant intent's stage sequence, stage kinds only, in order. */
  stage_order: string[];
}

/** Concepts present in CONCEPT_DOMINANT_INTENT with ≥1 mapped catalogue atom. */
export const INTENT_SLICES: Record<string, IntentSlice> = {
  'cayley-hamilton': {
    concept_id: 'cayley-hamilton',
    dominant_intent: 'guided_problem_solving',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Cayley-Hamilton theorem and matrix powers'],
    pyq_count: 1,
    inventory_total: 45,
    stage_order: ['discovery', 'worked_example', 'practice'],
  },
  'change-of-basis': {
    concept_id: 'change-of-basis',
    dominant_intent: 'concept_clarification',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Basis and dimension'],
    pyq_count: 1,
    inventory_total: 45,
    stage_order: ['formalism', 'worked_example', 'pyq_anchor'],
  },
  'determinants': {
    concept_id: 'determinants',
    dominant_intent: 'concept_clarification',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Determinant evaluation and determinant properties'],
    pyq_count: 8,
    inventory_total: 45,
    stage_order: ['formalism', 'worked_example', 'pyq_anchor'],
  },
  'diagonalization': {
    concept_id: 'diagonalization',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Diagonalization and modal representation'],
    pyq_count: 2,
    inventory_total: 45,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'eigenvalues': {
    concept_id: 'eigenvalues',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Eigenvalues and characteristic equation', 'Eigenvectors and eigenspaces', 'Eigenvalue properties of special matrices', 'Idempotent matrices'],
    pyq_count: 16,
    inventory_total: 180,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'least-squares': {
    concept_id: 'least-squares',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Projection matrices and orthogonal projection'],
    pyq_count: 1,
    inventory_total: 45,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'linear-independence': {
    concept_id: 'linear-independence',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Linear combinations and span', 'Linear dependence and independence'],
    pyq_count: 3,
    inventory_total: 90,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'lu-factorization': {
    concept_id: 'lu-factorization',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Gaussian elimination as a solver', 'LU decomposition: Doolittle, Crout and Cholesky ideas'],
    pyq_count: 2,
    inventory_total: 90,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'matrix-inverse': {
    concept_id: 'matrix-inverse',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Adjugate and inverse of a matrix'],
    pyq_count: 6,
    inventory_total: 45,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'matrix-operations': {
    concept_id: 'matrix-operations',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Matrix addition, subtraction and scalar multiplication', 'Matrix multiplication and compatibility', 'Transpose and transpose properties', 'Partitioned matrices and block operations'],
    pyq_count: 5,
    inventory_total: 180,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'null-space-column-space': {
    concept_id: 'null-space-column-space',
    dominant_intent: 'concept_clarification',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Rank, nullity and rank-nullity relationship'],
    pyq_count: 2,
    inventory_total: 45,
    stage_order: ['formalism', 'worked_example', 'pyq_anchor'],
  },
  'orthogonality': {
    concept_id: 'orthogonality',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Symmetric, skew-symmetric and orthogonal matrices', 'Projection matrices and orthogonal projection'],
    pyq_count: 3,
    inventory_total: 90,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'positive-definite-matrices': {
    concept_id: 'positive-definite-matrices',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Quadratic forms'],
    pyq_count: 2,
    inventory_total: 45,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'quadratic-forms': {
    concept_id: 'quadratic-forms',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Quadratic forms'],
    pyq_count: 1,
    inventory_total: 45,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'rank-nullity': {
    concept_id: 'rank-nullity',
    dominant_intent: 'concept_clarification',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Rank by row reduction and echelon form', 'Rank, nullity and rank-nullity relationship'],
    pyq_count: 8,
    inventory_total: 90,
    stage_order: ['formalism', 'worked_example', 'pyq_anchor'],
  },
  'svd': {
    concept_id: 'svd',
    dominant_intent: 'guided_problem_solving',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Singular value decomposition'],
    pyq_count: 3,
    inventory_total: 45,
    stage_order: ['discovery', 'worked_example', 'practice'],
  },
  'symmetric-matrices': {
    concept_id: 'symmetric-matrices',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Symmetric, skew-symmetric and orthogonal matrices', 'Eigenvalue properties of special matrices'],
    pyq_count: 5,
    inventory_total: 90,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'systems-of-equations': {
    concept_id: 'systems-of-equations',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Homogeneous systems of linear equations', 'Non-homogeneous systems and augmented matrices', 'Gaussian elimination as a solver'],
    pyq_count: 6,
    inventory_total: 135,
    stage_order: ['pyq_anchor', 'practice'],
  },
  'vector-spaces': {
    concept_id: 'vector-spaces',
    dominant_intent: 'pyq_targeted_practice',
    pain_point: 'Students often over-calculate, confuse definitions, or make row-operation and sign errors.',
    exam_intent: 'Recognize algebraic structure, apply a property, or solve a small system accurately under time pressure.',
    subtopics: ['Vector spaces and subspaces', 'Linear combinations and span', 'Basis and dimension'],
    pyq_count: 3,
    inventory_total: 135,
    stage_order: ['pyq_anchor', 'practice'],
  },
};
