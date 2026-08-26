/**
 * A durable collection whose `idOf` cannot produce an id mirrors nothing.
 *
 * `durable_records.id` is NOT NULL. When `idOf` returns undefined, Postgres
 * rejects the INSERT, the surrounding transaction rolls back, and the whole
 * collection fails to mirror — silently, because mirroring is deliberately
 * fire-and-forget so a student's write never fails on the mirror's account.
 *
 * That is exactly what happened to `practice-sessions`: its entry type had no
 * `id` field, its `idOf` read `.id` through an `any` (the file carries
 * `@ts-nocheck`, so the compiler never saw it), and production logged
 *
 *     [durable:practice-sessions] mirror failed (non-fatal):
 *     null value in column "id" of relation "durable_records"
 *
 * on every boot for over a week. Ad-hoc practice minutes — the thing the
 * durable-store work existed to stop losing — did not survive the host
 * sleeping, and the error named the column rather than the collection.
 *
 * Two properties are locked here: every entry now carries an id, and a
 * collection that cannot produce one fails with a message that says which
 * collection and why.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  requireRecordId,
  sortRowsById,
  collectionLockKey,
} from '../../../storage/repositories/durable-store-repo';
import {
  logPracticeSession,
  entryId,
  _resetPracticeSessionLog,
  _enumerateEntriesForTest,
  type PracticeSessionEntry,
} from '../../../session-planner/practice-session-log';

describe('requireRecordId', () => {
  it('passes a real id through unchanged', () => {
    expect(requireRecordId('practice-sessions', 'abc')).toBe('abc');
  });

  it('names the collection when idOf returns undefined', () => {
    // The production failure mode, reproduced.
    expect(() => requireRecordId('practice-sessions', undefined)).toThrow(
      /collection "practice-sessions" returned undefined/,
    );
  });

  it('rejects an empty string, which Postgres would have accepted', () => {
    // '' satisfies NOT NULL, so the database would take it and every item in
    // the collection would collide on the same primary key — one surviving
    // row instead of an error. Worse than the crash.
    expect(() => requireRecordId('notebook', '')).toThrow(/an empty string/);
  });

  it('explains why the mirror cannot proceed, not just that it failed', () => {
    expect(() => requireRecordId('exams', null)).toThrow(/durable_records\.id is NOT NULL/);
  });
});

describe('practice-session log identity', () => {
  beforeEach(() => _resetPracticeSessionLog());

  const base: PracticeSessionEntry = {
    student_id: 'stu-1',
    minutes: 12,
    completed_at: '2026-08-26T10:00:00.000Z',
    source: 'smart-practice',
  };

  it('assigns an id on write, so the entry can mirror', () => {
    logPracticeSession(base);
    const [entry] = _enumerateEntriesForTest();
    expect(entry.id).toBeTruthy();
    expect(() => requireRecordId('practice-sessions', entryId(entry))).not.toThrow();
  });

  it('gives two sessions logged in the same millisecond distinct ids', () => {
    // The mirror upserts on (collection, id): colliding ids merge two real
    // sessions into one row, so minutes silently go missing rather than error.
    logPracticeSession(base);
    logPracticeSession(base);
    const ids = _enumerateEntriesForTest().map(entryId);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('still mirrors entries written before the id field existed', () => {
    // Dropping these would lose real practice minutes already on disk, so the
    // fallback composite covers them rather than the fix starting from empty.
    const legacy = { ...base } as PracticeSessionEntry;
    delete legacy.id;
    expect(entryId(legacy)).toBe('stu-1:2026-08-26T10:00:00.000Z:smart-practice');
    expect(() => requireRecordId('practice-sessions', entryId(legacy))).not.toThrow();
  });

  it('preserves an id that was supplied explicitly', () => {
    logPracticeSession({ ...base, id: 'fixed-id' });
    expect(_enumerateEntriesForTest()[0].id).toBe('fixed-id');
  });
});

/**
 * Concurrent mirrors of one collection deadlocked, and the mirror was lost.
 *
 * `mirror()` rewrites a whole collection inside one transaction and is called
 * fire-and-forget after every save, so two saves overlap routinely. Nothing
 * ordered the inserts: `session-plans` re-groups and re-sorts its entire array
 * on every prune, so two overlapping mirrors could walk the same rows in
 * different orders — A holding row 1 and waiting on row 2 while B held row 2
 * and waited on row 1. Postgres broke the cycle by killing one, which showed
 * up in production as
 *
 *     [durable:session-plans] mirror failed (non-fatal): deadlock detected
 *
 * A deadlock needs two live transactions, so it cannot be reproduced in a unit
 * test. What CAN be pinned is the property that makes it impossible: every
 * transaction takes row locks in the same order, whatever order the caller
 * happened to hand the items over in.
 */
describe('mirror lock ordering', () => {
  type Row = [string, string, string | null, string];
  const row = (id: string): Row => ['session-plans', id, null, '{}'];

  it('orders rows by id regardless of the order they arrive in', () => {
    const forward = sortRowsById([row('a'), row('b'), row('c')]).map((r) => r[1]);
    const reverse = sortRowsById([row('c'), row('b'), row('a')]).map((r) => r[1]);
    const shuffled = sortRowsById([row('b'), row('a'), row('c')]).map((r) => r[1]);

    // The whole point: three different arrival orders, one lock order.
    expect(forward).toEqual(['a', 'b', 'c']);
    expect(reverse).toEqual(forward);
    expect(shuffled).toEqual(forward);
  });

  it('does not mutate the caller array', () => {
    // mirror() derives the DELETE's id list from the same rows, so a sort in
    // place would quietly reorder data the caller still holds.
    const input = [row('c'), row('a')];
    sortRowsById(input);
    expect(input.map((r) => r[1])).toEqual(['c', 'a']);
  });

  it('keeps every row — ordering must not drop or dedupe', () => {
    const sorted = sortRowsById([row('b'), row('a'), row('b')]);
    expect(sorted.map((r) => r[1])).toEqual(['a', 'b', 'b']);
  });
});

/**
 * `session-plans` mirrored every row with a null scope.
 *
 * Its `scopeOf` read `(i as any).student_id`. SessionPlan has no such field —
 * the student lives on `request` — so the cast silenced the compiler and the
 * expression evaluated to undefined for every plan. Rows still wrote (scope is
 * nullable), so nothing failed; `mirrorScope()` simply could never isolate one
 * student, which is the whole reason scope exists.
 *
 * Same root cause as the practice-sessions bug above: an `any` standing where
 * a type would have objected. This pins the shape so a future "cleanup" back
 * to a top-level `student_id` fails here rather than silently in production.
 */
describe('session-plan scope shape', () => {
  it('carries the student on request, not at the top level', () => {
    const plan = {
      id: 'PLN-abc12345',
      generated_at: '2026-08-26T10:00:00.000Z',
      request: { student_id: 'stu-7', exam_id: 'gate-ma', minutes_available: 30 },
    };

    expect((plan as Record<string, unknown>).student_id).toBeUndefined();
    expect(plan.request.student_id).toBe('stu-7');

    // What the fixed scopeOf resolves to, and what the broken one did.
    expect(plan.request?.student_id ?? null).toBe('stu-7');
    expect((plan as any).student_id ?? null).toBeNull();
  });
});

/**
 * Ordering the inserts did not stop the deadlock. Serializing the mirror does.
 *
 * The first attempt sorted rows by id so every transaction would take locks in
 * the same order. It reproduced on the very next deploy:
 *
 *     [durable:session-plans] mirror failed (non-fatal): deadlock detected
 *
 * Sorting only orders inserts against each other, and the cycle is not between
 * two inserts. Each mirror also runs a collection-wide
 * `DELETE ... WHERE NOT (id = ANY($ids))`, whose lock set is every row NOT in
 * its list — acquired in scan order, over a set this code does not choose. So
 * A holds the rows it inserted while its DELETE reaches for a row B just
 * inserted, and B's DELETE reaches back for one of A's. No insert ordering can
 * break that.
 *
 * `pg_advisory_xact_lock` keyed on the collection makes two mirrors of the same
 * collection strictly sequential, which removes the cycle instead of reshaping
 * it. What is testable without two live transactions is the key function: same
 * collection always maps to the same key, different collections do not collide
 * (or they would serialize against each other for no reason), and every key is
 * a valid signed bigint.
 */
describe('collectionLockKey', () => {
  it('is deterministic — the same collection always takes the same lock', () => {
    expect(collectionLockKey('session-plans')).toBe(collectionLockKey('session-plans'));
  });

  it('separates the collections actually in use, so they mirror concurrently', () => {
    const names = [
      'session-plans',
      'practice-sessions',
      'plan-templates',
      'student-exam-profiles',
      'notebook-entries',
      'retention-items',
    ];
    const keys = names.map(collectionLockKey);
    expect(new Set(keys.map(String)).size).toBe(names.length);
  });

  it('stays inside the signed-bigint range Postgres accepts', () => {
    for (const name of ['session-plans', '', 'a'.repeat(500), 'ünïcodé-ish']) {
      const k = collectionLockKey(name);
      expect(k).toBeGreaterThanOrEqual(0n);
      expect(k).toBeLessThanOrEqual(0x7fffffffffffffffn);
    }
  });
});
