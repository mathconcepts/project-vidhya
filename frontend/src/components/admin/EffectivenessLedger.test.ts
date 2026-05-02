/**
 * Unit tests for EffectivenessLedger sort + format helpers.
 *
 * The interactive UI parts (clicking headers, recompute button) are
 * covered by Sprint B3a manual smoke (/admin/content-rd in browser).
 * These tests pin the math so a future refactor doesn't silently
 * change ordering or date formatting.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from './EffectivenessLedger';
import type { ExperimentRow } from '@/api/admin/content-rd';

const { compareBy, formatDate } = __testing;

function row(over: Partial<ExperimentRow>): ExperimentRow {
  return {
    id: 'exp_x',
    name: 'X',
    exam_pack_id: 'gate-ma',
    git_sha: 'abc',
    hypothesis: null,
    variant_kind: null,
    started_at: '2026-04-01T00:00:00Z',
    ended_at: null,
    status: 'active',
    lift_v1: null,
    lift_n: null,
    lift_p: null,
    lift_updated_at: null,
    metadata: {},
    ...over,
  };
}

describe('EffectivenessLedger.compareBy', () => {
  it('sorts lift ascending (nulls last when sorted asc — they are -Infinity)', () => {
    const a = row({ id: 'a', lift_v1: 0.1 });
    const b = row({ id: 'b', lift_v1: null });
    const c = row({ id: 'c', lift_v1: 0.05 });
    const sorted = [a, b, c].sort((x, y) => compareBy(x, y, 'lift'));
    // null becomes -Infinity → comes first when ascending
    expect(sorted.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts started_at ascending by parsed timestamp', () => {
    const a = row({ id: 'a', started_at: '2026-04-01T00:00:00Z' });
    const b = row({ id: 'b', started_at: '2026-03-01T00:00:00Z' });
    const c = row({ id: 'c', started_at: '2026-05-01T00:00:00Z' });
    const sorted = [a, b, c].sort((x, y) => compareBy(x, y, 'started'));
    expect(sorted.map((r) => r.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts name alphabetically', () => {
    const a = row({ id: 'a', name: 'Zeta' });
    const b = row({ id: 'b', name: 'Alpha' });
    const sorted = [a, b].sort((x, y) => compareBy(x, y, 'name'));
    expect(sorted.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('sorts p-value (lower = better; nulls go last)', () => {
    const a = row({ id: 'a', lift_p: 0.5 });
    const b = row({ id: 'b', lift_p: null });
    const c = row({ id: 'c', lift_p: 0.01 });
    const sorted = [a, b, c].sort((x, y) => compareBy(x, y, 'p'));
    expect(sorted.map((r) => r.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('EffectivenessLedger.formatDate', () => {
  it('renders "today" for very recent', () => {
    const now = new Date().toISOString();
    expect(formatDate(now)).toBe('today');
  });

  it('renders relative days for recent past', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDate(fiveDaysAgo)).toMatch(/^\d+d ago$/);
  });

  it('falls back to "—" for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});
