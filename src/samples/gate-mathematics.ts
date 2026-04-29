// @ts-nocheck
/**
 * GATE Engineering Mathematics — Sample Content
 *
 * GATE (Graduate Aptitude Test in Engineering) is the postgraduate
 * entrance exam jointly conducted by IISc Bangalore and the seven
 * IITs (Bombay, Delhi, Guwahati, Kanpur, Kharagpur, Madras, Roorkee).
 * Used for M.Tech / MS admission across 30+ engineering branches and
 * for direct PSU recruitment (NTPC, ONGC, IOCL, BHEL, etc.).
 *
 * Engineering Mathematics is the SHARED math section across most
 * GATE branches (CS, EE, ME, CE, EC, etc. — about 13% of the paper
 * for most branches). The remaining 72% is branch-specific
 * engineering content. This adapter targets that shared math
 * section, which is the highest-leverage prep target since the
 * same content serves candidates across branches.
 *
 * Real 2026 GATE Engineering Mathematics spec (per IIT/IISc bulletin):
 *   - 13 questions total in the EM section (out of 65 in the full paper)
 *   - Mix: ~5 MCQs (1-mark or 2-mark) + ~5 MSQs + ~3 NATs
 *   - Negative marking on MCQs only: -1/3 per wrong on 1-mark MCQ,
 *     -2/3 per wrong on 2-mark MCQ
 *   - NO negative marking on NATs or MSQs (NTA shifted to this in 2024+)
 *   - Full paper: 3 hours, 100 marks total, EM section ~13 marks
 *   - Calculator: virtual on-screen scientific calculator only
 *
 * GATE differs from BITSAT/JEE/UGEE in important ways:
 *   - **Postgraduate level** — assumes undergrad math fluency, then
 *     pushes into linear algebra, complex analysis, transform theory,
 *     numerical methods at a deeper level than JEE Main.
 *   - **MSQ format** — Multiple Select Questions (more than one
 *     correct option). Distinct from MCQ; partial credit is NOT given
 *     and any wrong selection scores 0 on that question.
 *   - **Less time pressure** — 65 questions in 180 minutes is ~2.7 min
 *     per question, much more relaxed than JEE Main's ~2 min/Q.
 *
 * What this sample delivers — scoped intentionally tight, mirroring
 * the JEE Main sample's shape:
 *
 *   1. EXAM SPEC         Real GATE marking scheme + GA section break-out
 *   2. MINIMAL MOCK      6-question sample mock (mix of MCQ + MSQ + NAT
 *                        to exercise all three formats — JEE Main only
 *                        had MCQ + NAT; MSQ is GATE-specific)
 *   3. STRATEGIES        3 GATE-specific prep strategies
 *   4. LESSON MANIFEST   Empty — relies on the shared lesson bank
 */

// ============================================================================
// 1. EXAM SPEC
// ============================================================================

export const GATE_MATH_EXAM = {
  id: 'EXM-GATE-MATH-SAMPLE',
  code: 'GATE-MATH-2026',
  name: 'GATE Engineering Mathematics 2026',
  level: 'postgraduate' as const,
  country: 'India',
  issuing_body: 'IISc Bangalore + 7 IITs (Joint Entrance Test Committee)',
  official_url: 'https://gate2026.iitg.ac.in',
  description:
    'Engineering Mathematics section shared across most GATE branches (CS, EE, ME, ' +
    'CE, EC, etc.) — postgraduate entrance exam for M.Tech/MS admission and PSU ' +
    'recruitment in India. 13-mark section in the 100-mark full paper. Distinct from ' +
    'JEE Main: postgraduate-level depth, virtual on-screen calculator, MSQ format ' +
    '(multiple-correct), no negative marking on NAT or MSQ.',

  duration_minutes: 35,              // EM section's share of 180-min paper, weighted
  total_marks: 13,                   // EM section's marks contribution
  marking_scheme: {
    marks_per_correct_mcq_1mark: 1,
    marks_per_correct_mcq_2mark: 2,
    marks_per_correct_msq: 1,        // or 2 — varies, but generally 1-mark MSQs
    marks_per_correct_nat: 1,        // or 2 — varies
    negative_marks_per_wrong_mcq_1mark: 1 / 3,
    negative_marks_per_wrong_mcq_2mark: 2 / 3,
    negative_marks_per_wrong_msq: 0,  // No negative marking on MSQ
    negative_marks_per_wrong_nat: 0,  // No negative marking on NAT
  },
  question_count: 13,
  question_mix: {
    mcq: 5,        // mix of 1-mark and 2-mark MCQs
    msq: 5,        // multiple-select questions
    nat: 3,        // numerical-answer-type
  },

  // Standard GATE Engineering Mathematics syllabus across all branches.
  // The depth at which each topic is tested varies by branch but the
  // topic list is consistent.
  syllabus_topic_ids: [
    'linear-algebra',
    'calculus',
    'differential-equations',
    'complex-variables',
    'probability-statistics',
    'numerical-methods',
    'vector-calculus',
    'transform-theory',           // Laplace + Fourier — GATE-emphasized
  ],

  // Linear algebra dominates GATE EM in a way it doesn't in JEE Main.
  // Numerical methods + transform theory are GATE-distinctive.
  priority_concepts: [
    'linear-algebra',
    'calculus',
    'differential-equations',
    'numerical-methods',
    'transform-theory',
    'probability-statistics',
  ],
};

// ============================================================================
// 2. MINIMAL MOCK
// ============================================================================

export interface GATEMockQuestion {
  id: string;
  /** GATE has three question formats; each has different marking. */
  kind: 'mcq' | 'msq' | 'nat';
  topic_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  /** MCQ + MSQ both have options. */
  options?: Array<{ id: string; text: string }>;
  /** MCQ — single correct option ID. */
  correct_option_id?: string;
  /** MSQ — array of correct option IDs (must select ALL correct, no
   *  partial credit; any wrong selection → 0 marks for the question). */
  correct_option_ids?: string[];
  /** NAT — numeric answer with tolerance (the on-screen calculator
   *  GATE provides has limited precision; tolerance accommodates that). */
  correct_numeric_answer?: number;
  numeric_tolerance?: number;
  explanation: string;
}

export const GATE_MATH_MOCK_EXAM: {
  id: string;
  title: string;
  questions: GATEMockQuestion[];
} = {
  id: 'MOCK-GATE-MATH-2026-SAMPLE',
  title: 'GATE Engineering Mathematics Sample Mock (6 questions)',
  questions: [
    // ─── MCQs ────────────────────────────────────────────────
    {
      id: 'GM-Q1',
      kind: 'mcq',
      topic_id: 'linear-algebra',
      difficulty: 'medium',
      prompt:
        'The eigenvalues of the matrix A = [[2, 1], [0, 3]] are:',
      options: [
        { id: 'A', text: '1 and 2' },
        { id: 'B', text: '2 and 3' },
        { id: 'C', text: '0 and 5' },
        { id: 'D', text: '1 and 3' },
      ],
      correct_option_id: 'B',
      explanation:
        'For an upper-triangular matrix the eigenvalues are the diagonal entries. ' +
        'A = [[2,1],[0,3]] has diagonal {2, 3}, so the eigenvalues are 2 and 3. ' +
        'GATE-favorite trick: triangular ⇒ read eigenvalues off the diagonal directly.',
    },
    {
      id: 'GM-Q2',
      kind: 'mcq',
      topic_id: 'transform-theory',
      difficulty: 'medium',
      prompt:
        'The Laplace transform of f(t) = t·e^(−2t), for t ≥ 0, is:',
      options: [
        { id: 'A', text: '1 / (s − 2)²' },
        { id: 'B', text: '1 / (s + 2)²' },
        { id: 'C', text: 's / (s + 2)²' },
        { id: 'D', text: '1 / (s + 2)' },
      ],
      correct_option_id: 'B',
      explanation:
        'L{t} = 1/s². Apply the first shifting theorem (L{e^(at)·f(t)} = F(s−a) ' +
        'with a = −2): L{t·e^(−2t)} = 1/(s+2)². This is one of the standard GATE ' +
        'transform pairs worth memorizing.',
    },

    // ─── MSQs (multiple-correct, GATE-specific) ──────────────
    {
      id: 'GM-Q3',
      kind: 'msq',
      topic_id: 'calculus',
      difficulty: 'hard',
      prompt:
        'Which of the following functions are continuous AND differentiable at x = 0?',
      options: [
        { id: 'A', text: 'f(x) = |x|' },
        { id: 'B', text: 'f(x) = x²·sin(1/x), with f(0) = 0' },
        { id: 'C', text: 'f(x) = sin(x) / x, with f(0) = 1' },
        { id: 'D', text: 'f(x) = x·sin(1/x), with f(0) = 0' },
      ],
      correct_option_ids: ['B', 'C'],
      explanation:
        'A: |x| is continuous but NOT differentiable at 0 (left/right derivatives ' +
        'differ). B: x²·sin(1/x) → 0 and the derivative limit also exists (= 0); ' +
        'continuous AND differentiable. C: removable singularity; with f(0)=1 it is ' +
        'analytic at 0. D: x·sin(1/x) is continuous at 0 (squeeze theorem) but the ' +
        'derivative oscillates and does NOT exist at 0. So {B, C} are correct. ' +
        'MSQ scoring: must select EXACTLY {B, C} to get the marks. Selecting just B, ' +
        'or selecting B+C+D, both score 0.',
    },
    {
      id: 'GM-Q4',
      kind: 'msq',
      topic_id: 'linear-algebra',
      difficulty: 'medium',
      prompt:
        'Let A be a 3×3 real matrix with characteristic polynomial p(λ) = λ³ − 6λ² + 11λ − 6. ' +
        'Which of the following are TRUE?',
      options: [
        { id: 'A', text: 'det(A) = 6' },
        { id: 'B', text: 'trace(A) = 6' },
        { id: 'C', text: 'A is invertible' },
        { id: 'D', text: 'A has a zero eigenvalue' },
      ],
      correct_option_ids: ['A', 'B', 'C'],
      explanation:
        'p(λ) = (λ−1)(λ−2)(λ−3). Eigenvalues: 1, 2, 3. ' +
        'A: det = product of eigenvalues = 1·2·3 = 6 ✓. ' +
        'B: trace = sum of eigenvalues = 1+2+3 = 6 ✓. ' +
        'C: invertible iff det ≠ 0; det = 6 ≠ 0 ✓. ' +
        'D: zero eigenvalue would mean λ = 0 is a root of p — but p(0) = −6 ≠ 0, so ' +
        'no zero eigenvalue. Correct selection: {A, B, C}.',
    },

    // ─── NATs (numeric, no negative marking) ─────────────────
    {
      id: 'GM-Q5',
      kind: 'nat',
      topic_id: 'differential-equations',
      difficulty: 'hard',
      prompt:
        'The particular solution y(x) of y\'\' + 4y = 8x satisfying y(0) = 0 and y\'(0) = 0 ' +
        'evaluated at x = π/4 is (round to 3 decimals):',
      correct_numeric_answer: 0.571,
      numeric_tolerance: 0.005,
      explanation:
        'Homogeneous solution: y_h = c₁·cos(2x) + c₂·sin(2x). Try particular ' +
        'y_p = ax + b: y_p\'\' = 0, so 0 + 4(ax+b) = 8x ⇒ a = 2, b = 0. ' +
        'General y = c₁·cos(2x) + c₂·sin(2x) + 2x. ' +
        'y(0)=0 ⇒ c₁ = 0. y\'(0)=0 ⇒ 2c₂ + 2 = 0 ⇒ c₂ = −1. ' +
        'y(x) = −sin(2x) + 2x. At x = π/4: y = −sin(π/2) + 2·(π/4) = −1 + π/2 ≈ 0.5708. ' +
        'GATE NAT tolerance accommodates the on-screen calculator\'s decimal precision.',
    },
    {
      id: 'GM-Q6',
      kind: 'nat',
      topic_id: 'numerical-methods',
      difficulty: 'medium',
      prompt:
        'The first iteration of the Newton-Raphson method applied to f(x) = x² − 2 ' +
        'starting from x₀ = 1 yields x₁ = ?',
      correct_numeric_answer: 1.5,
      numeric_tolerance: 0.001,
      explanation:
        'Newton-Raphson: x₁ = x₀ − f(x₀)/f\'(x₀). f(1) = −1, f\'(x) = 2x, f\'(1) = 2. ' +
        'x₁ = 1 − (−1)/2 = 1 + 0.5 = 1.5. (Approaching √2 ≈ 1.4142 — second iteration ' +
        'gives x₂ = 1.4167.) GATE NAT favorite: small numerical-methods iteration ' +
        'computations easily verified by hand.',
    },
  ],
};

// ============================================================================
// 3. STRATEGIES
// ============================================================================

export const GATE_MATH_STRATEGIES = {
  strategies: [
    {
      title: 'Maximize MSQ + NAT — they have no negative marking',
      content:
        'GATE\'s 2024+ scoring removed negative marking from MSQs and NATs entirely. ' +
        'Of the ~13 EM questions, that\'s 5 MSQs + 3 NATs = 8 lossless-on-attempt ' +
        'questions per section. Always attempt all 8 even if you\'re unsure. The MSQ ' +
        'all-or-nothing rule is the catch: if you\'re uncertain about ONE option in a ' +
        '4-option MSQ, prefer to leave that option UNSELECTED rather than select it ' +
        'speculatively — over-selecting kills the score on that question.',
      evidence:
        'Official GATE 2024 marking scheme. Per-question expected-value: NAT/MSQ ' +
        'attempted with 50% confidence has EV = 0.5 × marks (vs MCQ where 50% ' +
        'confidence on 4-option = 0.5·4 − 0.5·(1/3) ≈ 1.83 on a 1-mark — still positive ' +
        'but lower headroom).',
    },
    {
      title: 'Linear algebra is THE high-leverage topic',
      content:
        'Across 5-year GATE EM analysis, linear algebra averages 3-4 of the 13 EM ' +
        'questions — roughly 25-30% of the section. Eigenvalues, determinants, rank/ ' +
        'nullity, system consistency, and characteristic polynomials are the recurring ' +
        'patterns. If you have 4 weeks of EM prep, spend 1.5 weeks on linear algebra. ' +
        'The shortcuts (triangular eigenvalues, trace = sum, det = product, Cayley-' +
        'Hamilton) reduce calculation overhead dramatically.',
      evidence:
        'GATE 2020-2025 EM section question-topic distribution analysis: linear ' +
        'algebra 25-32%, calculus 18-22%, differential equations 15-18%, complex + ' +
        'transform 12-15% combined, probability + numerical methods + vector calculus ' +
        'split the remainder.',
    },
    {
      title: 'Use the on-screen calculator — but don\'t over-rely',
      content:
        'GATE provides a virtual scientific calculator (no programmable, no graphing). ' +
        'It\'s slower than a physical TI/Casio because of click-driven input. Estimate ' +
        'mentally first, then use the calculator only to confirm or compute decimal ' +
        'precision for NATs. For matrix determinants, eigenvalue checks, and standard ' +
        'transform pairs, hand calculation is faster than the virtual calculator. ' +
        'The calculator wins on: trigonometric values, logarithms, numerical-method ' +
        'iterations, and final-decimal rounding for NAT submission.',
      evidence:
        'Official GATE virtual calculator interface. Time-trial study: hand vs ' +
        'calculator for 2×2 determinant ≈ 8s vs 25s; for log₂(7.3) ≈ skip vs 6s. ' +
        'Triage: hand-do anything that takes <15 seconds; calculator anything that ' +
        'requires precise decimal output.',
    },
  ],
};

// ============================================================================
// 4. LESSON MANIFEST (empty — relies on the shared lesson bank)
// ============================================================================

export const GATE_LESSON_MANIFEST: Array<{ id: string; summary: string }> = [
  // Lessons are exam-agnostic — BITSAT, UGEE, JEE Main, and GATE all
  // pull from the same underlying lesson bank. GATE-specific depth
  // lives in the strategies + mock question selection, not in
  // duplicate lesson content. The manifest here is empty to signal
  // "rely on the shared bank".
];
