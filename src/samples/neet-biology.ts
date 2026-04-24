// @ts-nocheck
/**
 * NEET Biology — Live Sample
 *
 * The biology portion of NEET-UG (National Eligibility cum Entrance
 * Test) run by NTA for medical college admissions in India. Biology
 * is the single largest section of NEET (90 of 180 total questions;
 * 360 of 720 total marks), so a first-class adapter for it is
 * high-leverage.
 *
 * 2026 spec (official NTA format):
 *   - 90 Biology MCQs (45 Botany + 45 Zoology)
 *   - Each section: 35 required + 15-choice-out-of-15 optional = 35 answered
 *   - Actually answered: 45 Botany + 45 Zoology = 90 questions
 *   - +4 correct, -1 wrong (20% negative), 0 unattempted
 *   - 720 marks total (180 × 4); Biology portion = 360 marks
 *   - Duration: 3h 20min for full paper; biology portion target ~80 min
 *   - Syllabus: NCERT Classes XI and XII Biology
 *
 * This is a SAMPLE adapter — demonstrates the NEET pattern with one
 * representative lesson and a short diagnostic mock. Production
 * deployment would expand to the full lesson library (genetics,
 * ecology, human physiology, plant morphology, etc.).
 *
 * PENDING.md §3.1 — adding NEET Biology was P2.
 */

// ============================================================================
// 1. EXAM SPEC
// ============================================================================

export const NEET_BIO_EXAM = {
  id: 'EXM-NEET-BIO-SAMPLE',
  code: 'NEET-BIO-2026',
  name: 'NEET Biology 2026',
  level: 'entrance' as const,
  country: 'India',
  issuing_body: 'National Testing Agency (NTA), India',
  official_url: 'https://neet.nta.nic.in/',
  description:
    'Biology portion of NEET-UG 2026 — the national entrance exam for MBBS, BDS, ' +
    'and allied medical courses in India. Biology is 90 questions (45 Botany + 45 ' +
    'Zoology), worth 360 of 720 total marks. NCERT XI and XII are the authoritative ' +
    'source; rote recall of NCERT facts plus conceptual application together decide ' +
    'the score. Negative marking (25%) makes careful elimination strategy essential.',

  // Biology portion of the full 3h 20m paper
  duration_minutes: 80,
  total_marks: 360,                      // 90 Q × 4 = 360 marks for biology only
  marking_scheme: {
    marks_per_correct: 4,
    negative_marks_per_wrong: 1,         // -1 per wrong (25% of +4)
    marks_per_unattempted: 0,
  },
  question_types: {
    mcq: 1.0,                            // 100% single-correct MCQ
    msq: 0,
    numerical: 0,
    descriptive: 0,
  },

  /**
   * Topic weights derived from 5-year NEET past-paper analysis.
   * Biology splits near-evenly Botany (~50%) and Zoology (~50%).
   * Highest-frequency topics: genetics, ecology, human physiology,
   * plant morphology, cell biology, reproduction.
   */
  topic_weights: {
    'neet-bio-genetics': 0.18,
    'neet-bio-ecology': 0.14,
    'neet-bio-human-physiology': 0.18,
    'neet-bio-plant-morphology': 0.10,
    'neet-bio-cell-biology': 0.10,
    'neet-bio-reproduction': 0.12,
    'neet-bio-biomolecules': 0.08,
    'neet-bio-evolution': 0.06,
    'neet-bio-biotechnology': 0.04,
  },

  syllabus_topic_ids: [
    'neet-bio-genetics',
    'neet-bio-ecology',
    'neet-bio-human-physiology',
    'neet-bio-plant-morphology',
    'neet-bio-cell-biology',
    'neet-bio-reproduction',
    'neet-bio-biomolecules',
    'neet-bio-evolution',
    'neet-bio-biotechnology',
  ],

  priority_concepts: [
    'neet-bio-genetics',
    'neet-bio-human-physiology',
    'neet-bio-ecology',
  ],
};

// ============================================================================
// 2. CANONICAL LESSON — Mendelian Inheritance
// ============================================================================

export const LESSON_MENDELIAN: any = {
  id: 'lesson-neet-mendelian',
  concept_id: 'neet-bio-genetics',
  title: 'Mendelian Inheritance — Laws and Applications',
  exam_scope: 'NEET-BIO-2026',
  estimated_minutes: 14,
  class_level: 12,
  weight_in_exam: 0.06,     // ~5 questions of 90; high-frequency NEET topic

  components: [
    {
      id: 'mendelian-hook',
      kind: 'hook',
      content:
        "Mendel's pea-plant work in the 1860s gave biology its first mathematical " +
        'laws. NEET loves Mendelian genetics because every question tests the same ' +
        'three ideas — segregation, independent assortment, and dominance — just ' +
        'dressed in different organisms (humans, flies, plants). Master the ratios ' +
        '(3:1, 9:3:3:1, 1:1:1:1) and most NEET genetics questions collapse to pattern ' +
        'recognition.',
    },
    {
      id: 'mendelian-concept',
      kind: 'concept',
      content:
        "**Law of Segregation**: Each parent carries two alleles for every trait; only one " +
        'is passed to each gamete. When the alleles differ (heterozygous Aa), the gametes ' +
        'get A or a with equal 50/50 probability.\n\n' +
        '**Law of Independent Assortment**: Alleles for different genes sort independently ' +
        'during gamete formation — IF the genes are on different chromosomes (or far apart ' +
        'on the same one). This is why dihybrid crosses give 9:3:3:1 ratios.\n\n' +
        "**Dominance**: In heterozygotes, one allele (dominant) masks the other (recessive) " +
        'in the phenotype. Exceptions — incomplete dominance (pink flowers from red × white) ' +
        'and codominance (AB blood type) — are NEET favourites.',
    },
    {
      id: 'mendelian-worked-example',
      kind: 'worked_example',
      content:
        "**Problem**: In pea plants, tall (T) is dominant over dwarf (t), and green pods " +
        '(G) are dominant over yellow (g). What fraction of F2 offspring from TtGg × TtGg ' +
        'will be tall with yellow pods?\n\n' +
        '**Solution**:\n' +
        '1. Probability of tall (T_) = 3/4 (from 1 TT : 2 Tt : 1 tt ⇒ 3/4 show dominant)\n' +
        '2. Probability of yellow pods (gg) = 1/4 (only homozygous recessive shows yellow)\n' +
        '3. Independent assortment: multiply the two probabilities\n' +
        '4. Answer: 3/4 × 1/4 = **3/16**\n\n' +
        'This is one of the 9:3:3:1 quadrants in the 4×4 Punnett square — specifically the ' +
        "3 squares giving 'tall + yellow'. NEET asks this exact structure repeatedly.",
    },
    {
      id: 'mendelian-traps',
      kind: 'trap',
      content:
        '**Trap 1**: When NEET says "what fraction are homozygous?", they usually mean ' +
        '"homozygous for ALL given genes", not "homozygous for at least one". Read carefully.\n\n' +
        '**Trap 2**: Sex-linked inheritance (colour blindness, haemophilia) is NOT pure ' +
        "Mendelian — the ratios change because X and Y chromosomes aren't symmetric. " +
        'Always check if the question involves sex linkage before applying 3:1 or 9:3:3:1.\n\n' +
        '**Trap 3**: Test cross (heterozygote × homozygous recessive) gives 1:1, not 3:1. ' +
        'NEET rephrases "test cross" as "backcross with homozygous recessive" to catch you.',
    },
  ],
};

// ============================================================================
// 3. MOCK EXAM — 10 questions, diagnostic
// ============================================================================

interface MockQuestion {
  id: string;
  section: 'botany' | 'zoology';
  topic_id: string;
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export const NEET_BIO_MOCK_EXAM: { id: string; title: string; questions: MockQuestion[] } = {
  id: 'mock-neet-bio-01',
  title: 'NEET Biology — Diagnostic Mock (10 Q, 10 min target)',
  questions: [
    {
      id: 'q1',
      section: 'botany',
      topic_id: 'neet-bio-genetics',
      statement:
        'In a dihybrid cross between two heterozygotes (AaBb × AaBb), what is the ' +
        'probability that the offspring is homozygous for both genes?',
      options: ['1/16', '2/16', '4/16', '9/16'],
      correct_index: 1,
      explanation:
        'Homozygous-for-both = AABB or aabb = 1/16 + 1/16 = 2/16 of offspring. Common ' +
        'trap: students pick 4/16 forgetting that AaBB, AABb, etc. are heterozygous for ' +
        'one gene.',
    },
    {
      id: 'q2',
      section: 'zoology',
      topic_id: 'neet-bio-human-physiology',
      statement: 'The hormone that primarily regulates blood glucose in humans is:',
      options: ['Thyroxine', 'Insulin', 'Adrenaline', 'Cortisol'],
      correct_index: 1,
      explanation:
        'Insulin (secreted by pancreatic β-cells) lowers blood glucose by promoting ' +
        'cellular uptake. Glucagon raises it. NEET directly tests this every year.',
    },
    {
      id: 'q3',
      section: 'botany',
      topic_id: 'neet-bio-ecology',
      statement: 'An ecological pyramid that can be inverted is the pyramid of:',
      options: ['Energy', 'Numbers', 'Biomass', 'Both numbers and biomass'],
      correct_index: 3,
      explanation:
        'Pyramid of numbers can be inverted (a tree supporting many insects). Pyramid ' +
        'of biomass can be inverted in aquatic ecosystems (small but rapidly-reproducing ' +
        'phytoplankton support larger zooplankton biomass at any snapshot). Energy ' +
        'pyramid is ALWAYS upright due to the second law of thermodynamics.',
    },
    {
      id: 'q4',
      section: 'botany',
      topic_id: 'neet-bio-plant-morphology',
      statement: 'Which of the following is NOT a modification of the stem?',
      options: ['Potato', 'Carrot', 'Onion', 'Ginger'],
      correct_index: 1,
      explanation:
        'Carrot is a modified TAP ROOT (for storage). Potato (tuber), onion (bulb), and ' +
        'ginger (rhizome) are all stem modifications. This is a high-frequency NEET ' +
        'recall question.',
    },
    {
      id: 'q5',
      section: 'zoology',
      topic_id: 'neet-bio-cell-biology',
      statement: 'The enzyme responsible for unwinding the DNA double helix during replication is:',
      options: ['DNA polymerase', 'DNA ligase', 'Helicase', 'Primase'],
      correct_index: 2,
      explanation:
        'Helicase unwinds the double helix. DNA polymerase synthesises new strands. DNA ' +
        'ligase seals nicks between Okazaki fragments. Primase lays down RNA primers. All ' +
        'four appear in the NEET replication question family — know which does which.',
    },
    {
      id: 'q6',
      section: 'zoology',
      topic_id: 'neet-bio-reproduction',
      statement: 'In the human female, the site of fertilisation is normally the:',
      options: ['Cervix', 'Uterus', 'Fallopian tube', 'Ovary'],
      correct_index: 2,
      explanation:
        'Fertilisation occurs in the ampulla of the fallopian tube, not the uterus. The ' +
        'fertilised zygote then migrates to the uterus for implantation. This is a NEET ' +
        'staple; "uterus" is the most common wrong answer because students confuse ' +
        'implantation with fertilisation.',
    },
    {
      id: 'q7',
      section: 'botany',
      topic_id: 'neet-bio-biomolecules',
      statement: 'The building-block monomer of proteins is:',
      options: ['Nucleotide', 'Fatty acid', 'Amino acid', 'Monosaccharide'],
      correct_index: 2,
      explanation:
        'Amino acids polymerise via peptide bonds to form proteins. Nucleotides → nucleic ' +
        'acids. Fatty acids → lipids. Monosaccharides → polysaccharides.',
    },
    {
      id: 'q8',
      section: 'zoology',
      topic_id: 'neet-bio-evolution',
      statement: "The phrase 'survival of the fittest' is most closely associated with:",
      options: ['Lamarck', 'Darwin', 'Mendel', 'Watson'],
      correct_index: 1,
      explanation:
        "Herbert Spencer coined the exact phrase, but it captures Darwin's theory of " +
        'natural selection. NEET sometimes credits Spencer — accept either if asked ' +
        '"who coined" vs "whose theory".',
    },
    {
      id: 'q9',
      section: 'botany',
      topic_id: 'neet-bio-ecology',
      statement: 'Lichens are an example of:',
      options: ['Parasitism', 'Commensalism', 'Mutualism', 'Competition'],
      correct_index: 2,
      explanation:
        'Lichen = fungus + alga/cyanobacterium, both benefit. Alga provides photosynthetic ' +
        'products; fungus provides structure and moisture. Classic NEET mutualism example.',
    },
    {
      id: 'q10',
      section: 'zoology',
      topic_id: 'neet-bio-biotechnology',
      statement: 'Restriction endonucleases are enzymes that:',
      options: [
        'Seal DNA fragments together',
        'Cut DNA at specific nucleotide sequences',
        'Replicate DNA',
        'Transcribe DNA into RNA',
      ],
      correct_index: 1,
      explanation:
        'Restriction enzymes recognise specific palindromic sequences (e.g. EcoRI cuts ' +
        'GAATTC) and cleave DNA there. This specificity is why they power recombinant-DNA ' +
        'technology. "Molecular scissors" is the NCERT phrasing.',
    },
  ],
};

// ============================================================================
// 4. STRATEGIES
// ============================================================================

export const NEET_BIO_STRATEGIES = {
  exam_scope: 'NEET-BIO-2026',
  strategies: [
    {
      title: 'Read NCERT front-to-back — twice',
      content:
        'NEET Biology is 80%+ direct NCERT recall. Every line in NCERT XI+XII Biology is a ' +
        'potential question. Read it once for comprehension, once for memorisation. Nothing ' +
        'else you can do will have this high a marks-per-hour return.',
      evidence: 'NTA has explicitly stated NCERT is the authoritative source.',
    },
    {
      title: 'Prioritise genetics and human physiology',
      content:
        'These two topics together account for ~35% of the biology paper. Genetics problems ' +
        'reward practice (Mendelian ratios, sex linkage, pedigree); human physiology rewards ' +
        'memorisation (endocrine table, nephron anatomy, cardiac cycle). Allocate study time ' +
        'proportionally.',
      evidence: '5-year past-paper analysis: genetics 17-19%, human physiology 16-20%.',
    },
    {
      title: 'Never guess blindly — 25% negative marking is steep',
      content:
        'With +4/-1 scoring, you need to eliminate at least 2 of 4 options to make guessing ' +
        'profitable (50/50 expected value = +2 * 0.5 - 1 * 0.5 = +0.5). If you have NO idea, ' +
        'leave it blank. The attempted-accuracy target is ~90%.',
      evidence: 'Expected-value arithmetic from the marking scheme.',
    },
    {
      title: 'Use the 15-of-15 optional wisely',
      content:
        'Each section has 15 optional questions — answer only 10. Skim all 15 first; skip ' +
        'the hardest 5 before answering any. The section is adaptive-by-your-choice.',
      evidence: 'NTA 2024 format change.',
    },
  ],
};
