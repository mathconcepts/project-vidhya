/**
 * Feedback and generated content have to survive the host wiping .data.
 *
 * Both stores were flat-file only, and Render's free tier resets .data when
 * the service sleeps. So "we act on your feedback" stopped being true after a
 * sleep cycle, and every restart discarded the bridge content the model had
 * been paid to produce.
 *
 * Same treatment user accounts got in migration 041. The load-bearing test
 * here is the same one as there: a restore that overwrites live records turns
 * a stale mirror into the very data loss it exists to prevent.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  hydrateCollection,
  makeDurableStore,
  type DurableStore,
} from '../../../storage/repositories/durable-store-repo';

const FEEDBACK_FILE = path.resolve(process.cwd(), '.data/feedback.json');
let backup: string | null = null;

/** In-memory stand-in for the Postgres mirror. */
class FakeStore<T> implements DurableStore<T> {
  public mirrored: T[] | null = null;
  constructor(private durable: T[] | null = null) {}
  async mirror(items: T[]): Promise<void> { this.mirrored = [...items]; }
  async load(): Promise<T[] | null> { return this.durable; }
  describe(): string { return 'fake'; }
}

const fb = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  kind: 'mock_question_error',
  description: 'the third option is also correct',
  target: { exam_id: 'gate-ma', question_id: 'q3' },
  submitted_by: { user_id: 'u1' },
  status: 'new',
  priority: 'medium',
  ...extra,
});

beforeEach(() => {
  backup = fs.existsSync(FEEDBACK_FILE) ? fs.readFileSync(FEEDBACK_FILE, 'utf-8') : null;
});
afterEach(async () => {
  vi.restoreAllMocks();
  const { _reset } = await import('../../../feedback/durable');
  _reset();
  if (backup !== null) fs.writeFileSync(FEEDBACK_FILE, backup);
  else if (fs.existsSync(FEEDBACK_FILE)) fs.rmSync(FEEDBACK_FILE);
});

describe('hydrateCollection', () => {
  it('restores when the local collection is empty', async () => {
    const store = new FakeStore([fb('FB-1'), fb('FB-2')]);
    let written: unknown[] = [];
    const r = await hydrateCollection(store, [], (v) => { written = v; });

    expect(r).toMatchObject({ hydrated: true, count: 2 });
    expect(written).toHaveLength(2);
  });

  it('REFUSES to overwrite records that already exist locally', async () => {
    // The failure that would be worse than the bug. The local file is current
    // state; the mirror may be stale.
    const store = new FakeStore([fb('FB-stale')]);
    let written: unknown[] | null = null;
    const r = await hydrateCollection(store, [fb('FB-live')], (v) => { written = v; });

    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/already has records/);
    expect(written).toBeNull();
  });

  it('treats a durable read FAILURE as nothing-to-restore, not as zero records', async () => {
    // PgDurableStore.load() returns null on a query error rather than [], so
    // an unreachable database cannot be read as "there is nothing here".
    let written: unknown[] | null = null;
    const r = await hydrateCollection(new FakeStore(null), [], (v) => { written = v; });
    expect(r.hydrated).toBe(false);
    expect(written).toBeNull();
  });

  it('does not write for an empty durable store', async () => {
    let written: unknown[] | null = null;
    const r = await hydrateCollection(new FakeStore([]), [], (v) => { written = v; });
    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/empty/);
    expect(written).toBeNull();
  });
});

describe('the feedback store', () => {
  it('mirrors a submission, so the next boot can restore it', async () => {
    if (fs.existsSync(FEEDBACK_FILE)) fs.rmSync(FEEDBACK_FILE);
    const durable = await import('../../../feedback/durable');
    const spy = vi.spyOn(durable, 'mirrorAll').mockResolvedValue(undefined);

    const { submitFeedback } = await import('../../../feedback/store');
    submitFeedback({
      kind: 'mock_question_error',
      target: { exam_id: 'gate-ma', question_id: 'q3' },
      description: 'option C is also correct',
      submitted_by: { user_id: 'u1', role: 'student' },
    } as never);

    await new Promise((r) => setTimeout(r, 20));
    expect(spy).toHaveBeenCalled();
    const mirrored = spy.mock.calls[0][0] as { feedback: Array<{ description: string }> };
    expect(mirrored.feedback.map((f) => f.description)).toContain('option C is also correct');
  });

  it('does not break a submission when the mirror throws', async () => {
    // Reporting a wrong answer must not fail because the database is down.
    if (fs.existsSync(FEEDBACK_FILE)) fs.rmSync(FEEDBACK_FILE);
    const durable = await import('../../../feedback/durable');
    vi.spyOn(durable, 'mirrorAll').mockRejectedValue(new Error('database on fire'));

    const { submitFeedback, listFeedback } = await import('../../../feedback/store');
    expect(() =>
      submitFeedback({
        kind: 'mock_question_error',
        target: { exam_id: 'gate-ma' },
        description: 'still recorded locally',
        submitted_by: { user_id: 'u2', role: 'student' },
      } as never),
    ).not.toThrow();

    await new Promise((r) => setTimeout(r, 20));
    expect(listFeedback().map((f) => f.description)).toContain('still recorded locally');
  });

  it('hydration leaves a populated local file alone', async () => {
    const { submitFeedback, hydrateFeedbackStore } = await import('../../../feedback/store');
    submitFeedback({
      kind: 'mock_question_error',
      target: { exam_id: 'gate-ma' },
      description: 'live record',
      submitted_by: { user_id: 'u3', role: 'student' },
    } as never);

    const r = await hydrateFeedbackStore();
    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/already has records/);
  });
});

describe('DB-less deploys say so instead of pretending', () => {
  it('reports plainly that records are local-only', () => {
    // No DATABASE_URL in this environment, so this is the real path.
    const s = makeDurableStore<{ id: string }>({
      table: 'feedback_items', idColumn: 'id', idOf: (x) => x.id,
    });
    expect(s.describe()).toMatch(/DB-less/);
  });

  it('is a silent no-op rather than an error path', async () => {
    const s = makeDurableStore<{ id: string }>({
      table: 'feedback_items', idColumn: 'id', idOf: (x) => x.id,
    });
    await expect(s.mirror([{ id: 'a' }])).resolves.toBeUndefined();
    await expect(s.load()).resolves.toBeNull();
  });
});

describe('batches are deliberately not mirrored', () => {
  it('the bridge store persists content but not batch state', async () => {
    // Transient job state, rewritten on every unit, and a lost in-flight
    // batch is re-runnable. The content it produced is not — that cost money.
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/syllabus-bridge/store.ts'),
      'utf-8',
    );
    expect(src).toContain('bridge_generated_content');
    const afterBatches = src.slice(src.indexOf('// ----- Batch request store -----'));
    expect(afterBatches).not.toContain('makeDurableStore');
  });
});

describe('the JSONB record is not a hole in the column gate', () => {
  /**
   * `feedback_items.record` stores the whole FeedbackItem as one JSONB value,
   * so the deny-by-default column gate cannot see inside it. That matters
   * more here than for most tables: the record holds a student's own words
   * and the id of who wrote them.
   *
   * Same closure as the auth record — the fields FeedbackItem may carry are
   * enumerated, and a new one fails until someone reviews it.
   */
  const REVIEWED_FEEDBACK_FIELDS = [
    // Identity of the report itself.
    'id', 'kind', 'target',
    // The student's own words and what they proposed instead. The reason
    // this store exists, and the reason losing it overnight mattered.
    'description', 'suggestion', 'evidence',
    // Who filed it. The most sensitive field in the record. Kept because
    // triage is a conversation and duplicate detection needs to know two
    // reports came from different people.
    'submitted_by',
    // How many others reported the same thing. An aggregate count, not a
    // list of who — deliberately.
    'corroboration_count',
    // Operator triage. Every one of these is set by a reviewer acting on the
    // report, never observed from the student.
    'status', 'priority', 'admin_notes',
    'triaged_by', 'triaged_at', 'approved_by', 'approved_at',
    'rejection_reason', 'merged_into',
    // Outcome tracking — did this change anything, and in which release.
    'applied_at', 'applied_in_release',
  ].sort();

  it('FeedbackItem declares only reviewed fields', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), 'src/feedback/types.ts'), 'utf-8');
    const body = src.split('export interface FeedbackItem {')[1]?.split('\n}')[0] ?? '';
    expect(body, 'FeedbackItem not found in feedback/types.ts').not.toBe('');

    const declared = [...body.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]).sort();
    expect(declared.length).toBeGreaterThan(5);

    const unreviewed = declared.filter((f) => !REVIEWED_FEEDBACK_FIELDS.includes(f));
    expect(
      unreviewed,
      'FeedbackItem has grown a field that is persisted into feedback_items.record\n' +
        'without review. A JSONB blob bypasses the schema-column gate, so the question is\n' +
        'asked here instead: should this be stored about a person? Add it to\n' +
        'REVIEWED_FEEDBACK_FIELDS in the same PR.',
    ).toEqual([]);
  });

  it('the allowlist is a real list, not an empty one that passes vacuously', () => {
    expect(REVIEWED_FEEDBACK_FIELDS.length).toBeGreaterThan(8);
    expect(REVIEWED_FEEDBACK_FIELDS).toContain('submitted_by');
  });
});
