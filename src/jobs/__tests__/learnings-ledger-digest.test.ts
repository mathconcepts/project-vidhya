/**
 * Pure-function tests for the learnings-ledger digest builder + ISO week
 * helper. The DB-touching paths are integration-tested separately.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from '../learnings-ledger';

const { buildDigest, isoYearWeek, escMd } = __testing;

describe('learnings-ledger.isoYearWeek', () => {
  it('formats as YYYY-Www with zero-padding', () => {
    const d = new Date(Date.UTC(2026, 0, 15)); // Jan 15 2026
    const result = isoYearWeek(d);
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('boundaries cross-year correctly (Dec 31 → next year)', () => {
    // ISO 8601: Jan 1 2024 is week 1 of 2024
    const d = new Date(Date.UTC(2024, 0, 1));
    expect(isoYearWeek(d)).toBe('2024-W01');
  });
});

describe('learnings-ledger.escMd', () => {
  it('escapes pipes', () => {
    expect(escMd('a | b')).toBe('a \\| b');
  });
  it('flattens newlines so table rows stay on one line', () => {
    expect(escMd('first\nsecond')).toBe('first second');
  });
});

describe('learnings-ledger.buildDigest', () => {
  it('renders an empty-state message when no decisions', () => {
    const md = buildDigest({
      runId: 'ledger_test',
      evaluated: 0,
      promotions: [],
      demotions: [],
      suggestions: [],
    });
    expect(md).toContain('Learnings');
    expect(md).toContain('No state changes this run');
  });

  it('includes a Promoted section with the right header', () => {
    const md = buildDigest({
      runId: 'ledger_test',
      evaluated: 1,
      promotions: [
        {
          kind: 'won',
          experiment: {
            id: 'exp_a',
            name: 'PYQ-grounded LA wins',
            exam_pack_id: 'gate-ma',
            git_sha: 'abc',
            hypothesis: null,
            variant_kind: null,
            started_at: '2026-04-25T00:00:00Z',
            ended_at: null,
            status: 'won',
            lift_v1: 0.18,
            lift_n: 60,
            lift_p: 0.001,
            lift_updated_at: null,
            metadata: {},
          },
          lift: 0.18,
          n: 60,
          p: 0.001,
          targets: ['atom_x', 'atom_y'],
        },
      ],
      demotions: [],
      suggestions: [],
    });
    expect(md).toContain('## ✅ Promoted');
    expect(md).toContain('PYQ-grounded LA wins');
    expect(md).toContain('+0.1800');
  });

  it('escapes pipes inside experiment names so the table stays valid', () => {
    const md = buildDigest({
      runId: 'ledger_test',
      evaluated: 1,
      promotions: [
        {
          kind: 'won',
          experiment: {
            id: 'exp_a',
            name: 'A | risky | name',
            exam_pack_id: 'gate-ma',
            git_sha: 'abc',
            hypothesis: null,
            variant_kind: null,
            started_at: '2026-04-25T00:00:00Z',
            ended_at: null,
            status: 'won',
            lift_v1: 0.10,
            lift_n: 30,
            lift_p: 0.04,
            lift_updated_at: null,
            metadata: {},
          },
          lift: 0.10,
          n: 30,
          p: 0.04,
          targets: [],
        },
      ],
      demotions: [],
      suggestions: [],
    });
    expect(md).toContain('A \\| risky \\| name');
  });
});
