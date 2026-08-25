/**
 * frontend/src/generated/intent-slices.drift.test.ts
 *
 * CI drift gate for intent-slices.gen.ts (T4). Re-runs the codegen's pure
 * `buildIntentSlices` builder in-memory against the committed source files
 * (atomic-catalogue.json, pyq-bank.json, src/blueprints/intent-tables.gen.ts)
 * and asserts deep equality with the committed generated module's actual
 * export. If someone edits a source file without running
 * `npm run gen:intent-slices`, this test fails the build — the gen file
 * and its sources can never silently diverge (same discipline as
 * src/blueprints/__tests__/intent-tables-drift.test.ts, which this mirrors).
 *
 * Lives in the frontend test tree (not the backend one) because the
 * codegen script — and this test — CAN import the backend's already-
 * generated `src/blueprints/intent-tables.gen.ts` (a plain, side-effect-
 * free data module) via a relative path; nothing here needs a second test
 * tree.
 */
import { describe, it, expect } from 'vitest';
import {
  loadCatalogueAtoms,
  loadPyqBankProblems,
  buildPyqConceptCounts,
  buildIntentSlices,
  CATALOGUE_PATH,
  PYQ_BANK_PATH,
} from '../../scripts/generate-intent-slices';
import { INTENT_SLICES } from './intent-slices.gen';
import { CONCEPT_DOMINANT_INTENT } from '../../../src/blueprints/intent-tables.gen';

describe('intent-slices.gen.ts drift', () => {
  it('INTENT_SLICES matches a fresh build from the source files', () => {
    const atoms = loadCatalogueAtoms(CATALOGUE_PATH);
    const problems = loadPyqBankProblems(PYQ_BANK_PATH);
    const pyqCounts = buildPyqConceptCounts(problems);
    const fresh = buildIntentSlices(atoms, pyqCounts);
    expect(INTENT_SLICES).toEqual(fresh);
  });

  it('has a slice for every concept in CONCEPT_DOMINANT_INTENT with ≥1 mapped atom (sanity floor)', () => {
    expect(Object.keys(INTENT_SLICES).length).toBeGreaterThanOrEqual(19);
    expect(Object.keys(INTENT_SLICES).length).toBeLessThanOrEqual(Object.keys(CONCEPT_DOMINANT_INTENT).length);
  });

  it('never emits a slice for a concept outside CONCEPT_DOMINANT_INTENT', () => {
    for (const conceptId of Object.keys(INTENT_SLICES)) {
      expect(conceptId in CONCEPT_DOMINANT_INTENT, `unexpected concept '${conceptId}'`).toBe(true);
    }
  });

  it('every slice carries the concept-graph-honest dominant_intent from CONCEPT_DOMINANT_INTENT', () => {
    for (const [conceptId, slice] of Object.entries(INTENT_SLICES)) {
      expect(slice.dominant_intent).toBe(CONCEPT_DOMINANT_INTENT[conceptId]);
    }
  });
});
