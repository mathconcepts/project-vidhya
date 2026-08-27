/**
 * scripts/check-intent-catalogue.ts — Intent Catalogue CI gate.
 *
 * Unit-tests the exported pure check functions directly against injected
 * fixture data (no subprocess spawn, no filesystem fan-out — these checks
 * have neither, unlike check-la-walkthrough.ts's four legs). The "clean
 * data passes" fixture is a small hand-built, internally-consistent
 * dataset rather than the real committed files: the real
 * atomic-catalogue.json currently has a genuine (and separately tracked)
 * cross-DAG prerequisite defect (see the dedicated
 * "real committed data" describe block below), so a synthetic fixture is
 * what actually exercises "does the CHECK LOGIC accept clean data",
 * independent of the content authoring backlog.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  checkA1_CountAndIds,
  checkA2_IntentEnum,
  checkA3_QuestionInventory,
  checkA4_PrereqAtomsExist,
  checkA5_ConceptIdsExist,
  checkA6_LaFullyMapped,
  checkA7_CrossDagConsistency,
  checkA8_SeoTitlePhraseRule,
  checkB1_IntentSet,
  checkB2_StageAndAtomKindValid,
  checkB3_DifficultyMixSums,
  checkB4_ModuleProfilesMatchCatalogue,
  checkB5_ErrorTagsValid,
  checkB6_ProblemStatementFramePhraseRule,
  checkB7_HistoricalEvidenceValid,
  renderPainPointReport,
  runCatalogueChecks,
  runIntentProfileChecks,
  runHistoricalEvidenceChecks,
  loadCatalogue,
  loadIntentProfiles,
  loadHistoricalEvidence,
  CATALOGUE_PATH,
  INTENT_PROFILES_PATH,
  HISTORICAL_EVIDENCE_PATH,
  EXPECTED_ATOM_COUNT,
  EXPECTED_HISTORICAL_TOPIC_COUNT,
  INTENTS,
  ERROR_TAGS,
  type CatalogueAtom,
  type ConceptLike,
  type IntentProfilesFile,
  type HistoricalEvidenceFile,
} from '../../../../scripts/check-intent-catalogue';
import { ALL_CONCEPTS } from '../../../constants/concept-graph';

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

/**
 * A minimal, internally-consistent catalogue: 203 atoms (to satisfy A1's
 * exact-count rule), all in a single synthetic module, all mapped to a
 * single concept with NO prerequisites (so A7 is vacuously satisfied
 * without needing to hand-model a real DAG).
 */
function buildCleanAtoms(): CatalogueAtom[] {
  const atoms: CatalogueAtom[] = [];
  for (let i = 1; i <= EXPECTED_ATOM_COUNT; i++) {
    const atomic_id = `AT-${String(i).padStart(3, '0')}`;
    atoms.push({
      atomic_id,
      module: 'linear-algebra',
      intent: INTENTS[i % INTENTS.length],
      question_inventory: {
        target_total: 10,
        mcq_target: 4,
        msq_target: 3,
        nat_target: 3,
        pyq_variant_target: 5,
        difficulty_mix: { foundation: 40, standard: 40, stretch: 20 },
      },
      prerequisite_atomic_ids: i > 1 ? [`AT-${String(i - 1).padStart(3, '0')}`] : [],
      concept_ids: ['solo-concept'],
    });
  }
  return atoms;
}

const CLEAN_CONCEPTS: ConceptLike[] = [{ id: 'solo-concept', prerequisites: [] }];

function buildCleanProfiles(): IntentProfilesFile {
  return {
    schema_version: 1,
    intents: {
      foundation_learning: {
        default_stage_sequence: [
          { stage: 'intuition', atom_kind: 'visual_analogy' },
          { stage: 'practice', atom_kind: 'mcq', difficulty_mix: { easy: 50, medium: 40, hard: 10 } },
        ],
      },
      concept_clarification: {
        default_stage_sequence: [{ stage: 'formalism', atom_kind: 'worked_example' }],
      },
      guided_problem_solving: {
        default_stage_sequence: [{ stage: 'discovery', atom_kind: 'guided_walkthrough' }],
      },
      pyq_targeted_practice: {
        default_stage_sequence: [{ stage: 'pyq_anchor', atom_kind: 'pyq_anchor' }],
      },
    },
    module_profiles: {
      'linear-algebra': {
        error_tags: { existing: ['sign', 'method'], proposed: ['over-calculation'] },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Clean data
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — clean synthetic data', () => {
  it('passes every check (A1-A8, B1-B6)', () => {
    const atoms = buildCleanAtoms();
    const profiles = buildCleanProfiles();
    const catalogueModules = new Set(atoms.map((a) => a.module));

    const results = [
      ...runCatalogueChecks(atoms, CLEAN_CONCEPTS),
      ...runIntentProfileChecks(profiles, catalogueModules),
    ];

    const failing = results.filter((r) => !r.pass);
    expect(failing).toEqual([]);
    expect(results).toHaveLength(14);
  });
});

// ---------------------------------------------------------------------------
// A5 — corrupted concept_id
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — A5 concept_ids resolve', () => {
  it('fails when one atom references an unknown concept_id', () => {
    const atoms = buildCleanAtoms();
    atoms[10] = { ...atoms[10], concept_ids: ['does-not-exist-in-graph'] };

    const conceptIds = new Set(CLEAN_CONCEPTS.map((c) => c.id));
    const result = checkA5_ConceptIdsExist(atoms, conceptIds);

    expect(result.pass).toBe(false);
    expect(result.count).toBe(1);
    expect(result.violations[0]).toContain('AT-011');
    expect(result.violations[0]).toContain('does-not-exist-in-graph');
  });

  it('does not flag anything on the clean fixture', () => {
    const atoms = buildCleanAtoms();
    const conceptIds = new Set(CLEAN_CONCEPTS.map((c) => c.id));
    expect(checkA5_ConceptIdsExist(atoms, conceptIds).pass).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// B2 — corrupted atom_kind (and stage)
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — B2 stage/atom_kind valid', () => {
  it('fails when a default_stage_sequence entry has an invalid atom_kind', () => {
    const profiles = buildCleanProfiles();
    profiles.intents.foundation_learning.default_stage_sequence[0] = {
      stage: 'intuition',
      atom_kind: 'nonexistent_kind',
    };

    const result = checkB2_StageAndAtomKindValid(profiles);

    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('nonexistent_kind'))).toBe(true);
  });

  it('fails when a default_stage_sequence entry has an invalid stage', () => {
    const profiles = buildCleanProfiles();
    profiles.intents.concept_clarification.default_stage_sequence[0] = {
      stage: 'nonexistent_stage',
      atom_kind: 'worked_example',
    };

    const result = checkB2_StageAndAtomKindValid(profiles);

    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('nonexistent_stage'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// A3 — split-sum mismatch
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — A3 question_inventory arithmetic', () => {
  it('fails when mcq+msq+nat no longer sums to target_total', () => {
    const atoms = buildCleanAtoms();
    atoms[5] = {
      ...atoms[5],
      question_inventory: { ...atoms[5].question_inventory, mcq_target: 999 },
    };

    const result = checkA3_QuestionInventory(atoms);

    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.startsWith('AT-006:') && v.includes('!== target_total'))).toBe(true);
  });

  it('fails when pyq_variant_target exceeds target_total', () => {
    const atoms = buildCleanAtoms();
    atoms[0] = {
      ...atoms[0],
      question_inventory: { ...atoms[0].question_inventory, pyq_variant_target: 999 },
    };

    const result = checkA3_QuestionInventory(atoms);

    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('overlay must not exceed total'))).toBe(true);
  });

  it('fails when difficulty_mix does not sum to 100', () => {
    const atoms = buildCleanAtoms();
    atoms[1] = {
      ...atoms[1],
      question_inventory: {
        ...atoms[1].question_inventory,
        difficulty_mix: { foundation: 10, standard: 10, stretch: 10 },
      },
    };

    const result = checkA3_QuestionInventory(atoms);

    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('difficulty_mix sums to 30'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// A1, A2, A4, A6 — sanity coverage
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — remaining catalogue checks', () => {
  it('A1 fails on a duplicate atomic_id and a malformed id', () => {
    const atoms = buildCleanAtoms();
    atoms[1] = { ...atoms[1], atomic_id: atoms[0].atomic_id }; // duplicate of AT-001
    atoms[2] = { ...atoms[2], atomic_id: 'AT-9999' }; // fails the regex

    const result = checkA1_CountAndIds(atoms);
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('appears'))).toBe(true);
    expect(result.violations.some((v) => v.includes('AT-9999'))).toBe(true);
  });

  it('A1 fails when the atom count is not exactly 203', () => {
    const atoms = buildCleanAtoms().slice(0, 100);
    const result = checkA1_CountAndIds(atoms);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('found 100');
  });

  it('A2 fails on an intent outside the locked 4', () => {
    const atoms = buildCleanAtoms();
    atoms[0] = { ...atoms[0], intent: 'made_up_intent' };
    const result = checkA2_IntentEnum(atoms);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('made_up_intent');
  });

  it('A4 fails when prerequisite_atomic_ids references an unknown atom', () => {
    const atoms = buildCleanAtoms();
    atoms[3] = { ...atoms[3], prerequisite_atomic_ids: ['AT-999'] };
    const result = checkA4_PrereqAtomsExist(atoms);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('AT-999');
  });

  it('A6 fails when a linear-algebra atom has empty concept_ids', () => {
    const atoms = buildCleanAtoms();
    atoms[0] = { ...atoms[0], concept_ids: [] };
    const result = checkA6_LaFullyMapped(atoms);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('AT-001');
  });

  it('A7 catches an atom edge that inverts concept-graph order', () => {
    // Concept graph: 'advanced' requires 'basic' (basic must be learned first).
    const concepts: ConceptLike[] = [
      { id: 'basic', prerequisites: [] },
      { id: 'advanced', prerequisites: ['basic'] },
    ];
    // Atom graph says the OPPOSITE: AT-B (teaching 'advanced') must be
    // learned before AT-A (teaching 'basic') — an inversion.
    const atoms: CatalogueAtom[] = [
      {
        atomic_id: 'AT-001',
        module: 'm',
        intent: 'foundation_learning',
        question_inventory: {
          target_total: 1,
          mcq_target: 1,
          msq_target: 0,
          nat_target: 0,
          pyq_variant_target: 0,
          difficulty_mix: { foundation: 100 },
        },
        prerequisite_atomic_ids: ['AT-002'],
        concept_ids: ['basic'],
      },
      {
        atomic_id: 'AT-002',
        module: 'm',
        intent: 'foundation_learning',
        question_inventory: {
          target_total: 1,
          mcq_target: 1,
          msq_target: 0,
          nat_target: 0,
          pyq_variant_target: 0,
          difficulty_mix: { foundation: 100 },
        },
        prerequisite_atomic_ids: [],
        concept_ids: ['advanced'],
      },
    ];

    const result = checkA7_CrossDagConsistency(atoms, concepts);
    expect(result.pass).toBe(false);
    expect(result.count).toBe(1);
    expect(result.violations[0]).toContain('AT-001 requires AT-002');
  });
});

// ---------------------------------------------------------------------------
// B1, B3, B4, B5 — sanity coverage
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — remaining intent-profile checks', () => {
  it('B1 fails when an intent is missing or an extra intent is present', () => {
    const profiles = buildCleanProfiles();
    delete (profiles.intents as Record<string, unknown>).guided_problem_solving;
    profiles.intents.extra_intent = { default_stage_sequence: [] };

    const result = checkB1_IntentSet(profiles);
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('guided_problem_solving is missing'))).toBe(true);
    expect(result.violations.some((v) => v.includes('extra_intent'))).toBe(true);
  });

  it('B3 fails when a stage difficulty_mix does not sum to 100', () => {
    const profiles = buildCleanProfiles();
    profiles.intents.foundation_learning.default_stage_sequence[1] = {
      stage: 'practice',
      atom_kind: 'mcq',
      difficulty_mix: { easy: 10, medium: 10, hard: 10 },
    };
    const result = checkB3_DifficultyMixSums(profiles);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('sums to 30');
  });

  it('B4 fails when module_profiles disagrees with the catalogue module set', () => {
    const profiles = buildCleanProfiles();
    profiles.module_profiles.calculus = { error_tags: { existing: ['sign'] } };
    const result = checkB4_ModuleProfilesMatchCatalogue(profiles, new Set(['linear-algebra']));
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('calculus');
  });

  it('B5 fails when error_tags.existing has a tag outside the ErrorTag union', () => {
    const profiles = buildCleanProfiles();
    profiles.module_profiles['linear-algebra'].error_tags = { existing: ['sign', 'not-a-real-tag'] };
    const result = checkB5_ErrorTagsValid(profiles);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('not-a-real-tag');
  });
});

// ---------------------------------------------------------------------------
// W1.2/E10 phrase rule — A8 (seo.title) and B6 (problem_statement_frame)
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — A8 seo.title phrase rule', () => {
  it('passes clean seo titles', () => {
    const atoms = buildCleanAtoms();
    atoms[0] = { ...atoms[0], seo: { title: 'Eigenvalues for GATE CS: Concepts, PYQs and Practice' } };
    expect(checkA8_SeoTitlePhraseRule(atoms).pass).toBe(true);
  });

  it('fails on a forbidden phrase in seo.title, naming the atom and the phrase', () => {
    const atoms = buildCleanAtoms();
    atoms[3] = { ...atoms[3], seo: { title: 'Eigenvalues: the most frequently asked GATE topic' } };
    const result = checkA8_SeoTitlePhraseRule(atoms);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('AT-004');
    expect(result.violations[0]).toContain('frequently asked');
  });

  it('is case-insensitive', () => {
    const atoms = buildCleanAtoms();
    atoms[0] = { ...atoms[0], seo: { title: 'This is HIGH-YIELD content' } };
    expect(checkA8_SeoTitlePhraseRule(atoms).pass).toBe(false);
  });

  it('passes atoms with no seo field at all', () => {
    const atoms = buildCleanAtoms();
    expect(checkA8_SeoTitlePhraseRule(atoms).pass).toBe(true);
  });
});

describe('check-intent-catalogue — B6 problem_statement_frame phrase rule', () => {
  it('passes clean frames', () => {
    const profiles = buildCleanProfiles();
    expect(checkB6_ProblemStatementFramePhraseRule(profiles).pass).toBe(true);
  });

  it('fails on a forbidden phrase, naming the intent and the phrase', () => {
    const profiles = buildCleanProfiles();
    profiles.intents.foundation_learning.problem_statement_frame = 'This is a most repeated GATE pattern.';
    const result = checkB6_ProblemStatementFramePhraseRule(profiles);
    expect(result.pass).toBe(false);
    expect(result.violations[0]).toContain('foundation_learning');
    expect(result.violations[0]).toContain('most repeated');
  });
});

// ---------------------------------------------------------------------------
// B7 — historical-evidence.yml
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — B7 historical-evidence.yml', () => {
  function buildCleanHistoricalEvidence(): HistoricalEvidenceFile {
    // Spread across several prefixes (max 30/prefix, well under the id
    // regex's 2-digit cap) rather than one 116-long LA- block, which would
    // overflow LA-99 into an invalid 3-digit id — a real corpus artifact
    // this fixture must not reproduce.
    const prefixes = ['LA', 'CA', 'VC', 'DE'];
    const topics: HistoricalEvidenceFile['topics'] = {};
    for (let i = 1; i <= EXPECTED_HISTORICAL_TOPIC_COUNT; i++) {
      const prefix = prefixes[(i - 1) % prefixes.length];
      const n = Math.floor((i - 1) / prefixes.length) + 1;
      topics[`${prefix}-${String(n).padStart(2, '0')}`] = {
        topic: `Topic ${i}`,
        pattern: 'Short MCQ.',
        evidence: i % 3 === 0 ? 'D' : i % 3 === 1 ? 'P' : 'S',
      };
    }
    return { schema_version: 1, topics };
  }

  it('passes a clean 116-topic fixture', () => {
    const result = checkB7_HistoricalEvidenceValid(buildCleanHistoricalEvidence());
    expect(result.pass).toBe(true);
  });

  it('fails when the topic count is not exactly 116', () => {
    const evidence = buildCleanHistoricalEvidence();
    delete evidence.topics['LA-01'];
    const result = checkB7_HistoricalEvidenceValid(evidence);
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('found 115'))).toBe(true);
  });

  it('fails on a topic id that does not match the corpus id shape', () => {
    const evidence = buildCleanHistoricalEvidence();
    evidence.topics['not-an-id'] = { pattern: 'x', evidence: 'D' };
    const result = checkB7_HistoricalEvidenceValid(evidence);
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('not-an-id'))).toBe(true);
  });

  it('fails on an empty pattern', () => {
    const evidence = buildCleanHistoricalEvidence();
    evidence.topics['LA-01'] = { ...evidence.topics['LA-01'], pattern: '' };
    const result = checkB7_HistoricalEvidenceValid(evidence);
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes('LA-01') && v.includes('pattern missing'))).toBe(true);
  });

  it('fails on an evidence code outside D/P/S', () => {
    const evidence = buildCleanHistoricalEvidence();
    evidence.topics['LA-01'] = { ...evidence.topics['LA-01'], evidence: 'D/P' };
    const result = checkB7_HistoricalEvidenceValid(evidence);
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("'D/P'"))).toBe(true);
  });

  it('runHistoricalEvidenceChecks wraps B7', () => {
    expect(runHistoricalEvidenceChecks(buildCleanHistoricalEvidence())).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// ErrorTag drift tripwire
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — ERROR_TAGS drift tripwire', () => {
  it('matches the literal ErrorTag union in src/core/interfaces.ts exactly', () => {
    const interfacesPath = path.resolve(process.cwd(), 'src/core/interfaces.ts');
    const source = fs.readFileSync(interfacesPath, 'utf-8');

    const match = source.match(/export type ErrorTag = ([^;]+);/);
    expect(match, 'ErrorTag type declaration not found in src/core/interfaces.ts — did it move or get renamed?').toBeTruthy();

    const literalMembers = match![1]
      .split('|')
      .map((s) => s.trim().replace(/^'(.*)'$/, '$1'))
      .filter(Boolean)
      .sort();

    expect(literalMembers).toEqual([...ERROR_TAGS].sort());
  });
});

// ---------------------------------------------------------------------------
// Real committed data
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — real committed data', () => {
  const catalogue = loadCatalogue(CATALOGUE_PATH);
  const profiles = loadIntentProfiles(INTENT_PROFILES_PATH);
  const atoms = catalogue.atoms;
  const concepts: ConceptLike[] = ALL_CONCEPTS.map((c) => ({ id: c.id, prerequisites: c.prerequisites }));
  const catalogueModules = new Set(atoms.map((a) => a.module));

  it('passes every check except the known cross-DAG finding (A7)', () => {
    const results = [
      ...runCatalogueChecks(atoms, concepts),
      ...runIntentProfileChecks(profiles, catalogueModules),
    ];

    const nonA7Failing = results.filter((r) => !r.pass && !r.name.startsWith('A7'));
    expect(nonA7Failing).toEqual([]);
  });

  // Documents a REAL, currently-open content defect (design doc's "finding
  // 9", 2026-08-25-intent-driven-content-restructure.md §6): the
  // The 11 inversions this check originally found (prerequisite_atomic_ids
  // chasing atom-sequence order instead of concept-graph teaching order)
  // were repaired in the catalogue in the same change that added this gate:
  // AT-005/009/019/021/022/024 now carry concept-order-correct edges (see
  // the catalogue's notes[] entry). The gate runs blocking in CI.
  it('A7 passes on the repaired committed data (zero cross-DAG inversions)', () => {
    const result = checkA7_CrossDagConsistency(atoms, concepts);
    expect(result.pass).toBe(true);
    expect(result.count).toBe(0);
  });
});

describe('check-intent-catalogue — real historical-evidence.yml', () => {
  it('loads and passes B7 (116 topics, D/P/S codes)', () => {
    const evidence = loadHistoricalEvidence(HISTORICAL_EVIDENCE_PATH);
    const result = checkB7_HistoricalEvidenceValid(evidence);
    expect(result.pass).toBe(true);
    expect(Object.keys(evidence.topics)).toHaveLength(EXPECTED_HISTORICAL_TOPIC_COUNT);
  });

  it('every topic id matches a known corpus prefix', () => {
    const evidence = loadHistoricalEvidence(HISTORICAL_EVIDENCE_PATH);
    const knownPrefixes = new Set(['LA', 'CA', 'VC', 'DE', 'PD', 'CX', 'PS', 'NM', 'DM']);
    for (const id of Object.keys(evidence.topics)) {
      expect(knownPrefixes.has(id.split('-')[0])).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// --pain-points register report
// ---------------------------------------------------------------------------

describe('check-intent-catalogue — --pain-points register report', () => {
  it('lists one block per atom of the module, in page order', () => {
    const atoms: CatalogueAtom[] = [
      { ...buildCleanAtoms()[0], atomic_id: 'AT-002', module: 'la', sequence: 2, subtopic: 'Second', primary_pain_point: 'Second pain.' },
      { ...buildCleanAtoms()[0], atomic_id: 'AT-001', module: 'la', sequence: 1, subtopic: 'First', primary_pain_point: 'First pain.' },
      { ...buildCleanAtoms()[0], atomic_id: 'AT-900', module: 'other', sequence: 1, subtopic: 'Elsewhere', primary_pain_point: 'Other pain.' },
    ];

    const report = renderPainPointReport(atoms, 'la');

    expect(report).toContain('AT-001  First');
    expect(report).toContain('First pain.');
    expect(report).toContain('AT-002  Second');
    // Page order, not file order — the point of the report is reading the
    // strings in the sequence a student would meet them.
    expect(report.indexOf('AT-001')).toBeLessThan(report.indexOf('AT-002'));
    // Other modules are not in this pass.
    expect(report).not.toContain('AT-900');
    expect(report).toContain('2 atom(s), 2 distinct pain-point string(s).');
  });

  it('counts distinct strings, which is what makes a shared module-level pain point visible', () => {
    const atoms: CatalogueAtom[] = [1, 2, 3].map((n) => ({
      ...buildCleanAtoms()[0],
      atomic_id: `AT-00${n}`,
      module: 'la',
      sequence: n,
      subtopic: `Topic ${n}`,
      primary_pain_point: 'The same sentence on every page.',
    }));

    expect(renderPainPointReport(atoms, 'la')).toContain('3 atom(s), 1 distinct pain-point string(s).');
  });

  it('says so plainly when the module has no atoms, rather than printing an empty report', () => {
    const report = renderPainPointReport(buildCleanAtoms(), 'no-such-module');
    expect(report).toContain("no atoms with module === 'no-such-module'");
  });

  it('reports the committed Linear Algebra register the P0 tone pass was run against', () => {
    // Not a rule about what a pain point may say — a tripwire on the finding
    // itself. All 26 LA atoms currently share one string, which is why the
    // DPS block no longer opens on it. If that ever stops being true, the
    // tone pass is worth re-running rather than assumed still valid.
    const report = renderPainPointReport(loadCatalogue(CATALOGUE_PATH).atoms, 'linear-algebra');
    expect(report).toMatch(/^Pain-point register — module 'linear-algebra' \(26 atom\(s\), page order\)/);
    expect(report).toContain('26 atom(s), 1 distinct pain-point string(s).');
  });
});
