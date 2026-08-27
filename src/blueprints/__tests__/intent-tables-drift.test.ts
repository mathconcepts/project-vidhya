/**
 * src/blueprints/__tests__/intent-tables-drift.test.ts
 *
 * CI drift gate for src/blueprints/intent-tables.gen.ts (T5, extended
 * W2.1/E11 for the merged template-family tables). Re-runs the codegen's
 * pure builder functions in-memory against the committed source files
 * (intent-profiles.yml + atomic-catalogue.json + template-families.yml) and
 * asserts deep equality with the committed generated module's actual
 * exports. If someone edits a YAML/JSON source without running
 * `npm run gen:intent-tables`, this test fails the build — the gen file and
 * its sources can never silently diverge.
 *
 * Also asserts the integrity checks the T5 + W2.1/E11 tasks call for:
 *   - every stage in every intent/family sequence uses a real StageKind/AtomKind;
 *   - every CONCEPT_DOMINANT_INTENT / CONCEPT_TEMPLATE_FAMILY key exists in
 *     the concept graph.
 */
import { describe, it, expect } from 'vitest';
import {
  loadCatalogue,
  loadIntentProfiles,
  loadTemplateFamilies,
  CATALOGUE_PATH,
  INTENT_PROFILES_PATH,
  TEMPLATE_FAMILIES_PATH,
  TEMPLATE_FAMILIES,
} from '../../../scripts/check-intent-catalogue';
import {
  buildIntentStageSequences,
  buildConceptDominantIntent,
  buildConceptInventoryTotals,
  buildFamilyStageSequences,
  buildConceptTemplateFamily,
  DIFFICULTY_LABEL_FROM_CATALOGUE as COMPUTED_DIFFICULTY_LABEL_MAP,
} from '../../../scripts/generate-intent-tables';
import {
  INTENT_STAGE_SEQUENCES,
  CONCEPT_DOMINANT_INTENT,
  CONCEPT_INVENTORY_TOTALS,
  DIFFICULTY_LABEL_FROM_CATALOGUE,
  FAMILY_STAGE_SEQUENCES,
  CONCEPT_TEMPLATE_FAMILY,
} from '../intent-tables.gen';
import { STAGE_KINDS, ATOM_KINDS } from '../types';
import { ALL_CONCEPTS, CONCEPT_MAP } from '../../constants/concept-graph';

describe('intent-tables.gen.ts drift', () => {
  const catalogue = loadCatalogue(CATALOGUE_PATH);
  const profiles = loadIntentProfiles(INTENT_PROFILES_PATH);
  const templateFamilies = loadTemplateFamilies(TEMPLATE_FAMILIES_PATH);
  const atoms = catalogue.atoms ?? [];
  const conceptsWithTopic = ALL_CONCEPTS.map((c) => ({ id: c.id, topic: c.topic }));

  it('INTENT_STAGE_SEQUENCES matches a fresh build from intent-profiles.yml', () => {
    const fresh = buildIntentStageSequences(profiles);
    expect(INTENT_STAGE_SEQUENCES).toEqual(fresh);
  });

  it('CONCEPT_DOMINANT_INTENT matches a fresh build from atomic-catalogue.json', () => {
    const fresh = buildConceptDominantIntent(atoms);
    expect(CONCEPT_DOMINANT_INTENT).toEqual(fresh);
  });

  it('CONCEPT_INVENTORY_TOTALS matches a fresh build from atomic-catalogue.json', () => {
    const fresh = buildConceptInventoryTotals(atoms);
    expect(CONCEPT_INVENTORY_TOTALS).toEqual(fresh);
  });

  it('DIFFICULTY_LABEL_FROM_CATALOGUE matches the declared static vocabulary mapping', () => {
    expect(DIFFICULTY_LABEL_FROM_CATALOGUE).toEqual(COMPUTED_DIFFICULTY_LABEL_MAP);
  });

  it('FAMILY_STAGE_SEQUENCES matches a fresh build from template-families.yml', () => {
    const fresh = buildFamilyStageSequences(templateFamilies);
    expect(FAMILY_STAGE_SEQUENCES).toEqual(fresh);
  });

  it('CONCEPT_TEMPLATE_FAMILY matches a fresh build from template-families.yml + the concept graph', () => {
    const fresh = buildConceptTemplateFamily(templateFamilies, conceptsWithTopic);
    expect(CONCEPT_TEMPLATE_FAMILY).toEqual(fresh);
  });

  it('every stage in every intent sequence uses a real StageKind + AtomKind', () => {
    const stageSet = new Set<string>(STAGE_KINDS);
    const atomKindSet = new Set<string>(ATOM_KINDS);
    for (const [intentId, stages] of Object.entries(INTENT_STAGE_SEQUENCES)) {
      for (const stage of stages) {
        expect(stageSet.has(stage.stage), `${intentId}: unknown stage '${stage.stage}'`).toBe(true);
        expect(atomKindSet.has(stage.atom_kind), `${intentId}: unknown atom_kind '${stage.atom_kind}'`).toBe(true);
      }
    }
  });

  it('every stage in every family sequence uses a real StageKind + AtomKind', () => {
    const stageSet = new Set<string>(STAGE_KINDS);
    const atomKindSet = new Set<string>(ATOM_KINDS);
    for (const [familyId, stages] of Object.entries(FAMILY_STAGE_SEQUENCES)) {
      expect(stages.length, `family '${familyId}' has an empty sequence`).toBeGreaterThan(0);
      for (const stage of stages) {
        expect(stageSet.has(stage.stage), `${familyId}: unknown stage '${stage.stage}'`).toBe(true);
        expect(atomKindSet.has(stage.atom_kind), `${familyId}: unknown atom_kind '${stage.atom_kind}'`).toBe(true);
      }
    }
  });

  it('every CONCEPT_DOMINANT_INTENT key exists in the concept graph', () => {
    for (const conceptId of Object.keys(CONCEPT_DOMINANT_INTENT)) {
      expect(CONCEPT_MAP.has(conceptId), `unknown concept id '${conceptId}'`).toBe(true);
    }
  });

  it('has at least the 19 mapped LA concepts (sanity floor — catches an empty read)', () => {
    expect(Object.keys(CONCEPT_DOMINANT_INTENT).length).toBeGreaterThanOrEqual(19);
  });

  it('every CONCEPT_TEMPLATE_FAMILY key exists in the concept graph, and every value is a locked family', () => {
    const familySet = new Set<string>(TEMPLATE_FAMILIES);
    for (const [conceptId, familyId] of Object.entries(CONCEPT_TEMPLATE_FAMILY)) {
      expect(CONCEPT_MAP.has(conceptId), `unknown concept id '${conceptId}'`).toBe(true);
      expect(familySet.has(familyId), `${conceptId}: unknown family '${familyId}'`).toBe(true);
    }
  });

  it('every concept in the concept graph has a template family (B12 completeness, mirrored)', () => {
    expect(Object.keys(CONCEPT_TEMPLATE_FAMILY).length).toBe(ALL_CONCEPTS.length);
  });
});
