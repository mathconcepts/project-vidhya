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
import { requireRecordId } from '../../../storage/repositories/durable-store-repo';
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
