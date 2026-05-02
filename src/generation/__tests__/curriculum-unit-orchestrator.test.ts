/**
 * Unit tests for the unit-orchestrator helpers + DB-less safety path.
 * The full DB path is integration-tested via docker-compose smoke.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { __testing, generateUnit } from '../curriculum-unit-orchestrator';

const { generateUnitId, defaultRetrievalSchedule } = __testing;

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
