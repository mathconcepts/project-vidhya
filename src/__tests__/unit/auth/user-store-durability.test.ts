/**
 * User records have to survive the host wiping .data.
 *
 * On Render's free tier the disk resets when the service sleeps, and
 * `src/auth/user-store.ts` was flat-file only. Accounts created through the
 * web, Telegram, WhatsApp and operator surfaces did not exist the next
 * morning. The store's own id generator carries a comment about JWTs
 * surviving "a Render free-tier restart which wipes the file" — the symptom
 * was known; the data loss under it was not addressed.
 *
 * The dangerous test here is the third one. A restore that overwrites a
 * populated file turns a stale mirror into exactly the data loss this exists
 * to prevent, so "refuses to hydrate over live data" matters more than
 * "hydrates".
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  NullAuthUserRepo,
  _setAuthUserRepo,
  type AuthUserRepo,
  type AuthStoreSnapshot,
} from '../../../storage/repositories/auth-user-repo';

const STORE_FILE = path.resolve(process.cwd(), '.data/users.json');
let backup: string | null = null;

function writeFileStore(users: Record<string, unknown>, owner_id: string | null = null): void {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(
    STORE_FILE,
    JSON.stringify({ version: 1, org_id: 'default', owner_id, users }, null, 2),
  );
}

function readFileStore(): AuthStoreSnapshot {
  return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
}

/** An in-memory stand-in for the Postgres mirror. */
class FakeRepo implements AuthUserRepo {
  public mirrored: AuthStoreSnapshot | null = null;
  public upsertCalls = 0;
  constructor(private durable: AuthStoreSnapshot | null = null) {}
  async upsertAll(store: AuthStoreSnapshot): Promise<void> {
    this.upsertCalls += 1;
    this.mirrored = JSON.parse(JSON.stringify(store));
  }
  async loadAll(): Promise<AuthStoreSnapshot | null> { return this.durable; }
  describe(): string { return 'fake'; }
}

const user = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  google_sub: `sub-${id}`,
  email: `${id}@example.com`,
  name: id,
  role: 'student',
  teacher_of: [],
  taught_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
  last_seen_at: '2026-01-01T00:00:00.000Z',
  channels: ['web'],
  ...extra,
});

beforeEach(() => {
  backup = fs.existsSync(STORE_FILE) ? fs.readFileSync(STORE_FILE, 'utf-8') : null;
});

afterEach(() => {
  _setAuthUserRepo(null);
  if (backup !== null) fs.writeFileSync(STORE_FILE, backup);
  else if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
});

describe('hydration', () => {
  it('restores accounts when the file is gone', async () => {
    if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
    _setAuthUserRepo(new FakeRepo({
      version: 1,
      org_id: 'default',
      owner_id: 'u1',
      users: { u1: user('u1', { role: 'owner' }), u2: user('u2') } as never,
    }));

    const { hydrateFromDurableStore } = await import('../../../auth/user-store');
    const r = await hydrateFromDurableStore();

    expect(r.hydrated).toBe(true);
    expect(r.users).toBe(2);
    const restored = readFileStore();
    expect(Object.keys(restored.users)).toEqual(['u1', 'u2']);
    expect(restored.owner_id).toBe('u1');
  });

  it('restores every field, including the arrays a column mapping would drop', async () => {
    // Why the record is stored as one JSONB value rather than field-per-column:
    // User has four arrays and several optionals, on a @ts-nocheck module, so
    // a forgotten column loses a parent's guardian list with no compiler
    // complaint and no test failure anywhere else.
    if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
    const parent = user('p1', {
      role: 'parent',
      guardian_of: ['s1', 's2'],
      channels: ['web', 'telegram:12345'],
      picture: 'https://example.com/a.png',
    });
    _setAuthUserRepo(new FakeRepo({
      version: 1, org_id: 'default', owner_id: null, users: { p1: parent } as never,
    }));

    const { hydrateFromDurableStore } = await import('../../../auth/user-store');
    await hydrateFromDurableStore();

    expect(readFileStore().users.p1).toEqual(parent);
  });

  it('REFUSES to overwrite a file that already has users', async () => {
    // The failure mode that would be worse than the bug. A live file is the
    // current state; the mirror may be stale. Restoring over it would delete
    // real accounts.
    writeFileStore({ live: user('live') });
    _setAuthUserRepo(new FakeRepo({
      version: 1, org_id: 'default', owner_id: null,
      users: { stale: user('stale') } as never,
    }));

    const { hydrateFromDurableStore } = await import('../../../auth/user-store');
    const r = await hydrateFromDurableStore();

    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/already has users/);
    expect(Object.keys(readFileStore().users)).toEqual(['live']);
  });

  it('leaves the file alone when there is nothing durable to restore', async () => {
    if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
    _setAuthUserRepo(new FakeRepo(null));

    const { hydrateFromDurableStore } = await import('../../../auth/user-store');
    const r = await hydrateFromDurableStore();

    expect(r.hydrated).toBe(false);
    expect(fs.existsSync(STORE_FILE)).toBe(false);
  });

  it('treats a durable read FAILURE as nothing-to-restore, not as zero users', async () => {
    // PgAuthUserRepo.loadAll returns null on a query error rather than an
    // empty snapshot, so an unreachable database cannot be mistaken for "no
    // accounts exist" and trigger a write.
    if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
    _setAuthUserRepo({
      async upsertAll() {},
      async loadAll() { return null; },
      describe: () => 'failing',
    });

    const { hydrateFromDurableStore } = await import('../../../auth/user-store');
    expect((await hydrateFromDurableStore()).hydrated).toBe(false);
    expect(fs.existsSync(STORE_FILE)).toBe(false);
  });

  it('does not hydrate from an empty durable store', async () => {
    if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
    _setAuthUserRepo(new FakeRepo({ version: 1, org_id: 'default', owner_id: null, users: {} }));

    const { hydrateFromDurableStore } = await import('../../../auth/user-store');
    const r = await hydrateFromDurableStore();
    expect(r.hydrated).toBe(false);
    expect(r.reason).toMatch(/empty/);
  });
});

describe('the mirror', () => {
  it('captures a signup, so the next boot can restore it', async () => {
    if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
    const repo = new FakeRepo();
    _setAuthUserRepo(repo);

    const { upsertFromGoogle } = await import('../../../auth/user-store');
    upsertFromGoogle({
      google_sub: 'sub-abc', email: 'a@example.com', name: 'A', picture: undefined,
    });

    // The mirror is fire-and-forget behind a dynamic import; let it settle.
    await new Promise((r) => setTimeout(r, 20));

    expect(repo.upsertCalls).toBeGreaterThan(0);
    const emails = Object.values(repo.mirrored!.users).map((u) => (u as { email: string }).email);
    expect(emails).toContain('a@example.com');
  });

  it('does not break a signup when the mirror throws', async () => {
    // Auth must never fail because the durable store is unreachable. The file
    // write has already succeeded by the time the mirror runs.
    if (fs.existsSync(STORE_FILE)) fs.rmSync(STORE_FILE);
    _setAuthUserRepo({
      async upsertAll() { throw new Error('database on fire'); },
      async loadAll() { return null; },
      describe: () => 'exploding',
    });

    const { upsertFromGoogle, getUserByEmail } = await import('../../../auth/user-store');
    expect(() =>
      upsertFromGoogle({ google_sub: 'sub-x', email: 'x@example.com', name: 'X', picture: undefined }),
    ).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
    expect(getUserByEmail('x@example.com')).not.toBeNull();
  });
});

describe('DB-less deploys say so instead of pretending', () => {
  it('reports plainly that records are file-only', () => {
    expect(new NullAuthUserRepo().describe()).toMatch(/DB-less/);
  });

  it('is a silent no-op rather than an error path', async () => {
    const n = new NullAuthUserRepo();
    await expect(n.upsertAll()).resolves.toBeUndefined();
    await expect(n.loadAll()).resolves.toBeNull();
  });
});

describe('the JSONB record is not a hole in the column gate', () => {
  /**
   * `auth_user_records.record` stores the whole User as one JSONB value, so
   * the deny-by-default column gate cannot see inside it — a field added to
   * `User` gets persisted with none of the scrutiny a new COLUMN would get.
   * That weakness was surfaced by the gate itself refusing migration 041.
   *
   * This closes it: the fields User may carry are enumerated here, and a new
   * one fails until someone reviews it. Same question the column gate asks —
   * should this be stored about a person at all.
   */
  const REVIEWED_USER_FIELDS = [
    // Identity and contact, all supplied by Google at sign-in.
    'id', 'google_sub', 'email', 'name', 'picture',
    // Role and the relationship graph it implies.
    'role', 'teacher_of', 'taught_by', 'guardian_of', 'guardians',
    // Timestamps. `last_seen_at` is the one thing here that tracks a person
    // over time; it is a single coarse value, overwritten not appended, so it
    // records presence rather than a history of behaviour.
    'created_at', 'last_seen_at',
    // Linked identities — "web", "telegram:<chat_id>", "whatsapp:<e164>".
    // A phone number lives here, which is why it is called out rather than
    // waved through with the rest.
    'channels',
    // Curriculum setting, assigned by an admin or teacher. Not observation.
    'exam_id',
    // The closest thing in this record to behavioural data: concepts a
    // teacher pushed to a student's queue, each with a teacher id and a
    // timestamp. Reviewed and kept because it is a teacher's ACTION on a
    // student, not a record of what the student did, and it is pruned on
    // dismiss or completion rather than accumulating.
    'pushed_reviews',
  ].sort();

  it('User declares only reviewed fields', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), 'src/auth/types.ts'), 'utf-8');
    const body = src.split('export interface User {')[1]?.split('\n}')[0] ?? '';
    expect(body, 'User interface not found in auth/types.ts').not.toBe('');

    const declared = [...body.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]).sort();
    expect(declared.length).toBeGreaterThan(5);

    const unreviewed = declared.filter((f) => !REVIEWED_USER_FIELDS.includes(f));
    expect(
      unreviewed,
      'User has grown a field that is persisted into auth_user_records.record without review.\n' +
        'A JSONB blob bypasses the schema-column gate, so the question is asked here instead:\n' +
        'should this be stored about a person? Add it to REVIEWED_USER_FIELDS in the same PR.',
    ).toEqual([]);
  });

  it('the allowlist is a real list, not an empty one that passes vacuously', () => {
    expect(REVIEWED_USER_FIELDS.length).toBeGreaterThan(8);
    expect(REVIEWED_USER_FIELDS).toContain('guardian_of');
  });
});
