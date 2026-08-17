/**
 * AuthUserRepo — durable mirror of the flat-file user store.
 *
 * ── Why a mirror rather than a replacement ──────────────────────────────
 *
 * All seventeen exported functions in `src/auth/user-store.ts` are
 * SYNCHRONOUS — `getUserById`, `upsertFromGoogle`, `setRole`, `linkChannel`
 * and the rest — and thirteen production files call them, including every
 * auth route. Postgres is not synchronous. Replacing the backing store means
 * making all seventeen async and changing every caller, on two modules that
 * both carry `@ts-nocheck` so the compiler would catch none of it.
 *
 * So the file stays the read path and this becomes the durable one:
 *
 *     mutation ──▶ writeStore() ──▶ users.json        (sync, unchanged)
 *                       └────────▶ upsertAll()        (async, fire-and-forget)
 *
 *     boot ──▶ hydrate() ──▶ users.json rebuilt from Postgres, if the file
 *                            is missing or empty and the table is not
 *
 * Every signature is preserved, no caller changes, and accounts survive the
 * host wiping `.data`.
 *
 * ── What this does not fix ──────────────────────────────────────────────
 *
 * Two instances serving simultaneously would each hold their own file and
 * hydrate only at boot, so a write on one is invisible to the other until it
 * restarts. Render's free tier is single-instance, which is the deployment
 * this bug bites; a multi-instance deploy needs the full async migration,
 * and that is written up in TODOS.md rather than pretended away here.
 */

import { getSharedPool } from '../pool';

/** The store shape `user-store.ts` persists. Structurally typed to avoid importing a `@ts-nocheck` module. */
export interface AuthStoreSnapshot {
  version: number;
  org_id: string;
  owner_id: string | null;
  users: Record<string, {
    id: string;
    google_sub?: string;
    email?: string;
    [k: string]: unknown;
  }>;
}

export interface AuthUserRepo {
  /** Mirror the whole store. Never throws — auth must not fail because the mirror is down. */
  upsertAll(store: AuthStoreSnapshot): Promise<void>;
  /** Everything durable, or null when there is no durable store to read. */
  loadAll(): Promise<AuthStoreSnapshot | null>;
  describe(): string;
}

/** No database configured — the file is all there is, and that is stated rather than hidden. */
export class NullAuthUserRepo implements AuthUserRepo {
  async upsertAll(): Promise<void> {}
  async loadAll(): Promise<AuthStoreSnapshot | null> { return null; }
  describe(): string { return 'none (DB-less — user records live only in .data/users.json)'; }
}

export class PgAuthUserRepo implements AuthUserRepo {
  async upsertAll(store: AuthStoreSnapshot): Promise<void> {
    const pool = getSharedPool();
    if (!pool) return;
    const users = Object.values(store.users ?? {});
    const client = await pool.connect().catch(() => null);
    if (!client) return;
    try {
      await client.query('BEGIN');
      for (const u of users) {
        await client.query(
          `INSERT INTO auth_user_records (id, org_id, google_sub, email, is_owner, record, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, now())
           ON CONFLICT (id) DO UPDATE SET
             org_id     = EXCLUDED.org_id,
             google_sub = EXCLUDED.google_sub,
             email      = EXCLUDED.email,
             is_owner   = EXCLUDED.is_owner,
             record     = EXCLUDED.record,
             updated_at = now()`,
          [
            u.id,
            store.org_id ?? 'default',
            u.google_sub ?? null,
            u.email ?? null,
            store.owner_id === u.id,
            JSON.stringify(u),
          ],
        );
      }
      // A user removed from the file is removed here too, or the next
      // hydration would resurrect a deleted account.
      const ids = users.map((u) => u.id);
      if (ids.length > 0) {
        await client.query(
          `DELETE FROM auth_user_records WHERE org_id = $1 AND NOT (id = ANY($2::text[]))`,
          [store.org_id ?? 'default', ids],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      // Deliberately non-fatal. A failed mirror must never break a signup.
      console.error('[auth-user-repo] mirror failed (non-fatal):', (err as Error).message);
    } finally {
      client.release();
    }
  }

  async loadAll(): Promise<AuthStoreSnapshot | null> {
    const pool = getSharedPool();
    if (!pool) return null;
    try {
      const { rows } = await pool.query(
        `SELECT id, org_id, is_owner, record FROM auth_user_records`,
      );
      if (rows.length === 0) return null;
      const users: AuthStoreSnapshot['users'] = {};
      let owner_id: string | null = null;
      for (const r of rows as Array<Record<string, unknown>>) {
        const rec = typeof r.record === 'string' ? JSON.parse(r.record) : r.record;
        users[String(r.id)] = rec;
        if (r.is_owner) owner_id = String(r.id);
      }
      return {
        version: 1,
        org_id: String((rows[0] as Record<string, unknown>).org_id ?? 'default'),
        owner_id,
        users,
      };
    } catch (err) {
      // A read failure must not look like "no users" to the caller, or
      // hydration would happily overwrite nothing with nothing while the
      // real records sit unreachable. Null means "nothing to restore from",
      // and the caller leaves the file alone.
      console.error('[auth-user-repo] load failed:', (err as Error).message);
      return null;
    }
  }

  describe(): string { return 'postgres:auth_user_records'; }
}

let _repo: AuthUserRepo | null = null;

export function getAuthUserRepo(): AuthUserRepo {
  if (!_repo) _repo = getSharedPool() ? new PgAuthUserRepo() : new NullAuthUserRepo();
  return _repo;
}

/** Tests only. */
export function _setAuthUserRepo(r: AuthUserRepo | null): void {
  _repo = r;
}
