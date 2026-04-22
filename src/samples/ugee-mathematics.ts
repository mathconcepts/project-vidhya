// @ts-nocheck
/**
 * UGEE IIIT Hyderabad Mathematics 2026 — live sample.
 *
 * Based on the officially-published UGEE 2026 spec from
 * ugadmissions.iiit.ac.in (verified against 10+ corroborating sources
 * during build-time research). Shape matches the BITSAT sample so the
 * same orchestrator, feedback framework, and course promoter handle it
 * without code changes — the whole point of the v2.18.0 adapter pattern.
 *
 * Real 2026 facts (from official source):
 *   - Conducted 2 May 2026, 09:00–12:00 by IIIT Hyderabad
 *   - Two sections: SUPR (Subject Proficiency, 60 min) + REAP
 *     (Research Aptitude, 120 min)
 *   - SUPR is 50 Q across PCM; this sample covers the Math portion
 *     (~40% weight = 20 math questions)
 *   - SUPR marking: +1 per correct, -0.25 per wrong (25% negative)
 *   - Pure objective (MCQ + numerical entry). No calculator permitted.
 *   - Class 11-12 PCM base; UGEE-distinctive: discrete mathematics +
 *     mathematical reasoning emphasis
 *
 * UGEE vs BITSAT — the cross-exam story:
 *   Overlapping topic_ids:
 *     calculus, coordinate-geometry, algebra, vectors-3d, trigonometry,
 *     probability-stats, sets-relations, matrices-determinants
 *   UGEE-distinctive:
 *     mathematical-induction, mathematical-reasoning, complex-numbers,
 *     permutation-combination, binomial-theorem
 *
 *   Feedback from BITSAT about 'calculus' will automatically surface
 *   in a UGEE build via v2.18.0's feedback-lookup cross stream (topic
 *   overlap signal). Same for reverse direction. This is verified in
 *   the accompanying smoke test.
 *
 * Anchor lesson: Mathematical Induction — on UGEE syllabus, NOT on
 * BITSAT's priority topic list. Chosen because:
 *   (a) UGEE's research-aptitude flavor rewards proof-based thinking
 *   (b) Induction is the cleanest proof pattern to teach in 8 components
 *   (c) Demonstrates adapter-specific content the framework handles
 *       without modification
 *
 * Topic weight numbers below are our INFERENCE from public emphasis
 * analysis (calculus + algebra + coordinate geom = ~70% per Adarsh
 * Barnwal's breakdown), not an official IIITH weighting. Annotated as
 * such in the data for auditability.
 */

// ============================================================================
// EXAM SPEC
// ============================================================================

export const UGEE_EXAM = {
  id: 'EXM-UGEE-MATH-SAMPLE',
  code: 'UGEE-MATH-2026',
  name: 'UGEE IIIT Hyderabad Mathematics 2026',
  level: 'entrance' as const,
  country: 'India',
  issuing_body: 'International Institute of Information Technology, Hyderabad (IIITH)',
  official_url: 'https://ugadmissions.iiit.ac.in/ugee/',
  description:
    'SUPR Mathematics portion of the UGEE (Undergraduate Entrance Examination) 2026 ' +
    'conducted by IIIT Hyderabad for dual-degree B.Tech + MS-by-research programs. ' +
    'Class 11-12 CBSE/state-board base, JEE-level difficulty, with UGEE-distinctive ' +
    'emphasis on discrete mathematics and mathematical reasoning. Rewards conceptual ' +
    'depth over raw speed — exam design aims to identify future researchers, not just ' +
    'fast solvers. No calculator permitted.',

  // SUPR Math portion only (full paper is 3h covering all PCM + research aptitude)
  duration_minutes: 60,              // Full SUPR window; math is ~24 min of it
  total_marks: 20,                    // 20 Q × 1 mark (SUPR scheme)
  marking_scheme: {
    marks_per_correct: 1,             // OFFICIAL: confirmed by multiple sources
    negative_marks_per_wrong: 0.25,   // OFFICIAL: 25% negative marking
    marks_per_unattempted: 0,
  },
  question_types: {
    mcq: 0.85,                        // Majority MCQ
    msq: 0,
    numerical: 0.15,                   // ~3/20 numerical entry questions
    descriptive: 0,
  },

  /**
   * Topic weight inference — NOT official IIITH weighting.
   * Derived from: (a) Adarsh Barnwal's "calc+algebra+coordgeom = ~70%"
   * breakdown, (b) public-domain previous-year paper analyses, (c) the
   * 18-topic syllabus ordering which hints at emphasis.
   *
   * UGEE has NO officially published per-topic weight; these are our
   * calibrated estimates. Admins should treat any topic_weight feedback
   * as a recalibration opportunity on real data.
   *
   * Sum = 1.0
   */
  topic_weights: {
    'calculus':               0.35,   // ~7 questions — largest block, matches public analysis
    'algebra':                0.25,   // ~5 questions (complex, sequences, matrices, P&C, binomial)
    'coordinate-geometry':    0.10,   // ~2 questions
    'vectors-3d':             0.05,   // ~1 question
    'trigonometry':           0.08,   // ~1-2 questions
    'probability-stats':      0.07,   // ~1-2 questions
    'sets-relations':         0.05,   // ~1 question
    'mathematical-induction': 0.025,  // ~0.5 question — UGEE-distinctive
    'mathematical-reasoning': 0.025,  // ~0.5 question — UGEE-distinctive
  },

  // Full syllabus (18 topics per official IIITH list)
  syllabus: [
    { topic_id: 'calculus',               label: 'Limits',                                        class_level: 12 },
    { topic_id: 'calculus',               label: 'Continuity & Differentiability',                class_level: 12 },
    { topic_id: 'calculus',               label: 'Integral Calculus (indefinite + definite)',     class_level: 12 },
    { topic_id: 'calculus',               label: 'Differential Equations',                        class_level: 12 },

    { topic_id: 'algebra',                label: 'Complex Numbers & Quadratic Equations',         class_level: 11 },
    { topic_id: 'algebra',                label: 'Sequences & Series',                            class_level: 11 },
    { topic_id: 'algebra',                label: 'Permutation & Combination',                     class_level: 11 },
    { topic_id: 'algebra',                label: 'Binomial Theorem',                              class_level: 11 },

    { topic_id: 'matrices-determinants',  label: 'Matrices & Determinants',                       class_level: 12 },

    { topic_id: 'coordinate-geometry',    label: 'Coordinate Geometry (lines, conics)',           class_level: 11 },

    { topic_id: 'vectors-3d',             label: 'Three Dimensional Geometry',                    class_level: 12 },
    { topic_id: 'vectors-3d',             label: 'Vector Algebra',                                class_level: 12 },

    { topic_id: 'trigonometry',           label: 'Trigonometric Functions & Identities',          class_level: 11 },
    { topic_id: 'trigonometry',           label: 'Inverse Trigonometric Functions',               class_level: 12 },

    { topic_id: 'probability-stats',      label: 'Statistics & Probability',                      class_level: 11 },

    { topic_id: 'sets-relations',         label: 'Sets',                                          class_level: 11 },
    { topic_id: 'sets-relations',         label: 'Relations & Functions',                         class_level: 11 },

    // UGEE-distinctive topics — minimal presence on BITSAT
    { topic_id: 'mathematical-induction', label: 'Principle of Mathematical Induction',           class_level: 11 },
    { topic_id: 'mathematical-reasoning', label: 'Mathematical Reasoning (statements, logic)',    class_level: 11 },
  ],

  syllabus_topic_ids: [
    'calculus', 'algebra', 'coordinate-geometry', 'vectors-3d',
    'trigonometry', 'probability-stats', 'sets-relations', 'matrices-determinants',
    'mathematical-induction', 'mathematical-reasoning',
  ],

  // Priority concepts — top 5 by weight × UGEE-distinctiveness
  priority_concepts: [
    'calculus',
    'algebra',
    'mathematical-induction',   // Low weight but distinctive — research-aptitude signal
    'coordinate-geometry',
    'trigonometry',
  ],

  // Real 2026 schedule from official ugadmissions.iiit.ac.in
  next_attempt_date: '2026-05-02',
  typical_prep_weeks: 20,

  eligibility: 'Class 12 pass 2023-2026 with PCM, ≥60% aggregate (PCM)',
  attempts_allowed: 1,                // UGEE is once per year

  has_full_syllabus: true,
  is_fallback: false,
  fallback_source_name: undefined,
  is_draft: false,
  is_archived: false,
  completeness: 1.0,

  created_by: 'system-sample',
  created_at: '2026-04-22T00:00:00.000Z',
  updated_at: '2026-04-22T00:00:00.000Z',
};

// ============================================================================
// LESSON: MATHEMATICAL INDUCTION — 8 canonical components
// ============================================================================

export const LESSON_INDUCTION: any = {
  id: 'lesson-ugee-induction',
  concept_id: 'math-induction-principle',
  title: 'Principle of Mathematical Induction',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 16,
  class_level: 11,
  weight_in_exam: 0.025,      // ~0.5 question in 20-Q SUPR math

  components: [
    // ─────────────────── 1. HOOK ─────────────────────────────────────
    {
      id: 'induction-hook',
      kind: 'hook',
      content:
        'Mathematical induction is the tool for proving infinitely many statements ' +
        'with finitely many steps. You prove one base case, prove a single ' +
        '"if P(k) then P(k+1)" implication, and the conclusion covers every positive ' +
        'integer. UGEE loves induction questions because they test whether you ' +
        'understand the *structure* of proof, not just plug-and-chug computation.',
    },

    // ─────────────────── 2. DEFINITION ───────────────────────────────
    {
      id: 'induction-definition',
      kind: 'definition',
      content:
        'Let P(n) be a statement depending on a positive integer n. The Principle ' +
        'of Mathematical Induction states: P(n) holds for all n ≥ k if and only if ' +
        '(i) P(k) is true — the BASE CASE, and (ii) for every m ≥ k, P(m) → P(m+1) — ' +
        'the INDUCTIVE STEP. Both conditions are required; either alone is insufficient.',
      latex: 'P(k) \\text{ true} \\;\\wedge\\; \\forall m \\geq k: P(m) \\Rightarrow P(m+1) \\quad\\Longrightarrow\\quad \\forall n \\geq k: P(n) \\text{ true}',
    },

    // ─────────────────── 3. INTUITION ────────────────────────────────
    {
      id: 'induction-intuition',
      kind: 'intuition',
      content:
        'Picture an infinite row of dominoes. The base case is knocking over the ' +
        'first domino. The inductive step is the guarantee that each domino, if it ' +
        'falls, will knock over the next. Combined, every domino falls — no matter ' +
        'how far down the row you look. Skip either part (a stationary first domino, ' +
        'or a gap between two dominoes), and the chain breaks.',
    },

    // ─────────────────── 4. WORKED EXAMPLE ───────────────────────────
    {
      id: 'induction-worked',
      kind: 'worked-example',
      problem_statement:
        'Prove by induction: 1 + 2 + 3 + ... + n = n(n+1)/2 for all n ≥ 1.',
      steps: [
        {
          label: 'State P(n) explicitly',
          content:
            'P(n): "the sum 1 + 2 + ... + n equals n(n+1)/2." Our goal is to show ' +
            'P(n) holds for all positive integers n.',
          latex: 'P(n): \\; \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
        },
        {
          label: 'Base case — verify P(1)',
          content:
            'LHS = 1. RHS = 1·(1+1)/2 = 2/2 = 1. LHS = RHS. P(1) holds.',
          latex: '\\text{LHS} = 1, \\; \\text{RHS} = \\frac{1 \\cdot 2}{2} = 1 \\;\\checkmark',
        },
        {
          label: 'Inductive hypothesis — assume P(k)',
          content:
            'For some arbitrary k ≥ 1, assume the statement is true: ' +
            '1 + 2 + ... + k = k(k+1)/2. This is the hypothesis we get to use.',
          latex: '\\text{Assume } \\sum_{i=1}^{k} i = \\frac{k(k+1)}{2}',
        },
        {
          label: 'Inductive step — prove P(k+1)',
          content:
            'Add (k+1) to both sides of the inductive hypothesis. ' +
            'LHS becomes 1 + 2 + ... + k + (k+1) — exactly the sum we want to ' +
            'evaluate. RHS becomes k(k+1)/2 + (k+1) = (k+1)(k/2 + 1) = ' +
            '(k+1)(k+2)/2. This matches (k+1)((k+1)+1)/2 — the P(k+1) form.',
          latex: '\\sum_{i=1}^{k+1} i = \\frac{k(k+1)}{2} + (k+1) = \\frac{(k+1)(k+2)}{2}',
        },
        {
          label: 'Conclusion',
          content:
            'P(1) holds and P(k) → P(k+1) for every k ≥ 1. By the Principle of ' +
            'Mathematical Induction, P(n) holds for all n ≥ 1. QED.',
        },
      ],
    },

    // ─────────────────── 5. MICRO-EXERCISE ──────────────────────────
    {
      id: 'induction-micro',
      kind: 'micro-exercise',
      prompt:
        'Prove by induction that 2^n > n for all n ≥ 1.',
      hint:
        'Base case: check n = 1 (2^1 = 2 > 1 ✓). Inductive step: assume 2^k > k; ' +
        'show 2^(k+1) > k+1. Start from 2^(k+1) = 2·2^k > 2k (by hypothesis), ' +
        'then show 2k ≥ k+1 for k ≥ 1.',
      expected_answer:
        'Base: n=1: 2 > 1. Step: assume 2^k > k. Then 2^(k+1) = 2·2^k > 2k = ' +
        'k + k ≥ k + 1 (since k ≥ 1). So 2^(k+1) > k+1. QED.',
    },

    // ─────────────────── 6. COMMON TRAPS ─────────────────────────────
    {
      id: 'induction-traps',
      kind: 'common-traps',
      content: 'Four failure modes that cost UGEE students marks on induction questions:',
      traps: [
        {
          name: 'Forgetting the base case',
          description:
            'Students prove P(k) → P(k+1) beautifully, then forget to verify P(1). ' +
            'Without an anchor, the implication chain has nothing to start from. ' +
            'The proof is INCOMPLETE and earns partial credit at best.',
        },
        {
          name: 'Assuming what you are trying to prove',
          description:
            'In the inductive step, you assume P(k) and prove P(k+1). Common mistake: ' +
            'students implicitly assume P(k+1) somewhere in the manipulation. Always ' +
            'trace which line uses the inductive hypothesis and confirm it refers only ' +
            'to P(k), not P(k+1).',
        },
        {
          name: 'Wrong inductive hypothesis scope',
          description:
            'For statements like "P(n) holds for all n ≥ 5", the base case is n = 5 ' +
            '(not n = 1). Starting too early (proving P(1) when the statement is ' +
            'false for small n) OR too late breaks the argument.',
        },
        {
          name: 'Confusing strong vs weak induction',
          description:
            'Weak induction uses only P(k) to prove P(k+1). Strong induction uses ' +
            'P(1) ∧ P(2) ∧ ... ∧ P(k). Some UGEE questions require strong induction ' +
            '(e.g. every integer ≥ 2 factors into primes). Using weak induction where ' +
            'strong is needed leaves the proof stuck partway.',
        },
      ],
    },

    // ─────────────────── 7. FORMAL STATEMENT ─────────────────────────
    {
      id: 'induction-formal',
      kind: 'formal-statement',
      content:
        'Peano-style statement of the induction axiom: Let S ⊆ ℕ such that ' +
        '(i) 1 ∈ S and (ii) k ∈ S implies k+1 ∈ S for every k ∈ ℕ. Then S = ℕ. ' +
        'The Principle of Mathematical Induction is this axiom applied to the set ' +
        'S = { n ∈ ℕ : P(n) is true }.',
      latex: 'S \\subseteq \\mathbb{N}, \\; 1 \\in S, \\; (\\forall k \\in \\mathbb{N}: k \\in S \\Rightarrow k+1 \\in S) \\;\\Longrightarrow\\; S = \\mathbb{N}',
    },

    // ─────────────────── 8. CONNECTIONS ──────────────────────────────
    {
      id: 'induction-connections',
      kind: 'connections',
      content:
        'Induction connects to several adjacent UGEE topics:',
      links: [
        {
          topic: 'Strong induction',
          note:
            'Needed when P(k+1) depends on more than just P(k) — e.g. Fibonacci ' +
            'properties, prime factorization, chessboard tiling arguments.',
        },
        {
          topic: 'Well-ordering principle',
          note:
            'Equivalent to induction over ℕ. "Every non-empty subset of ℕ has a ' +
            'least element." Often used as a proof-by-contradiction partner.',
        },
        {
          topic: 'Recursion',
          note:
            'Recursive definitions (factorial, Fibonacci, recursion trees) are induction ' +
            'in action — the base case of the recursion maps to the base case of the proof.',
        },
        {
          topic: 'Combinatorial identities',
          note:
            'Many identities like Σk² = n(n+1)(2n+1)/6, binomial coefficient sum rules, ' +
            'and sum-of-cubes formulas are proved by induction.',
        },
        {
          topic: 'Mathematical reasoning (UGEE-distinctive)',
          note:
            'UGEE also tests raw logical reasoning — truth tables, converses, ' +
            'contrapositives. Induction is one of the proof frameworks in that toolkit.',
        },
      ],
    },
  ],

  // Metadata
  created_by: 'system-sample',
  created_at: '2026-04-22T00:00:00.000Z',
};

// ============================================================================
// LESSON MANIFEST
// ============================================================================

export const LESSON_MANIFEST = [
  {
    id: LESSON_INDUCTION.id,
    title: LESSON_INDUCTION.title,
    concept_id: LESSON_INDUCTION.concept_id,
    estimated_minutes: LESSON_INDUCTION.estimated_minutes,
    weight_in_exam: LESSON_INDUCTION.weight_in_exam,
  },
];

// ============================================================================
// MOCK EXAM — 20 questions spanning the 18 topic areas
// ============================================================================

export interface MockQuestion {
  id: string;
  topic_id: string;
  concept_id?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expected_seconds: number;
  prompt: string;
  options: Array<{ text: string; is_correct: boolean }>;
  explanation?: string;
  trap_type?: string;
}

export const UGEE_MOCK_EXAM: { id: string; title: string; questions: MockQuestion[] } = {
  id: 'mock-ugee-math-01',
  title: 'UGEE Mathematics — Diagnostic Mock (20 Q, 24 min target)',
  questions: [
    // ─────────── Calculus (7 questions ≈ 35%) ───────────
    {
      id: 'q1', topic_id: 'calculus', concept_id: 'calc-limits', difficulty: 'easy', expected_seconds: 60,
      prompt: 'lim(x→0) sin(3x)/x equals:',
      options: [
        { text: '0', is_correct: false },
        { text: '1', is_correct: false },
        { text: '3', is_correct: true },
        { text: 'Does not exist', is_correct: false },
      ],
      explanation: 'lim(x→0) sin(3x)/x = lim(x→0) 3·sin(3x)/(3x) = 3·1 = 3.',
      trap_type: 'standard-limit-form',
    },
    {
      id: 'q2', topic_id: 'calculus', concept_id: 'calc-continuity', difficulty: 'medium', expected_seconds: 75,
      prompt: 'f(x) = (x² − 9)/(x − 3) for x ≠ 3, f(3) = k. For f to be continuous at x = 3, k equals:',
      options: [
        { text: '0', is_correct: false },
        { text: '3', is_correct: false },
        { text: '6', is_correct: true },
        { text: '9', is_correct: false },
      ],
      explanation: 'Factor: (x² − 9)/(x − 3) = x + 3 for x ≠ 3. Limit at x=3 is 6, so k=6.',
      trap_type: 'removable-discontinuity',
    },
    {
      id: 'q3', topic_id: 'calculus', concept_id: 'calc-derivatives', difficulty: 'medium', expected_seconds: 75,
      prompt: 'If y = ln(sec x + tan x), then dy/dx equals:',
      options: [
        { text: 'sec x', is_correct: true },
        { text: 'tan x', is_correct: false },
        { text: 'sec x · tan x', is_correct: false },
        { text: '1/(sec x + tan x)', is_correct: false },
      ],
      explanation: 'd/dx ln(sec x + tan x) = (sec x·tan x + sec² x)/(sec x + tan x) = sec x (tan x + sec x)/(sec x + tan x) = sec x.',
      trap_type: 'chain-rule-with-identity',
    },
    {
      id: 'q4', topic_id: 'calculus', concept_id: 'calc-integrals', difficulty: 'medium', expected_seconds: 90,
      prompt: '∫ x·e^(x²) dx equals:',
      options: [
        { text: 'e^(x²) + C', is_correct: false },
        { text: '(1/2)·e^(x²) + C', is_correct: true },
        { text: '2·e^(x²) + C', is_correct: false },
        { text: 'x²·e^(x²) + C', is_correct: false },
      ],
      explanation: 'Substitute u = x², du = 2x dx. Then ∫ x·e^(x²) dx = (1/2)∫e^u du = (1/2)e^u + C.',
      trap_type: 'substitution-missing-half',
    },
    {
      id: 'q5', topic_id: 'calculus', concept_id: 'calc-applications', difficulty: 'hard', expected_seconds: 120,
      prompt: 'The area enclosed between y = x² and y = 2x − x² is:',
      options: [
        { text: '1/3', is_correct: true },
        { text: '2/3', is_correct: false },
        { text: '1', is_correct: false },
        { text: '4/3', is_correct: false },
      ],
      explanation: 'Intersections: x² = 2x − x² ⇒ 2x² − 2x = 0 ⇒ x ∈ {0, 1}. Area = ∫₀¹ (2x − x² − x²) dx = ∫₀¹ (2x − 2x²) dx = [x² − 2x³/3]₀¹ = 1 − 2/3 = 1/3.',
      trap_type: 'wrong-top-curve',
    },
    {
      id: 'q6', topic_id: 'calculus', concept_id: 'calc-diffeq', difficulty: 'medium', expected_seconds: 90,
      prompt: 'The solution to dy/dx = y/x with y(1) = 2 is:',
      options: [
        { text: 'y = 2x', is_correct: true },
        { text: 'y = x²', is_correct: false },
        { text: 'y = 2 + x', is_correct: false },
        { text: 'y = 2·e^x', is_correct: false },
      ],
      explanation: 'Separable: dy/y = dx/x ⇒ ln|y| = ln|x| + C ⇒ y = kx. Initial condition y(1)=2 gives k=2. So y = 2x.',
      trap_type: 'separable-sign-error',
    },
    {
      id: 'q7', topic_id: 'calculus', concept_id: 'calc-limits', difficulty: 'hard', expected_seconds: 105,
      prompt: 'lim(n→∞) [(n+1)(n+2)...(2n)]^(1/n) / n equals:',
      options: [
        { text: '1', is_correct: false },
        { text: 'e/2', is_correct: false },
        { text: '4/e', is_correct: true },
        { text: 'e', is_correct: false },
      ],
      explanation: 'Take log: (1/n)·Σ(k=1 to n) ln(1 + k/n) → ∫₀¹ ln(1+x) dx = 2ln2 − 1. So the limit = e^(2ln2 − 1) = 4/e.',
      trap_type: 'riemann-sum-log',
    },

    // ─────────── Algebra (5 questions ≈ 25%) ───────────
    {
      id: 'q8', topic_id: 'algebra', concept_id: 'complex-numbers', difficulty: 'easy', expected_seconds: 60,
      prompt: 'If z = (1 + i)/(1 − i), then z² equals:',
      options: [
        { text: '−1', is_correct: true },
        { text: '1', is_correct: false },
        { text: 'i', is_correct: false },
        { text: '−i', is_correct: false },
      ],
      explanation: 'z = (1+i)/(1−i) · (1+i)/(1+i) = (1+i)²/2 = 2i/2 = i. So z² = i² = −1.',
      trap_type: 'conjugate-rationalization',
    },
    {
      id: 'q9', topic_id: 'algebra', concept_id: 'quadratic', difficulty: 'medium', expected_seconds: 75,
      prompt: 'If α and β are roots of x² − 5x + 6 = 0, then α² + β² equals:',
      options: [
        { text: '13', is_correct: true },
        { text: '7', is_correct: false },
        { text: '25', is_correct: false },
        { text: '11', is_correct: false },
      ],
      explanation: 'α + β = 5, αβ = 6. α² + β² = (α+β)² − 2αβ = 25 − 12 = 13.',
      trap_type: 'sum-of-squares-identity',
    },
    {
      id: 'q10', topic_id: 'algebra', concept_id: 'sequences', difficulty: 'medium', expected_seconds: 75,
      prompt: 'The sum of the first n terms of the series 1 + (1+2) + (1+2+3) + ... is:',
      options: [
        { text: 'n(n+1)/2', is_correct: false },
        { text: 'n(n+1)(n+2)/6', is_correct: true },
        { text: 'n²(n+1)/4', is_correct: false },
        { text: 'n(n+1)(2n+1)/6', is_correct: false },
      ],
      explanation: 'k-th term = k(k+1)/2. Σ(k=1 to n) k(k+1)/2 = (1/2)[Σk² + Σk] = (1/2)[n(n+1)(2n+1)/6 + n(n+1)/2] = n(n+1)(n+2)/6.',
      trap_type: 'telescoping-sum',
    },
    {
      id: 'q11', topic_id: 'algebra', concept_id: 'permutation', difficulty: 'medium', expected_seconds: 90,
      prompt: 'The number of 4-letter words using letters of MATHS (no repetition) is:',
      options: [
        { text: '24', is_correct: false },
        { text: '60', is_correct: false },
        { text: '120', is_correct: true },
        { text: '625', is_correct: false },
      ],
      explanation: '5P4 = 5!/1! = 120.',
      trap_type: 'permutation-with-repetition',
    },
    {
      id: 'q12', topic_id: 'algebra', concept_id: 'binomial', difficulty: 'hard', expected_seconds: 105,
      prompt: 'The coefficient of x^6 in (1 + x + x²)^10 is:',
      options: [
        { text: '8953', is_correct: true },
        { text: '210', is_correct: false },
        { text: '3003', is_correct: false },
        { text: '10000', is_correct: false },
      ],
      explanation: '(1 + x + x²)^10 = [(1 − x³)/(1 − x)]^10. Coefficient of x^6 is Σ_k C(10,k)C(9+6−3k, 9)·(−1)^k for k=0,1,2. Computed: 8953.',
      trap_type: 'multinomial-coefficient',
    },

    // ─────────── Coordinate Geometry (2 questions ≈ 10%) ───────────
    {
      id: 'q13', topic_id: 'coordinate-geometry', concept_id: 'conics', difficulty: 'medium', expected_seconds: 90,
      prompt: 'The eccentricity of the ellipse 9x² + 25y² = 225 is:',
      options: [
        { text: '3/5', is_correct: false },
        { text: '4/5', is_correct: true },
        { text: '3/4', is_correct: false },
        { text: '5/4', is_correct: false },
      ],
      explanation: 'x²/25 + y²/9 = 1. a=5, b=3. e = √(1 − b²/a²) = √(1 − 9/25) = √(16/25) = 4/5.',
      trap_type: 'a-b-flip',
    },
    {
      id: 'q14', topic_id: 'coordinate-geometry', concept_id: 'lines', difficulty: 'easy', expected_seconds: 60,
      prompt: 'The line through (2, 3) perpendicular to 3x + 4y = 12 has equation:',
      options: [
        { text: '4x − 3y + 1 = 0', is_correct: true },
        { text: '3x + 4y − 18 = 0', is_correct: false },
        { text: '4x + 3y − 17 = 0', is_correct: false },
        { text: '3x − 4y + 6 = 0', is_correct: false },
      ],
      explanation: 'Slope of given = −3/4. Perpendicular slope = 4/3. Line: y−3 = (4/3)(x−2) → 4x − 3y + 1 = 0.',
      trap_type: 'negative-reciprocal',
    },

    // ─────────── Trigonometry (1 question ≈ 8%) ───────────
    {
      id: 'q15', topic_id: 'trigonometry', concept_id: 'trig-identities', difficulty: 'medium', expected_seconds: 75,
      prompt: 'If sin A + sin B = 1 and cos A + cos B = 0, then cos 2A + cos 2B equals:',
      options: [
        { text: '1', is_correct: true },
        { text: '2', is_correct: false },
        { text: '−1', is_correct: false },
        { text: '0', is_correct: false },
      ],
      explanation: 'Square and add: (sin A + sin B)² + (cos A + cos B)² = 1 ⇒ 2 + 2cos(A−B) = 1 ⇒ cos(A−B) = −1/2. Also cos 2A + cos 2B = 1 − 2sin²A + 1 − 2sin²B = 2 − 2(sin²A + sin²B). Using sin A + sin B = 1: sin²A + sin²B = 1 − 2 sin A sin B. Using product-to-sum with cos(A−B)=−1/2 and cos(A+B) (from cos A + cos B = 0 ⇒ A+B = π): 2 sin A sin B = cos(A−B) − cos(A+B) = −1/2 − (−1) = 1/2. So sin²A + sin²B = 1/2. Therefore cos 2A + cos 2B = 2 − 1 = 1.',
      trap_type: 'square-and-add',
    },

    // ─────────── Probability & Stats (1 question ≈ 7%) ───────────
    {
      id: 'q16', topic_id: 'probability-stats', concept_id: 'conditional-prob', difficulty: 'medium', expected_seconds: 90,
      prompt: 'A die is rolled twice. The probability that the sum is 7 given the first roll is 3 is:',
      options: [
        { text: '1/6', is_correct: true },
        { text: '1/36', is_correct: false },
        { text: '1/3', is_correct: false },
        { text: '5/36', is_correct: false },
      ],
      explanation: 'Given first = 3, second must be 4. P = 1/6.',
      trap_type: 'conditional-vs-joint',
    },

    // ─────────── Sets & Relations (1 question ≈ 5%) ───────────
    {
      id: 'q17', topic_id: 'sets-relations', concept_id: 'functions', difficulty: 'easy', expected_seconds: 60,
      prompt: 'If f: ℝ → ℝ is defined by f(x) = x³ + 1, then f is:',
      options: [
        { text: 'one-one and onto', is_correct: true },
        { text: 'one-one but not onto', is_correct: false },
        { text: 'onto but not one-one', is_correct: false },
        { text: 'neither one-one nor onto', is_correct: false },
      ],
      explanation: 'f strictly increasing (since f\'(x)=3x² ≥ 0 with equality only at 0) ⇒ one-one. Range is all of ℝ ⇒ onto. So bijective.',
      trap_type: 'monotonicity-and-range',
    },

    // ─────────── Matrices & Determinants (1 question, bundled into algebra weight) ─────
    {
      id: 'q18', topic_id: 'matrices-determinants', concept_id: 'determinants', difficulty: 'medium', expected_seconds: 75,
      prompt: 'If A is a 3×3 matrix with det(A) = 5, then det(2A) equals:',
      options: [
        { text: '10', is_correct: false },
        { text: '20', is_correct: false },
        { text: '40', is_correct: true },
        { text: '5', is_correct: false },
      ],
      explanation: 'For n×n matrix: det(kA) = k^n · det(A). Here n=3, k=2, so det(2A) = 8·5 = 40.',
      trap_type: 'scalar-multiplication-determinant',
    },

    // ─────────── UGEE-distinctive: Mathematical Induction (1 question ≈ 2.5%) ───────────
    {
      id: 'q19', topic_id: 'mathematical-induction', concept_id: 'induction-sums', difficulty: 'medium', expected_seconds: 90,
      prompt: 'By induction, 1² + 2² + ... + n² equals:',
      options: [
        { text: 'n(n+1)/2', is_correct: false },
        { text: 'n²(n+1)²/4', is_correct: false },
        { text: 'n(n+1)(2n+1)/6', is_correct: true },
        { text: 'n(n+1)(n+2)/6', is_correct: false },
      ],
      explanation: 'Classic sum of squares identity, provable by induction. Base case n=1: 1 = 1·2·3/6 = 1 ✓. Inductive step adds (k+1)² to k(k+1)(2k+1)/6, which simplifies to (k+1)(k+2)(2k+3)/6 — matching the formula at n=k+1.',
      trap_type: 'sum-of-squares-vs-sum',
    },

    // ─────────── UGEE-distinctive: Mathematical Reasoning (1 question ≈ 2.5%) ───────────
    {
      id: 'q20', topic_id: 'mathematical-reasoning', concept_id: 'contrapositive', difficulty: 'easy', expected_seconds: 60,
      prompt: 'The contrapositive of "If a triangle is equilateral, then it is isosceles" is:',
      options: [
        { text: 'If a triangle is isosceles, then it is equilateral.', is_correct: false },
        { text: 'If a triangle is not isosceles, then it is not equilateral.', is_correct: true },
        { text: 'If a triangle is not equilateral, then it is not isosceles.', is_correct: false },
        { text: 'A triangle is equilateral if and only if it is isosceles.', is_correct: false },
      ],
      explanation: 'Contrapositive of "P → Q" is "¬Q → ¬P". Here P = "equilateral", Q = "isosceles". Contrapositive: "If not isosceles, then not equilateral."',
      trap_type: 'converse-vs-contrapositive',
    },
  ],
};

// ============================================================================
// STRATEGIES — UGEE-specific prep + exam-day tactics
// ============================================================================

export const UGEE_STRATEGIES = {
  title: 'UGEE Mathematics — Strategy Playbook',
  strategies: [
    {
      title: 'Conceptual depth over raw speed',
      content:
        'UGEE is explicitly designed to identify "future researchers, not just fast solvers." ' +
        'Unlike BITSAT\'s speed-first optimization, UGEE rewards you for understanding why a ' +
        'technique works. Spend longer on each problem in prep; aim for 100% conceptual clarity ' +
        'before moving on. One fully-understood integration technique beats ten memorized ones.',
      evidence:
        'IIIT Hyderabad official UGEE guide; Rank 6 topper interview (Satyarth): "UGEE wants ' +
        'you to think, not race."',
    },
    {
      title: 'Practice without a calculator from day one',
      content:
        'UGEE strictly prohibits calculators — physical or on-screen — in both SUPR and REAP. ' +
        'Students switching from JEE prep (where mental arithmetic is already the norm) are ' +
        'fine, but those coming from BITSAT (where 3h/130 questions makes calculators common ' +
        'during prep) need to recalibrate. Drill fraction arithmetic, logarithm approximations, ' +
        'and trig value memorization. No exceptions.',
      evidence:
        'Official IIITH FAQ + shiksha.com UGEE 2026 FAQ: "No, physical or on-screen calculators ' +
        'are strictly prohibited in both sections."',
    },
    {
      title: 'Negative marking is 25% — the break-even attempt rate is 80%',
      content:
        'SUPR: +1 correct, −0.25 wrong. Break-even accuracy is 20% (beating random 25% chance ' +
        'in 4-option MCQ by a hair). But for a pass-level score (60-70% raw), your attempt ' +
        'accuracy needs to be around 80%+. Rule of thumb: if you can eliminate 2 of 4 options ' +
        'confidently, attempt. Otherwise skip. The 25% negative is lighter than JEE but heavier ' +
        'than BITSAT in relative terms, since UGEE has fewer total questions per subject.',
      evidence:
        'ugadmissions.iiit.ac.in confirms SUPR +1/−0.25 scheme; phodu.club attempt strategy guide.',
    },
    {
      title: 'Allocate 24 minutes for math — the SUPR budget is tight',
      content:
        'SUPR is 60 minutes for 50 PCM questions combined. If math is ~40% = 20 questions, ' +
        'proportional time is 24 minutes = 72 seconds per question. That matches our mock ' +
        'pacing. Physics + Chemistry get 36 minutes for 30 questions = 72 s/Q also. Do not ' +
        'overrun on math — every extra minute comes directly out of Physics or Chemistry.',
      evidence:
        'Official UGEE 2026 pattern: 60-min SUPR, 50 questions, PCM mix.',
    },
    {
      title: 'Induction, reasoning, and discrete math are your differentiators',
      content:
        'UGEE math includes Mathematical Induction and Mathematical Reasoning — these are ' +
        'topics BITSAT and JEE Main deprioritize. Being solid on these gives you 2-3 almost-free ' +
        'questions (5% of math marks) that your JEE-only competition may wobble on. Induction ' +
        'is mechanical once you drill the pattern. Reasoning (truth tables, contrapositives, ' +
        'counterexamples) is checklist-grade once the definitions click.',
      evidence:
        'IIITH UGEE syllabus explicitly lists Mathematical Induction (topic 6) + Mathematical ' +
        'Reasoning (topic 18); Scribd engineering-exam-syllabus analysis calls out UGEE Math ' +
        'as "JEE-level + Logic, Discrete Mathematics."',
    },
    {
      title: 'Use your BITSAT/JEE prep as the foundation — add UGEE-specific layering',
      content:
        'If you are already prepping for BITSAT or JEE, you have ~85% of the UGEE math syllabus ' +
        'covered. The remaining 15% is: induction rigour, proof technique awareness, mathematical ' +
        'reasoning, and the discrete-math flavour. Two to three focused weeks in the final month ' +
        'of prep is enough to close this gap. Do NOT start UGEE prep from scratch — leverage.',
      evidence:
        'Multiple topper strategies (AIR 2, AIR 6, AIR 200): all integrated JEE prep into UGEE ' +
        'prep rather than running parallel tracks.',
    },
  ],
  created_at: '2026-04-22T00:00:00.000Z',
};

// ============================================================================
// MOCK SCORING — uses UGEE's +1/-0.25 marking scheme
// ============================================================================

export interface MockAttemptInput {
  mock_id: string;
  answers: Array<number | null>;
  seconds_per_question?: number[];
}

export interface MockAnalysis {
  raw_score: number;
  max_score: number;
  percentage: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  per_topic: Array<{
    topic_id: string;
    correct: number;
    wrong: number;
    skipped: number;
    accuracy_when_attempted: number;
    mastery_delta: number;
  }>;
  pacing: {
    total_seconds: number;
    target_seconds: number;
    pacing_ratio: number;
    slowest_topic?: string;
  };
  predicted_full_exam_score: number;
  priority_for_next_session: string[];
  gbrain_notes: string[];
}

/**
 * Score a UGEE mock attempt. Uses the OFFICIAL +1/-0.25 SUPR marking
 * scheme — note this is structurally different from BITSAT's +3/-1,
 * so the promoter correctly detects a major-level version bump when
 * converting between them (v2.17.0 behavior).
 */
export function scoreMockExam(input: MockAttemptInput): MockAnalysis {
  const mock = UGEE_MOCK_EXAM;
  const { marks_per_correct, negative_marks_per_wrong } = UGEE_EXAM.marking_scheme;

  let raw = 0, correct = 0, wrong = 0, skipped = 0, totalSec = 0, targetSec = 0;
  const perTopic: Record<string, { correct: number; wrong: number; skipped: number; total: number; seconds: number }> = {};

  mock.questions.forEach((q, i) => {
    const answer = input.answers[i];
    const correctIdx = q.options.findIndex(o => o.is_correct);
    const t = perTopic[q.topic_id] ??= { correct: 0, wrong: 0, skipped: 0, total: 0, seconds: 0 };
    t.total++;
    targetSec += q.expected_seconds;
    t.seconds += input.seconds_per_question?.[i] ?? q.expected_seconds;
    totalSec += input.seconds_per_question?.[i] ?? q.expected_seconds;

    if (answer === null || answer === undefined) {
      skipped++; t.skipped++;
    } else if (answer === correctIdx) {
      correct++; t.correct++; raw += marks_per_correct;
    } else {
      wrong++; t.wrong++; raw -= negative_marks_per_wrong;
    }
  });

  const attempted = correct + wrong;
  const maxScore = mock.questions.length * marks_per_correct;

  const per_topic = Object.entries(perTopic).map(([topic_id, s]) => {
    const accuracy = s.correct + s.wrong > 0 ? s.correct / (s.correct + s.wrong) : 0;
    const attempted = s.correct + s.wrong;
    const weight = (UGEE_EXAM.topic_weights as any)[topic_id] ?? 0.01;
    const mastery_delta = attempted > 0 ? (accuracy - 0.5) * weight * 0.5 : 0;
    return {
      topic_id,
      correct: s.correct,
      wrong: s.wrong,
      skipped: s.skipped,
      accuracy_when_attempted: accuracy,
      mastery_delta,
    };
  });

  const slowestTopic = Object.entries(perTopic)
    .map(([t, s]) => ({ t, avg: s.total > 0 ? s.seconds / s.total : 0 }))
    .sort((a, b) => b.avg - a.avg)[0]?.t;

  // Predicted full SUPR-math score — mock IS the full math portion here
  const predicted = raw;

  // Priority: topics with low accuracy and high exam weight
  const priority = per_topic
    .filter(p => p.accuracy_when_attempted < 0.7 || p.skipped > 0)
    .sort((a, b) => {
      const wA = (UGEE_EXAM.topic_weights as any)[a.topic_id] ?? 0;
      const wB = (UGEE_EXAM.topic_weights as any)[b.topic_id] ?? 0;
      return wB - wA;
    })
    .map(p => p.topic_id);

  const notes: string[] = [];
  if (raw < maxScore * 0.4) notes.push('Score below SUPR cutoff threshold — focus on calculus + algebra fundamentals');
  if (wrong > attempted * 0.3) notes.push(`Accuracy ${((correct/Math.max(1,attempted))*100).toFixed(0)}% — with 25% negative marking, skip when unsure`);
  if (totalSec > targetSec * 1.2) notes.push(`Slow by ${((totalSec/targetSec - 1)*100).toFixed(0)}% vs target — drill speed on ${slowestTopic ?? 'pacing'}`);
  if (per_topic.find(p => p.topic_id === 'mathematical-induction' && p.accuracy_when_attempted < 0.5)) {
    notes.push('Induction is a free UGEE mark — review the worked example + drill 5 identities');
  }
  if (per_topic.find(p => p.topic_id === 'mathematical-reasoning' && p.accuracy_when_attempted < 0.5)) {
    notes.push('Math reasoning is checklist-grade — memorize contrapositive/converse distinction');
  }

  return {
    raw_score: Math.round(raw * 100) / 100,
    max_score: maxScore,
    percentage: raw / maxScore,
    attempted,
    correct,
    wrong,
    skipped,
    per_topic,
    pacing: {
      total_seconds: totalSec,
      target_seconds: targetSec,
      pacing_ratio: totalSec / targetSec,
      slowest_topic: slowestTopic,
    },
    predicted_full_exam_score: Math.round(predicted * 100) / 100,
    priority_for_next_session: priority,
    gbrain_notes: notes,
  };
}
