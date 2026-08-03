/**
 * Unit tests for the unit-orchestrator helpers + DB-less safety path.
 * The full DB path is integration-tested via docker-compose smoke.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { __testing, generateUnit, INTERACTIVE_KINDS } from '../curriculum-unit-orchestrator';

const { generateUnitId, defaultRetrievalSchedule, KIND_TO_ATOM_TYPE } = __testing;

describe('curriculum-unit-orchestrator · helpers', () => {
  it('generates a stable-shape unit id', () => {
    const a = generateUnitId('Eigenvalues — intro');
    expect(a).toMatch(/^unit_\d{14}_/);
    expect(a.toLowerCase()).toBe(a);
  });

  it('slugifies + truncates long names', () => {
    const long = 'A '.repeat(80) + 'name';
    const id = generateUnitId(long);
    // total length: 'unit_' + 14ts + '_' + slug(<=40) ≤ 60
    expect(id.length).toBeLessThanOrEqual(60);
  });

  it('handles names that slug to empty (returns timestamped id)', () => {
    const id = generateUnitId('!!!---');
    expect(id).toMatch(/^unit_\d{14}_$/);
  });
});

describe('curriculum-unit-orchestrator · defaultRetrievalSchedule', () => {
  it('returns sane defaults when no input', () => {
    expect(defaultRetrievalSchedule()).toEqual({ revisit_days: [3, 10, 30] });
    expect(defaultRetrievalSchedule(undefined)).toEqual({ revisit_days: [3, 10, 30] });
    expect(defaultRetrievalSchedule([])).toEqual({ revisit_days: [3, 10, 30] });
  });

  it('honours custom schedule when provided', () => {
    expect(defaultRetrievalSchedule([1, 7, 21])).toEqual({ revisit_days: [1, 7, 21] });
  });
});

describe('curriculum-unit-orchestrator · KIND_TO_ATOM_TYPE', () => {
  // v4.26.0: generateAtomForKind used to look up a nonexistent
  // conceptOrchestrator.generateAtom/.generate/.runOrchestrator export and
  // ALWAYS fell through to a placeholder stub atom. Fixed to call the real
  // generateConcept(), which requires kind -> AtomType. This mapping is
  // the one part of that fix worth pinning directly (RunLauncher's
  // DEFAULT_ATOM_KINDS and CurriculumUnitSpec.atom_kinds are free-form
  // strings, not typed against AtomType).
  it("maps the curriculum-unit-specific 'practice' label to 'micro_exercise'", () => {
    expect(KIND_TO_ATOM_TYPE.practice).toBe('micro_exercise');
  });

  it('maps every other known kind to itself (already valid AtomType names)', () => {
    for (const kind of ['hook', 'intuition', 'formal_definition', 'worked_example', 'common_traps']) {
      expect(KIND_TO_ATOM_TYPE[kind]).toBe(kind);
    }
  });

  it('has no entry for the interactive kinds — those fall through to the stub path, not a bogus AtomType', () => {
    for (const kind of INTERACTIVE_KINDS) {
      expect(KIND_TO_ATOM_TYPE[kind]).toBeUndefined();
    }
  });
});

describe('curriculum-unit-orchestrator · DB-less safety', () => {
  let orig: string | undefined;
  beforeEach(() => { orig = process.env.DATABASE_URL; });
  afterEach(() => {
    if (orig === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = orig;
  });

  it('returns failed result with clear error when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    const r = await generateUnit({
      exam_pack_id: 'gate-ma',
      concept_id: 'eigenvalues',
      name: 'Eigenvalues — intro',
      learning_objectives: [
        { id: 'obj_1', statement: 'Define eigenvalue for a 2×2 matrix' },
      ],
      prepared_for_pyq_ids: [],
      atom_kinds: ['intuition', 'formal_definition'],
    });
    expect(r.status).toBe('failed');
    expect(r.atoms_generated).toBe(0);
    expect(r.error).toContain('DATABASE_URL');
  });
});
