/**
 * Tests for src/api/admin-cohort-routes.ts — computeAttention().
 *
 * T5: admin-cohort-routes previously checked
 * `motivation === 'frustrated' || motivation === 'flagging'` by hand,
 * silently missing 'anxious' — a real defect, since the CLAUDE.md task
 * spec says both locked demo personas are 'anxious'. It now uses the
 * canonical STRUGGLING_STATES export from src/teaching/motivation-source.ts.
 * These tests pin both the regression (frustrated/flagging must keep
 * triggering the card) and the fix (anxious now does too).
 */

import { describe, it, expect } from 'vitest';
import type pg from 'pg';
import { computeAttention } from '../admin-cohort-routes';

interface FakeStudent {
  session_id: string;
  motivation_state: string | null;
}

/** Minimal pg.Pool stand-in — routes each query by table name in the SQL text. */
function fakePool(students: FakeStudent[]): pg.Pool {
  return {
    query: async (sql: string) => {
      if (/FROM\s+student_atom_overrides/i.test(sql)) return { rows: [] };
      if (/FROM\s+mastery_snapshots/i.test(sql)) return { rows: [] };
      if (/FROM\s+student_model/i.test(sql)) {
        return {
          rows: students.map((s) => ({
            session_id: s.session_id,
            user_id: null,
            motivation_state: s.motivation_state,
          })),
        };
      }
      return { rows: [] };
    },
  } as unknown as pg.Pool;
}

describe('computeAttention — motivation-state trigger', () => {
  it('REGRESSION: frustrated and flagging still trigger the attention card', async () => {
    const pool = fakePool([
      { session_id: 's-frustrated', motivation_state: 'frustrated' },
      { session_id: 's-flagging', motivation_state: 'flagging' },
    ]);
    const payload = await computeAttention(pool, 'jee-main');
    const ids = payload.needs_attention.map((c) => c.session_id);
    expect(ids).toContain('s-frustrated');
    expect(ids).toContain('s-flagging');
    for (const card of payload.needs_attention) {
      expect(card.reasons).toContain('frustrated_or_flagging');
    }
  });

  it('FIX: anxious now triggers the attention card too', async () => {
    const pool = fakePool([{ session_id: 's-anxious', motivation_state: 'anxious' }]);
    const payload = await computeAttention(pool, 'jee-main');
    expect(payload.needs_attention.map((c) => c.session_id)).toContain('s-anxious');
    const card = payload.needs_attention.find((c) => c.session_id === 's-anxious')!;
    expect(card.reasons).toContain('frustrated_or_flagging');
  });

  it('driven and steady do not trigger the motivation reason', async () => {
    const pool = fakePool([
      { session_id: 's-driven', motivation_state: 'driven' },
      { session_id: 's-steady', motivation_state: 'steady' },
    ]);
    const payload = await computeAttention(pool, 'jee-main');
    expect(payload.needs_attention).toEqual([]);
  });
});
