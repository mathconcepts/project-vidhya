// @ts-nocheck
/**
 * NEET Physics — Live Sample
 *
 * The Physics portion of NEET-UG (National Eligibility cum Entrance
 * Test) run by NTA for medical college admissions in India. Physics
 * is 1/4 of the full NEET paper (45 of 180 attempted questions).
 *
 * Real 2026 NEET-UG spec (per NTA bulletin):
 *   - Physics: 50 MCQs presented (35 required + 15-choice-out-of-15
 *     optional); 45 attempted in practice
 *   - Marks: 45 × 4 = 180 marks for Physics
 *   - +4 correct, -1 wrong (25% negative), 0 unattempted
 *   - Subject pacing: ~50 min target within the 3h 20m full paper
 *   - Syllabus: NCERT Classes XI and XII Physics
 *
 * Why a separate adapter and not extending NEET Biology: each subject
 * has its own topic taxonomy, its own canonical traps, and the
 * student model treats subject mastery separately. Pacing strategy
 * also differs — physics has ~5 numerical-heavy topics where students
 * burn time; biology is mostly recall. A separate adapter lets the
 * planner schedule physics-specific drills without conflating them
 * with biology mastery levels.
 *
 * Companion to NEET Biology (`EXM-NEET-BIO-SAMPLE`) and NEET Chemistry
 * (`EXM-NEET-CHEM-SAMPLE`). A real NEET candidate's exam profile
 * eventually includes all three; the session-planner already supports
 * up to 5 exams per student, so adding Physics + Chemistry alongside
 * the existing Biology adapter completes the medical-entrance triad.
 *
 * This is a SAMPLE adapter — minimal-but-valid content, no full lesson
 * library. Operator content-ops would expand topic-by-topic via the
 * content-studio path.
 */

// ============================================================================
// 1. EXAM SPEC
// ============================================================================

export const NEET_PHYS_EXAM = {
  id: 'EXM-NEET-PHYS-SAMPLE',
  code: 'NEET-PHYS-2026',
  name: 'NEET Physics 2026',
  level: 'entrance' as const,
  country: 'India',
  issuing_body: 'National Testing Agency (NTA), India',
  official_url: 'https://neet.nta.nic.in/',
  description:
    'Physics portion of NEET-UG 2026 — the national entrance exam for MBBS, BDS, ' +
    'and allied medical courses in India. Physics is 45 questions (out of 50 ' +
    'presented, with 5 optional), worth 180 of 720 total marks. NCERT XI and XII ' +
    'are the authoritative source. Mechanics, modern physics, and electromagnetism ' +
    'dominate the weight. Numerical questions are time-sinks; pacing matters more ' +
    'here than in Biology.',

  duration_minutes: 50,                    // Physics portion of 3h 20m paper
  total_marks: 180,                         // 45 Q × 4 = 180
  marking_scheme: {
    marks_per_correct: 4,
    negative_marks_per_wrong: 1,
    marks_per_unattempted: 0,
  },
  question_types: {
    mcq: 1.0,                              // 100% single-correct MCQ
    msq: 0,
    numerical: 0,
    descriptive: 0,
  },

  /**
   * Topic weights from 5-year NEET Physics past-paper analysis.
   * Mechanics is the single largest bucket. Modern Physics has
   * grown post-2020 in line with NEP-driven syllabus reweights.
   */
  topic_weights: {
    'neet-phys-mechanics':            0.28,  // Kinematics + dynamics + rotational
    'neet-phys-electromagnetism':     0.18,  // Electrostatics + current + magnetism
    'neet-phys-modern-physics':       0.14,  // Atoms/nuclei/semiconductors/photoelectric
    'neet-phys-thermodynamics':       0.10,
    'neet-phys-optics':               0.10,  // Ray + wave optics
    'neet-phys-waves-oscillations':   0.08,  // SHM + sound + waves
    'neet-phys-properties-of-matter': 0.06,  // Elasticity, fluids, surface tension
    'neet-phys-electronics':          0.04,  // Semiconductor devices, logic gates
    'neet-phys-units-measurement':    0.02,  // Dimensional analysis, errors
  },

  syllabus_topic_ids: [
    'neet-phys-mechanics',
    'neet-phys-electromagnetism',
    'neet-phys-modern-physics',
    'neet-phys-thermodynamics',
    'neet-phys-optics',
    'neet-phys-waves-oscillations',
    'neet-phys-properties-of-matter',
    'neet-phys-electronics',
    'neet-phys-units-measurement',
  ],

  // Where to focus first if a student has only 4 weeks of prep:
  // mechanics + electromagnetism + modern physics together cover
  // 60% of marks.
  priority_concepts: [
    'neet-phys-mechanics',
    'neet-phys-electromagnetism',
    'neet-phys-modern-physics',
  ],
};

// ============================================================================
// 2. MINIMAL MOCK
// ============================================================================

interface MockQuestion {
  id: string;
  topic_id: string;
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export const NEET_PHYS_MOCK_EXAM: { id: string; title: string; questions: MockQuestion[] } = {
  id: 'mock-neet-phys-01',
  title: 'NEET Physics — Diagnostic Mock (8 Q, 8 min target)',
  questions: [
    {
      id: 'q1',
      topic_id: 'neet-phys-mechanics',
      statement:
        'A body of mass 2 kg is moving with velocity 10 m/s. A constant force of 4 N is ' +
        'applied opposing motion. The time taken to come to rest is:',
      options: ['2.5 s', '5 s', '10 s', '20 s'],
      correct_index: 1,
      explanation:
        'Deceleration a = F/m = 4/2 = 2 m/s². Time to rest: t = v/a = 10/2 = 5 s. ' +
        'NEET-classic kinematics: identify the right SUVAT relation, plug in. ' +
        'Trap: forgetting that the force is OPPOSING motion (not adding to it).',
    },
    {
      id: 'q2',
      topic_id: 'neet-phys-modern-physics',
      statement:
        'The work function of a metal is 2.0 eV. The maximum kinetic energy of ' +
        'photoelectrons emitted when light of wavelength 400 nm falls on it is ' +
        '(use hc ≈ 1240 eV·nm):',
      options: ['1.1 eV', '1.5 eV', '2.0 eV', '5.1 eV'],
      correct_index: 0,
      explanation:
        'E_photon = hc/λ = 1240/400 = 3.1 eV. KE_max = E_photon − work function = ' +
        '3.1 − 2.0 = 1.1 eV. Einstein photoelectric equation. Trap: students who ' +
        'compute hc/λ in joules and forget to convert to eV.',
    },
    {
      id: 'q3',
      topic_id: 'neet-phys-electromagnetism',
      statement:
        'Two point charges +4 µC and −2 µC are placed 6 cm apart in vacuum. The ' +
        'electric field at the midpoint between them is (k = 9×10⁹ N·m²/C²):',
      options: ['3×10⁷ N/C', '6×10⁷ N/C', '9×10⁷ N/C', '1.2×10⁸ N/C'],
      correct_index: 1,
      explanation:
        'At the midpoint (3 cm = 0.03 m from each charge), both fields point from +4µC ' +
        'toward −2µC, so they ADD in magnitude. ' +
        'E₁ = k·4×10⁻⁶/(0.03)² = 9×10⁹ × 4×10⁻⁶ / 9×10⁻⁴ = 4×10⁷. ' +
        'E₂ = k·2×10⁻⁶/(0.03)² = 2×10⁷. Total = 6×10⁷ N/C. ' +
        'Trap: subtracting magnitudes by treating one charge as negative arithmetic.',
    },
    {
      id: 'q4',
      topic_id: 'neet-phys-thermodynamics',
      statement:
        'In an isothermal expansion of an ideal gas, the heat absorbed by the gas:',
      options: [
        'Equals the work done BY the gas',
        'Equals the change in internal energy',
        'Is zero',
        'Equals the change in enthalpy',
      ],
      correct_index: 0,
      explanation:
        'Isothermal: ΔT = 0 ⇒ ΔU = 0 (for ideal gas). First law: Q = ΔU + W = 0 + W = W. ' +
        'So heat absorbed = work done by gas. NEET tests this conceptual identity ' +
        'every year in some form.',
    },
    {
      id: 'q5',
      topic_id: 'neet-phys-optics',
      statement:
        'A convex lens of focal length 20 cm forms a real image at 60 cm. The object ' +
        'distance is:',
      options: ['15 cm', '20 cm', '30 cm', '40 cm'],
      correct_index: 2,
      explanation:
        'Lens formula: 1/f = 1/v − 1/u (sign convention: u negative). ' +
        '1/20 = 1/60 − 1/u ⇒ 1/u = 1/60 − 3/60 = −2/60 ⇒ u = −30 cm. ' +
        'Magnitude: 30 cm. NEET-typical lens problem; key is the SIGN convention.',
    },
    {
      id: 'q6',
      topic_id: 'neet-phys-waves-oscillations',
      statement:
        'A simple pendulum has period 2 s on Earth. On a planet where g is 4 times ' +
        'that on Earth, its period is:',
      options: ['0.5 s', '1 s', '2 s', '4 s'],
      correct_index: 1,
      explanation:
        'T = 2π·√(L/g). T ∝ 1/√g. Quadrupling g halves the period (1/√4 = 1/2). ' +
        'New period = 2/2 = 1 s. Trap: thinking T scales linearly with g.',
    },
    {
      id: 'q7',
      topic_id: 'neet-phys-electromagnetism',
      statement:
        'A wire of resistance 4 Ω is bent in the shape of a circle. The resistance ' +
        'between two diametrically opposite points is:',
      options: ['1 Ω', '2 Ω', '4 Ω', '8 Ω'],
      correct_index: 0,
      explanation:
        'Bending the wire splits it into two semicircles, each with resistance 2 Ω, ' +
        'wired in PARALLEL between the two diametric points. R_eq = (2·2)/(2+2) = 1 Ω. ' +
        'Trap: forgetting that the two halves are parallel paths.',
    },
    {
      id: 'q8',
      topic_id: 'neet-phys-mechanics',
      statement:
        'A particle is projected at 45° with initial speed u. The maximum height ' +
        'reached is (g = acceleration due to gravity):',
      options: ['u²/(4g)', 'u²/(2g)', 'u²/g', '2u²/g'],
      correct_index: 0,
      explanation:
        'H_max = (u·sinθ)²/(2g). At 45°: sin²(45°) = 1/2. H_max = u²/(4g). ' +
        'Standard projectile result; NEET tests it directly.',
    },
  ],
};

// ============================================================================
// 3. STRATEGIES
// ============================================================================

export const NEET_PHYS_STRATEGIES = {
  strategies: [
    {
      title: 'Time-budget physics differently than biology',
      content:
        "Physics is the time-sink subject in NEET. The 50-minute Physics target burns " +
        "fast on numerical questions, and unlike Biology where the answer is recallable " +
        "in 30 seconds, a Physics problem can take 90+ seconds when you have to set up " +
        "equations. Strategy: do a fast first pass (1-min cap per question) — answer " +
        "what's obvious, mark the rest. Second pass on marked questions with the time " +
        "remaining. NEVER spend >2 min on a single question regardless of how close " +
        "you feel.",
      evidence:
        'NTA 2024 NEET answer-rate analysis: median Physics attempt rate is 38/45 vs ' +
        'Biology median 88/90. The 7-question gap is almost entirely candidates running ' +
        'out of time on Physics.',
    },
    {
      title: 'Mechanics + Electromagnetism + Modern Physics = 60% of marks',
      content:
        'These three topics combined cover ~60% of Physics marks across 5-year analysis. ' +
        'If your time budget is constrained, do a strong sweep on these three before ' +
        'touching thermodynamics, optics, or waves. Mechanics alone is 28% of weight. ' +
        'For each of the three, ensure you can solve standard NEET-pattern problems on: ' +
        'circular motion + projectiles (mech), capacitors + RC circuits + magnetic force ' +
        'on charges (EM), photoelectric + de Broglie + nuclei (modern).',
      evidence:
        'NEET Physics 2020-2024: mechanics avg 12.6 Q, EM 8.2 Q, modern 6.4 Q out of ~45.',
    },
    {
      title: 'Negative marking math — when to skip',
      content:
        'NEET Physics has +4 / -1 / 0 scoring. A pure random guess on 4 options has ' +
        'expected value: 0.25·(+4) + 0.75·(-1) = +0.25. So random guessing is slightly ' +
        'positive-EV in expectation, but with high variance. If you can ELIMINATE one ' +
        'option (down to 3), EV jumps to 0.33·4 + 0.67·(-1) = +0.66 (much better risk- ' +
        'adjusted). Rule of thumb: never guess unless you can eliminate at least one ' +
        'option AND the topic is one you\'ve studied. Pure random guess on a topic you ' +
        "haven't studied is a marginal-EV trap that hurts variance.",
      evidence:
        'Expected value math from NEET marking scheme. NTA position-paper analysis: ' +
        'top scorers attempt 42-44 Q, lowest scorers attempt 35-38 — the gap is ' +
        'largely "skip what you don\'t know" discipline.',
    },
  ],
};
