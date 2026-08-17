/**
 * The rest of the flat-file stores, made durable (migration 043).
 *
 * The audit that produced this found 30 `createFlatFileStore` call sites and
 * roughly seventeen holding something a person made that nothing can
 * recompute: a student's review schedule, their mastery trajectory, exams an
 * admin spent an afternoon on, what a teacher told their class. Render's free
 * tier wipes `.data` when the service sleeps, so all of it was one quiet
 * weekend from gone.
 *
 * Two things are tested here, and the second is the one that catches real
 * regressions:
 *
 *   1. The helper's contract — restore when empty, REFUSE when not, and never
 *      read an unreachable database as "there is nothing here".
 *   2. That the stores are actually wired to it. A helper nobody calls looks
 *      exactly like a helper everybody calls, right up until the data is gone.
 *
 * (2) works by faking only the Postgres layer — `makeSharedStore` — so the
 * real `durableCollection` and the real store modules run. Deleting a
 * `_durable.put(...)` from a store fails a test here.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rec = vi.hoisted(() => ({
  /** Every mirror/put that reached the (faked) database, in order. */
  calls: [] as Array<{ op: 'mirror' | 'put'; collection: string; items?: unknown[]; scope?: string; item?: unknown }>,
  /** What a `load()` should return, per collection. Absent ⇒ null. */
  durable: new Map<string, unknown[]>(),
}));

vi.mock('../../../storage/repositories/durable-store-repo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../storage/repositories/durable-store-repo')>();
  return {
    ...actual,
    makeSharedStore: (spec: { collection: string }) => ({
      async mirror(items: unknown[], scope?: string) {
        rec.calls.push({ op: 'mirror', collection: spec.collection, items, scope });
      },
      async put(item: unknown) {
        rec.calls.push({ op: 'put', collection: spec.collection, item });
      },
      async load() {
        return rec.durable.get(spec.collection) ?? null;
      },
      describe: () => `fake:${spec.collection}`,
    }),
  };
});

/** Files the wiring tests touch. Restored afterwards so a run leaves no trace. */
const TOUCHED = [
  '.data/gbrain-retention.json',
  '.data/gbrain-trajectory.json',
  '.data/syllabus-bridge-feedback.json',
  '.data/exams.json',
];
const backups = new Map<string, string | null>();

/** Let the fire-and-forget mirrors land. */
const settle = () => new Promise((r) => setTimeout(r, 20));

beforeEach(() => {
  rec.calls.length = 0;
  rec.durable.clear();
  for (const f of TOUCHED) {
    const p = path.resolve(process.cwd(), f);
    backups.set(f, fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null);
  }
});

afterEach(() => {
  for (const f of TOUCHED) {
    const p = path.resolve(process.cwd(), f);
    const prior = backups.get(f) ?? null;
    if (prior !== null) fs.writeFileSync(p, prior);
    else if (fs.existsSync(p)) fs.rmSync(p);
  }
});

// ---------------------------------------------------------------------------

describe('durableCollection — the contract every wired store inherits', () => {
  type Row = { id: string; v: number };

  /** A collection over an in-memory array, so the helper itself is under test. */
  async function fixture(local: Row[], collection = 'test-rows') {
    let store = [...local];
    const { durableCollection } = await import('../../../storage/durable-flat-file');
    const handle = durableCollection<Row>({
      collection,
      idOf: (r) => r.id,
      readLocal: () => store,
      writeLocal: (rows) => { store = rows; },
    });
    return { handle, current: () => store };
  }

  it('restores when the local store is empty', async () => {
    rec.durable.set('test-rows', [{ id: 'a', v: 1 }, { id: 'b', v: 2 }]);
    const { handle, current } = await fixture([]);

    const r = await handle.hydrate();
    expect(r).toMatchObject({ hydrated: true, count: 2 });
    expect(current()).toHaveLength(2);
  });

  it('REFUSES to overwrite a store that already has records', async () => {
    // The failure that would be worse than the bug this exists to fix. The
    // local file is live state; the mirror may be a week stale. Restoring on
    // top of it deletes real work.
    rec.durable.set('test-rows', [{ id: 'stale', v: 0 }]);
    const { handle, current } = await fixture([{ id: 'live', v: 9 }]);

    const r = await handle.hydrate();
    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/already has records/);
    expect(current()).toEqual([{ id: 'live', v: 9 }]);
  });

  it('treats a failed durable read as nothing-to-restore, not as zero records', async () => {
    // load() returns null on a query error rather than [], so an unreachable
    // database cannot be mistaken for an empty one — which would otherwise
    // read as "hydration succeeded, there was nothing there".
    const { handle, current } = await fixture([]);   // nothing in rec.durable ⇒ null
    const r = await handle.hydrate();
    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/no durable records/);
    expect(current()).toEqual([]);
  });

  it('does not write for a durable store that is genuinely empty', async () => {
    rec.durable.set('test-rows', []);
    const { handle } = await fixture([]);
    const r = await handle.hydrate();
    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/empty/);
  });

  it('mirroring is fire-and-forget — a broken mirror does not break the caller', async () => {
    const { durableCollection } = await import('../../../storage/durable-flat-file');
    const handle = durableCollection<Row>({
      collection: 'test-rows',
      idOf: (r) => r.id,
      readLocal: () => { throw new Error('database on fire'); },
      writeLocal: () => {},
    });
    expect(() => handle.mirror()).not.toThrow();
    await settle();
  });

  it('mirrorScope carries the scope through, so one owner cannot wipe another', async () => {
    const { handle } = await fixture([]);
    handle.mirrorScope('student-1', [{ id: 'a', v: 1 }]);
    await settle();

    const call = rec.calls.find((c) => c.op === 'mirror');
    expect(call?.scope).toBe('student-1');
  });
});

// ---------------------------------------------------------------------------

describe('the stores are actually wired to it', () => {
  it('a recorded review schedule reaches the durable store', async () => {
    // after-each-attempt.ts calls this on every attempt. Before 043 the
    // schedule lived only in .data, so spaced repetition — the whole basis of
    // the retention claim — restarted from zero after any sleep.
    const { recordEncounter } = await import('../../../gbrain/retention-scheduler');
    recordEncounter('student-wired', 'calculus.limits', 4);
    await settle();

    const put = rec.calls.find((c) => c.op === 'put' && c.collection === 'retention-items');
    expect(put, 'recordEncounter did not mirror the schedule').toBeDefined();
    expect(put!.item).toMatchObject({ student_id: 'student-wired', concept_id: 'calculus.limits' });
  });

  it('a mastery point reaches the durable store, scoped to its student', async () => {
    const { logMasteryPoint } = await import('../../../gbrain/performance-tracker');
    logMasteryPoint('student-wired', 'calculus.limits', 0.62);
    await settle();

    const call = rec.calls.find((c) => c.op === 'mirror' && c.collection === 'mastery-trajectory');
    expect(call, 'logMasteryPoint did not mirror the trajectory').toBeDefined();
    // Scoped, not wholesale: one attempt must not rewrite the whole cohort.
    expect(call!.scope).toBe('student-wired');
    expect(call!.items).toHaveLength(1);
  });

  it('content feedback reaches the durable store', async () => {
    const { saveFeedback } = await import('../../../syllabus-bridge/feedback-store');
    saveFeedback({
      feedback_id: 'CF-1', content_id: 'c1', unit_id: 'u1', mapping_id: 'm1',
      user_id: 'u', role: 'student', rating: 'unclear',
      created_at: new Date().toISOString(),
    });
    await settle();

    const put = rec.calls.find((c) => c.op === 'put' && c.collection === 'bridge-content-feedback');
    expect(put, 'saveFeedback did not mirror the rating').toBeDefined();
  });

  it('every exam mutation mirrors, not just the one someone remembered', async () => {
    // exam-store routes all five write sites through a single `mutate`, so a
    // sixth added later cannot silently skip the mirror. This checks the
    // property that matters — an edit, not just a create, is persisted.
    const exams = await import('../../../exams/exam-store');
    const exam = exams.createExam({ code: 'WIRED1', name: 'Wired', level: 'undergraduate' } as never, 'admin-1');
    await settle();
    rec.calls.length = 0;

    exams.updateExam({ id: exam.id, updates: { name: 'Renamed' }, source: 'admin_manual' });
    await settle();

    const call = rec.calls.find((c) => c.op === 'mirror' && c.collection === 'exams');
    expect(call, 'updateExam did not mirror').toBeDefined();
    expect((call!.items as Array<{ name: string }>).some((e) => e.name === 'Renamed')).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('the registry knows about every store that was supposed to be wired', () => {
  /**
   * The irreplaceable tier, by name. Deleting a `registerDurable` call fails
   * here rather than at the next unplanned restart.
   *
   * Deliberately absent, and why:
   *   - notebook entries      wired per-student, hydrated lazily on read
   *                           rather than at boot (each notebook is its own
   *                           file, so there is no single collection to walk)
   *   - user accounts         migration 041, its own table
   *   - feedback / bridge     migration 042, their own tables
   *   - bridge batches        transient job state; a lost batch is re-runnable
   *   - telemetry, quality    recomputable from their sources
   *   - agent + task scratch  working state of a single run
   */
  const EXPECTED = [
    'attention-coverage',
    'bridge-content-feedback',
    'content-review',
    'exam-groups',
    'exams',
    'live-courses',
    'marketing-articles',
    'marketing-campaigns',
    'mastery-trajectory',
    'plan-templates',
    'practice-sessions',
    'retention-items',
    'session-plans',
    'student-exam-profiles',
    'teacher-announcements',
    'teacher-brief-snapshots',
  ];

  it('registers all of them', async () => {
    await Promise.all([
      import('../../../gbrain/retention-scheduler'),
      import('../../../gbrain/performance-tracker'),
      import('../../../session-planner/store'),
      import('../../../session-planner/exam-profile-store'),
      import('../../../session-planner/practice-session-log'),
      import('../../../session-planner/template-store'),
      import('../../../attention/store'),
      import('../../../sample-check/store'),
      import('../../../course/promoter'),
      import('../../../marketing/blog-store'),
      import('../../../marketing/campaign-store'),
      import('../../../exams/exam-store'),
      import('../../../exams/exam-group-store'),
      import('../../../syllabus-bridge/feedback-store'),
      import('../../../api/teaching-routes'),
    ]);

    const { registeredDurableNames } = await import('../../../storage/durable-flat-file');
    const missing = EXPECTED.filter((n) => !registeredDurableNames().includes(n));
    expect(
      missing,
      'A store lost its registerDurable call. Its data no longer survives a restart.',
    ).toEqual([]);
  });

  it('the expected list is a real list, not an empty one that passes vacuously', () => {
    expect(EXPECTED.length).toBeGreaterThan(12);
    expect(EXPECTED).toContain('retention-items');
  });
});

// ---------------------------------------------------------------------------

describe('the weekly-brief snapshot write', () => {
  it('passes a state to write(), not a mutator', () => {
    /**
     * This was `briefSnapshotStore.write(prev => ...)`. `write` takes a state,
     * not a callback, and `JSON.stringify` of a function is `undefined` —
     * which `fs.writeFileSync` rejects. Every request to
     * GET /api/teaching/weekly-brief threw on that line, and no snapshot was
     * ever stored, so the week-over-week delta the brief advertises could
     * never appear.
     */
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/api/teaching-routes.ts'),
      'utf-8',
    );
    expect(src).not.toMatch(/briefSnapshotStore\.write\(\s*(\w+\s*=>|\()/);
    expect(src).toMatch(/briefSnapshotStore\.update\(/);
  });

  it('and writeFileSync really does reject a function, so the above is not a style rule', () => {
    // The reason this is a bug and not a preference, asserted rather than
    // asserted-about.
    expect(JSON.stringify(() => 1)).toBeUndefined();
    expect(() => fs.writeFileSync(
      path.resolve(process.cwd(), '.data/_never-written.json'),
      JSON.stringify(() => 1) as never,
    )).toThrow(/must be of type string/);
  });
});
