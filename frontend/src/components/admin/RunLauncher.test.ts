/**
 * Unit tests for the unit-mode parsers in RunLauncher.
 *
 * The form UX is interactive (toggle, text inputs); these tests pin
 * the parse logic that converts free-form text into the structured
 * curriculum_unit_specs the backend expects.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from './RunLauncher';

const { parseObjectives, parseLines } = __testing;

describe('RunLauncher.parseObjectives', () => {
  it('returns empty array for empty input', () => {
    expect(parseObjectives('')).toEqual([]);
    expect(parseObjectives('   \n  \n  ')).toEqual([]);
  });

  it('parses "id|statement" lines', () => {
    const r = parseObjectives('obj_1|Define eigenvalue\nobj_2|Compute via characteristic polynomial');
    expect(r).toEqual([
      { id: 'obj_1', statement: 'Define eigenvalue' },
      { id: 'obj_2', statement: 'Compute via characteristic polynomial' },
    ]);
  });

  it('auto-numbers when id is missing', () => {
    const r = parseObjectives('Define eigenvalue\nCompute via characteristic polynomial');
    expect(r[0].id).toBe('obj_1');
    expect(r[1].id).toBe('obj_2');
    expect(r[0].statement).toBe('Define eigenvalue');
  });

  it('drops lines with no statement', () => {
    const r = parseObjectives('obj_1|valid\nobj_2|\nobj_3|another');
    expect(r.length).toBe(2);
    expect(r.map((o) => o.id)).toEqual(['obj_1', 'obj_3']);
  });

  it('trims whitespace around id and statement', () => {
    const r = parseObjectives('  obj_1  |  Define eigenvalue  ');
    expect(r[0]).toEqual({ id: 'obj_1', statement: 'Define eigenvalue' });
  });
});

describe('RunLauncher.parseLines', () => {
  it('returns empty for empty input', () => {
    expect(parseLines('')).toEqual([]);
  });

  it('splits on newlines and trims', () => {
    expect(parseLines('a\n  b  \n c ')).toEqual(['a', 'b', 'c']);
  });

  it('drops blank lines', () => {
    expect(parseLines('a\n\n\nb\n')).toEqual(['a', 'b']);
  });

  it('deduplicates while preserving first-seen order', () => {
    expect(parseLines('a\nb\na\nc\nb')).toEqual(['a', 'b', 'c']);
  });
});
