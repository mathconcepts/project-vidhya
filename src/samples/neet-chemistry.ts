// @ts-nocheck
/**
 * NEET Chemistry — Live Sample
 *
 * The Chemistry portion of NEET-UG (National Eligibility cum Entrance
 * Test) run by NTA for medical college admissions in India. Chemistry
 * is 1/4 of the full NEET paper (45 of 180 attempted questions).
 *
 * Real 2026 NEET-UG spec (per NTA bulletin):
 *   - Chemistry: 50 MCQs presented (35 required + 15-choice-out-of-15
 *     optional); 45 attempted in practice
 *   - Marks: 45 × 4 = 180 marks for Chemistry
 *   - +4 correct, -1 wrong (25% negative), 0 unattempted
 *   - Subject pacing: ~50 min target within the 3h 20m full paper
 *   - Syllabus: NCERT Classes XI and XII Chemistry
 *
 * Why a separate adapter and not extending NEET Biology: chemistry
 * spans three sub-disciplines (Physical / Organic / Inorganic) with
 * distinct learning curves — Physical is calculation-heavy like
 * Physics, Organic is mechanism-pattern-heavy, Inorganic is fact-
 * recall-heavy like Biology. The student model needs to track
 * mastery across these three sub-buckets independently. A separate
 * adapter is the cleanest way.
 *
 * Companion to NEET Biology (`EXM-NEET-BIO-SAMPLE`) and NEET Physics
 * (`EXM-NEET-PHYS-SAMPLE`). Together they form the full NEET-UG
 * triad. The session-planner already supports up to 5 exams per
 * student; a real NEET candidate's profile carries all three.
 *
 * This is a SAMPLE adapter — minimal-but-valid content, no full lesson
 * library. Operator content-ops would expand topic-by-topic via the
 * content-studio path.
 */

// ============================================================================
// 1. EXAM SPEC
// ============================================================================

export const NEET_CHEM_EXAM = {
  id: 'EXM-NEET-CHEM-SAMPLE',
  code: 'NEET-CHEM-2026',
  name: 'NEET Chemistry 2026',
  level: 'entrance' as const,
  country: 'India',
  issuing_body: 'National Testing Agency (NTA), India',
  official_url: 'https://neet.nta.nic.in/',
  description:
    'Chemistry portion of NEET-UG 2026 — the national entrance exam for MBBS, BDS, ' +
    'and allied medical courses in India. Chemistry is 45 questions (out of 50 ' +
    'presented, with 5 optional), worth 180 of 720 total marks. NCERT XI and XII ' +
    'are the authoritative source. Three sub-disciplines: Physical Chemistry ' +
    '(calculation-heavy), Organic Chemistry (mechanism-pattern-heavy), and Inorganic ' +
    'Chemistry (fact-recall-heavy). Roughly equal weight across the three.',

  duration_minutes: 50,                    // Chemistry portion of 3h 20m paper
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
   * Topic weights from 5-year NEET Chemistry past-paper analysis.
   * Chemistry is the most evenly distributed of the three NEET
   * subjects — no single topic dominates the way Mechanics dominates
   * Physics or Genetics dominates Biology.
   *
   * The three sub-disciplines (Physical, Organic, Inorganic) get
   * roughly equal marks: ~33% each. Within each, the high-frequency
   * topics are listed below.
   */
  topic_weights: {
    // Physical (~33% total)
    'neet-chem-mole-concept':         0.07,
    'neet-chem-thermodynamics':       0.06,
    'neet-chem-equilibrium':          0.06,
    'neet-chem-electrochemistry':     0.05,
    'neet-chem-kinetics':             0.05,
    'neet-chem-solutions':            0.04,
    // Organic (~33% total)
    'neet-chem-hydrocarbons':         0.07,
    'neet-chem-haloalkanes':          0.04,
    'neet-chem-alcohols-aldehydes':   0.06,
    'neet-chem-biomolecules':         0.06,
    'neet-chem-amines-polymers':      0.04,
    'neet-chem-isomerism':            0.06,
    // Inorganic (~33% total)
    'neet-chem-periodic-table':       0.07,
    'neet-chem-coordination':         0.05,
    'neet-chem-d-f-block':            0.05,
    'neet-chem-p-block':              0.05,
    'neet-chem-chemical-bonding':     0.07,
    'neet-chem-s-block':              0.05,
  },

  syllabus_topic_ids: [
    // Physical
    'neet-chem-mole-concept',
    'neet-chem-thermodynamics',
    'neet-chem-equilibrium',
    'neet-chem-electrochemistry',
    'neet-chem-kinetics',
    'neet-chem-solutions',
    // Organic
    'neet-chem-hydrocarbons',
    'neet-chem-haloalkanes',
    'neet-chem-alcohols-aldehydes',
    'neet-chem-biomolecules',
    'neet-chem-amines-polymers',
    'neet-chem-isomerism',
    // Inorganic
    'neet-chem-periodic-table',
    'neet-chem-coordination',
    'neet-chem-d-f-block',
    'neet-chem-p-block',
    'neet-chem-chemical-bonding',
    'neet-chem-s-block',
  ],

  // Where to focus first if a student has only 4 weeks of prep:
  // mole-concept + chemical-bonding + hydrocarbons cover the
  // foundational concepts that every other topic depends on.
  priority_concepts: [
    'neet-chem-mole-concept',
    'neet-chem-chemical-bonding',
    'neet-chem-hydrocarbons',
  ],
};

// ============================================================================
// 2. MINIMAL MOCK
// ============================================================================

interface MockQuestion {
  id: string;
  /** Sub-discipline — for the planner's progress-tracking and for
   *  mock-paper section balance. NEET Chemistry doesn't have official
   *  sub-disciplinary sections (it's all one Chemistry block), but
   *  pedagogically the three are distinct enough to track. */
  branch: 'physical' | 'organic' | 'inorganic';
  topic_id: string;
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export const NEET_CHEM_MOCK_EXAM: { id: string; title: string; questions: MockQuestion[] } = {
  id: 'mock-neet-chem-01',
  title: 'NEET Chemistry — Diagnostic Mock (9 Q across all three branches)',
  questions: [
    // ─── Physical (3) ────────────────────────────────────────
    {
      id: 'q1',
      branch: 'physical',
      topic_id: 'neet-chem-mole-concept',
      statement:
        'How many moles of oxygen atoms are present in 9.03×10²³ molecules of CO₂? ' +
        '(Avogadro number = 6.022×10²³)',
      options: ['1.5', '2.0', '3.0', '4.5'],
      correct_index: 2,
      explanation:
        '9.03×10²³ molecules of CO₂ = 9.03/6.022 = 1.5 moles of CO₂. Each CO₂ has 2 ' +
        'oxygen atoms ⇒ moles of O atoms = 1.5 × 2 = 3.0. Trap: stopping at 1.5 (the ' +
        'CO₂ count) instead of multiplying by 2 for the oxygen atoms.',
    },
    {
      id: 'q2',
      branch: 'physical',
      topic_id: 'neet-chem-equilibrium',
      statement:
        'For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g), if the partial pressure of N₂ ' +
        'and H₂ are doubled at constant volume, the equilibrium shifts:',
      options: ['Left (toward reactants)', 'Right (toward products)', 'No shift', 'Cannot be determined'],
      correct_index: 1,
      explanation:
        'Le Chatelier: increasing reactant concentrations shifts equilibrium toward ' +
        'products (right) to consume the added reactants. Trap: students who confuse ' +
        '"increase reactants" with "increase pressure overall" — the latter would ' +
        'also shift right because the product side has fewer moles of gas (2 vs 4).',
    },
    {
      id: 'q3',
      branch: 'physical',
      topic_id: 'neet-chem-thermodynamics',
      statement:
        'For an exothermic reaction at constant pressure, which is true?',
      options: [
        'ΔH < 0, ΔU < 0 always',
        'ΔH < 0; sign of ΔU depends on Δn',
        'ΔH > 0',
        'Both ΔH and ΔU are zero',
      ],
      correct_index: 1,
      explanation:
        'Exothermic ⇒ ΔH < 0 by definition. ΔU = ΔH − Δn·RT. Sign of ΔU depends on ' +
        'how negative ΔH is relative to Δn·RT. Trap: assuming ΔH and ΔU always have ' +
        "the same sign — they don't.",
    },

    // ─── Organic (3) ─────────────────────────────────────────
    {
      id: 'q4',
      branch: 'organic',
      topic_id: 'neet-chem-isomerism',
      statement:
        'How many structural isomers are possible for C₄H₁₀?',
      options: ['1', '2', '3', '4'],
      correct_index: 1,
      explanation:
        'C₄H₁₀ has 2 structural isomers: n-butane (CH₃-CH₂-CH₂-CH₃) and isobutane ' +
        '(2-methylpropane, (CH₃)₃CH). NEET-classic: students sometimes count cis/trans ' +
        'or rotational variants, but only constitutional (structural) isomers count here.',
    },
    {
      id: 'q5',
      branch: 'organic',
      topic_id: 'neet-chem-alcohols-aldehydes',
      statement:
        'Which of the following alcohols undergoes oxidation MOST easily with acidified ' +
        'KMnO₄?',
      options: [
        'Tertiary alcohol (e.g. (CH₃)₃COH)',
        'Secondary alcohol (e.g. CH₃CHOHCH₃)',
        'Primary alcohol (e.g. CH₃CH₂OH)',
        'Methanol (CH₃OH)',
      ],
      correct_index: 2,
      explanation:
        'Oxidation ease for alcohols by acidified KMnO₄: primary > secondary >> tertiary ' +
        '(tertiary alcohols resist oxidation under normal conditions because no α-H is ' +
        'available on the carbon bearing -OH). Methanol is also primary but oxidizes ' +
        'further to formic acid then CO₂; standard NEET answer is "primary alcohol" ' +
        'as the canonical case. Trap: students who think tertiary oxidizes most because ' +
        '"more substituted = more reactive" — true for SN1 but FALSE for oxidation.',
    },
    {
      id: 'q6',
      branch: 'organic',
      topic_id: 'neet-chem-hydrocarbons',
      statement:
        'The major product of addition of HBr to propene (CH₃-CH=CH₂) is:',
      options: [
        '1-bromopropane (CH₃-CH₂-CH₂Br)',
        '2-bromopropane (CH₃-CHBr-CH₃)',
        'Both in equal amounts',
        'No reaction occurs',
      ],
      correct_index: 1,
      explanation:
        "Markovnikov's rule: H adds to the carbon with more hydrogens, Br adds to the " +
        'carbon with fewer hydrogens. CH₂ end already has 2 H; CH end has 1 H. So Br ' +
        'goes to the middle carbon (CH end) ⇒ 2-bromopropane. Trap: students who ' +
        "forget the rule and guess 1-bromopropane (anti-Markovnikov), which would be " +
        "the answer ONLY in presence of peroxides (peroxide effect / Kharasch).",
    },

    // ─── Inorganic (3) ───────────────────────────────────────
    {
      id: 'q7',
      branch: 'inorganic',
      topic_id: 'neet-chem-periodic-table',
      statement:
        'Among Li, Na, K, Rb, which has the LARGEST atomic radius?',
      options: ['Li', 'Na', 'K', 'Rb'],
      correct_index: 3,
      explanation:
        'Atomic radius INCREASES down a group (more shells, more shielding). Group 1 ' +
        'order: Li < Na < K < Rb < Cs. Rb is the largest of the four listed. Periodic ' +
        'trends are NEET bread-and-butter — students must internalize the diagonal ' +
        'and group/period directions cold.',
    },
    {
      id: 'q8',
      branch: 'inorganic',
      topic_id: 'neet-chem-coordination',
      statement:
        'The IUPAC name of [Co(NH₃)₄Cl₂]Cl is:',
      options: [
        'Tetraamminedichlorocobalt(III) chloride',
        'Tetraamminedichlorocobalt(II) chloride',
        'Dichlorotetraamminecobalt(III) chloride',
        'Cobalt(III) tetraamminedichloride',
      ],
      correct_index: 0,
      explanation:
        'IUPAC ordering: ligands ALPHABETICAL (ammine before chloro), then central metal ' +
        'with oxidation state in roman, then counter-ion. Charge balance: complex cation ' +
        'is [+1] (since one Cl⁻ outside), so Co + 4(0) + 2(−1) = +1 ⇒ Co = +3. Trap: ' +
        'option C swaps the ligand alphabetical order; option B has wrong oxidation state.',
    },
    {
      id: 'q9',
      branch: 'inorganic',
      topic_id: 'neet-chem-chemical-bonding',
      statement:
        'The hybridization of carbon in CO₂ is:',
      options: ['sp', 'sp²', 'sp³', 'sp³d'],
      correct_index: 0,
      explanation:
        'CO₂ is linear, O=C=O. Two double bonds, no lone pairs on carbon ⇒ steric ' +
        'number 2 ⇒ sp hybridization. Trap: students confuse double-bond count with ' +
        'hybridization (you count steric number, not bonds).',
    },
  ],
};

// ============================================================================
// 3. STRATEGIES
// ============================================================================

export const NEET_CHEM_STRATEGIES = {
  strategies: [
    {
      title: 'Treat the three sub-disciplines as separate prep tracks',
      content:
        'Physical, Organic, and Inorganic chemistry have fundamentally different study ' +
        'patterns. Physical is calculation-heavy — practice problems, memorize formulas, ' +
        'work numerical examples. Organic is mechanism-pattern-heavy — learn reaction ' +
        'patterns (SN1/SN2/E1/E2/addition/elimination) and recognize them in unfamiliar ' +
        'substrates. Inorganic is fact-recall-heavy — periodic trends, exceptions, ' +
        'specific reactions. Treating all three with a uniform "do textbook chapters" ' +
        'approach is suboptimal. Allocate time roughly equally (each is ~33% weight) ' +
        'but use different study modes for each.',
      evidence:
        'NCERT Chemistry has ~33% Physical, ~33% Organic, ~33% Inorganic by chapter ' +
        'count. NEET 2020-2024 question distribution analysis confirms this split holds ' +
        'in actual papers.',
    },
    {
      title: 'Mole concept first — it underlies everything else',
      content:
        'The mole concept is the foundation of physical chemistry. Stoichiometry, ' +
        'equilibrium, kinetics, electrochemistry, solutions — all of them require ' +
        'fluency in moles, molarity, mass-volume relationships. Students who try to ' +
        'jump into thermodynamics or kinetics without firm mole-concept ground end up ' +
        'unable to solve even routine problems because they can\'t convert between ' +
        'units cleanly. Spend a full week on mole concept BEFORE any other physical ' +
        'chemistry topic.',
      evidence:
        'NCERT Class XI Chemistry Chapter 1 ("Some Basic Concepts of Chemistry") is the ' +
        'mole-concept chapter and is the prerequisite for every subsequent physical ' +
        'chemistry chapter. NTA explicitly lists it as foundational.',
    },
    {
      title: "NCERT is the ceiling — don't chase reference books for inorganic",
      content:
        'For Inorganic Chemistry specifically, NCERT Class XI and XII are sufficient. ' +
        'NEET inorganic questions are heavily NCERT-derived; reference-book detours ' +
        '(JD Lee, Greenwood) are higher-level than NEET tests and dilute prep time. ' +
        "Read NCERT inorganic chapters cover-to-cover, including the small print and " +
        'examples. For Physical and Organic, supplementary practice from a single ' +
        "reference (Bahadur for Physical, MS Chouhan for Organic) is fine — but never " +
        'skip NCERT first.',
      evidence:
        '5-year NEET Chemistry analysis: ~85% of inorganic questions are directly ' +
        'traceable to NCERT facts/diagrams. The remaining 15% are conceptual extensions ' +
        'that NCERT-fluent students can derive.',
    },
  ],
};
