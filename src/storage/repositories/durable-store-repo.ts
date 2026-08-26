/**
 * DurableStoreRepo — a generic mirror for the flat-file stores.
 *
 * `auth-user-repo.ts` established the shape for user accounts: the file stays
 * the synchronous read path, Postgres becomes the durable one, and boot
 * restores the file when the host has wiped it. Two more stores need exactly
 * that and nothing more, so this is the pattern extracted rather than copied
 * a third time.
 *
 *     mutation ──▶ writeStore() ──▶ .data/<file>.json     (sync, unchanged)
 *                       └────────▶ mirror()               (async, best-effort)
 *
 *     boot ──▶ hydrate() ──▶ file rebuilt from Postgres, ONLY when empty
 *
 * The "only when empty" rule is the important one. A populated file is live
 * state and the mirror may be stale, so restoring over it would delete real
 * records — worse than the data loss being fixed. `load()` also returns null
 * rather than an empty array when a query fails, so an unreachable database
 * cannot be mistaken for "there is nothing here".
 *
 * Each collection is one table with the domain object in a `record` JSONB
 * column and only the queried fields promoted beside it. Field-per-column
 * mapping across nested optional shapes drops a field silently the first time
 * the type grows; see 041's rationale.
 */

import { getSharedPool } from '../pool';

/** How one collection maps onto one table. */
export interface DurableCollection<T> {
  /** Table from a migration. Never interpolated from caller input. */
  table: string;
  /** Primary key column. */
  idColumn: string;
  /** The row's id for a given item. */
  idOf(item: T): string;
  /** Columns promoted beside `record`, for filtering. */
  columns?: Record<string, (item: T) => string | null>;
}

export interface DurableStore<T> {
  /** Replace the table's contents with `items`. Never throws. */
  mirror(items: T[]): Promise<void>;
  /** Everything durable, or null when there is nothing to restore from. */
  load(): Promise<T[] | null>;
  describe(): string;
}

class NullDurableStore<T> implements DurableStore<T> {
  constructor(private name: string) {}
  async mirror(): Promise<void> {}
  async load(): Promise<T[] | null> { return null; }
  describe(): string { return `none (DB-less — ${this.name} lives only on local disk)`; }
}

class PgDurableStore<T> implements DurableStore<T> {
  constructor(private spec: DurableCollection<T>) {}

  async mirror(items: T[]): Promise<void> {
    const pool = getSharedPool();
    if (!pool) return;
    const client = await pool.connect().catch(() => null);
    if (!client) return;

    const extra = Object.keys(this.spec.columns ?? {});
    const cols = [this.spec.idColumn, ...extra, 'record', 'updated_at'];
    const placeholders = cols.map((_, i) => (cols[i] === 'updated_at' ? 'now()' : `$${i + 1}`));
    const updates = [...extra, 'record'].map((c) => `${c} = EXCLUDED.${c}`).concat('updated_at = now()');

    try {
      await client.query('BEGIN');
      for (const item of items) {
        const values = [
          requireRecordId(this.spec.table, this.spec.idOf(item)),
          ...extra.map((c) => this.spec.columns![c](item)),
          JSON.stringify(item),
        ];
        await client.query(
          `INSERT INTO ${this.spec.table} (${cols.join(', ')})
           VALUES (${placeholders.join(', ')})
           ON CONFLICT (${this.spec.idColumn}) DO UPDATE SET ${updates.join(', ')}`,
          values,
        );
      }
      // A record deleted locally is deleted here, or the next hydration
      // resurrects it.
      const ids = items.map((i) => requireRecordId(this.spec.table, this.spec.idOf(i)));
      await client.query(
        ids.length > 0
          ? `DELETE FROM ${this.spec.table} WHERE NOT (${this.spec.idColumn} = ANY($1::text[]))`
          : `DELETE FROM ${this.spec.table}`,
        ids.length > 0 ? [ids] : [],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      // Non-fatal by design. Submitting feedback must not fail because the
      // mirror is unreachable; the local write already succeeded.
      console.error(`[durable-store:${this.spec.table}] mirror failed (non-fatal):`, (err as Error).message);
    } finally {
      client.release();
    }
  }

  async load(): Promise<T[] | null> {
    const pool = getSharedPool();
    if (!pool) return null;
    try {
      const { rows } = await pool.query(`SELECT record FROM ${this.spec.table}`);
      if (rows.length === 0) return null;
      return rows.map((r: { record: unknown }) =>
        (typeof r.record === 'string' ? JSON.parse(r.record) : r.record) as T,
      );
    } catch (err) {
      console.error(`[durable-store:${this.spec.table}] load failed:`, (err as Error).message);
      return null;
    }
  }

  describe(): string { return `postgres:${this.spec.table}`; }
}

/** Postgres when DATABASE_URL is set, an honest no-op otherwise. */
export function makeDurableStore<T>(spec: DurableCollection<T>): DurableStore<T> {
  return getSharedPool() ? new PgDurableStore<T>(spec) : new NullDurableStore<T>(spec.table);
}

// ---------------------------------------------------------------------------
// Shared-table collections (migration 043)
// ---------------------------------------------------------------------------

/**
 * A collection stored in `durable_records` rather than its own table.
 *
 * For the ~17 flat-file stores holding irreplaceable data. They are all read
 * the same way — load everything for a scope, operate in memory, write back —
 * and none of them queries across records in SQL. See 043 for the reasoning.
 */
export interface SharedCollection<T> {
  /** Discriminator. Must be stable; changing it orphans existing rows. */
  collection: string;
  idOf(item: T): string;
  /** Per-owner key, where the collection has one (a user or student id). */
  scopeOf?(item: T): string | null;
}

export interface SharedStore<T> {
  /** Replace everything in the collection (optionally within one scope). */
  mirror(items: T[], scope?: string): Promise<void>;
  /**
   * Add or update ONE record, touching nothing else.
   *
   * This is why the notebook does not use `mirror`. It logs every chat
   * question, photo, lesson view and attempt, so an engaged student's history
   * grows without bound — and rewriting all of it on each interaction gets
   * slower in exactly the case you most want to work.
   */
  put(item: T): Promise<void>;
  load(scope?: string): Promise<T[] | null>;
  describe(): string;
}

class NullSharedStore<T> implements SharedStore<T> {
  constructor(private name: string) {}
  async mirror(): Promise<void> {}
  async put(): Promise<void> {}
  async load(): Promise<T[] | null> { return null; }
  describe(): string { return `none (DB-less — ${this.name} lives only on local disk)`; }
}

/**
 * `durable_records.id` is NOT NULL, so an `idOf` that returns undefined makes
 * Postgres reject the row — and the error it raises ("null value in column
 * \"id\"") names the column, not the collection whose `idOf` is wrong. The
 * practice-sessions collection mirrored nothing for over a week for exactly
 * this reason: its entry type had no `id` field and its `idOf` read `.id`
 * through an `any`, so every boot logged a Postgres constraint error that
 * pointed at the schema rather than at the one line that was wrong.
 *
 * Checking here turns that into a message that names the collection and what
 * it produced. The mirror still swallows it — a student's write must not fail
 * because the mirror is unhappy — but whoever reads the log can act on it.
 */
export function requireRecordId(collection: string, id: unknown): string {
  if (typeof id === 'string' && id.length > 0) return id;
  throw new Error(
    `idOf() for collection "${collection}" returned ${
      typeof id === 'string' ? 'an empty string' : String(id)
    }; durable_records.id is NOT NULL, so nothing in this collection can mirror until idOf returns a stable non-empty string`,
  );
}

class PgSharedStore<T> implements SharedStore<T> {
  constructor(private spec: SharedCollection<T>) {}

  private row(item: T): [string, string, string | null, string] {
    return [
      this.spec.collection,
      requireRecordId(this.spec.collection, this.spec.idOf(item)),
      this.spec.scopeOf ? this.spec.scopeOf(item) : null,
      JSON.stringify(item),
    ];
  }

  async put(item: T): Promise<void> {
    const pool = getSharedPool();
    if (!pool) return;
    try {
      await pool.query(
        `INSERT INTO durable_records (collection, id, scope, record, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (collection, id) DO UPDATE
           SET scope = EXCLUDED.scope, record = EXCLUDED.record, updated_at = now()`,
        this.row(item),
      );
    } catch (err) {
      console.error(`[durable:${this.spec.collection}] put failed (non-fatal):`, (err as Error).message);
    }
  }

  async mirror(items: T[], scope?: string): Promise<void> {
    const pool = getSharedPool();
    if (!pool) return;
    const client = await pool.connect().catch(() => null);
    if (!client) return;
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          `INSERT INTO durable_records (collection, id, scope, record, updated_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (collection, id) DO UPDATE
             SET scope = EXCLUDED.scope, record = EXCLUDED.record, updated_at = now()`,
          this.row(item),
        );
      }
      // Deletions must propagate, or the next hydration resurrects a record
      // someone removed. Scoped when a scope is given, so mirroring one
      // student cannot wipe another's.
      const ids = items.map((i) => this.spec.idOf(i));
      const where = scope === undefined
        ? 'collection = $1'
        : 'collection = $1 AND scope IS NOT DISTINCT FROM $2';
      const params: unknown[] = scope === undefined ? [this.spec.collection] : [this.spec.collection, scope];
      if (ids.length > 0) {
        params.push(ids);
        await client.query(`DELETE FROM durable_records WHERE ${where} AND NOT (id = ANY($${params.length}::text[]))`, params);
      } else {
        await client.query(`DELETE FROM durable_records WHERE ${where}`, params);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`[durable:${this.spec.collection}] mirror failed (non-fatal):`, (err as Error).message);
    } finally {
      client.release();
    }
  }

  async load(scope?: string): Promise<T[] | null> {
    const pool = getSharedPool();
    if (!pool) return null;
    try {
      const { rows } = scope === undefined
        ? await pool.query('SELECT record FROM durable_records WHERE collection = $1', [this.spec.collection])
        : await pool.query(
            'SELECT record FROM durable_records WHERE collection = $1 AND scope IS NOT DISTINCT FROM $2',
            [this.spec.collection, scope],
          );
      if (rows.length === 0) return null;
      return rows.map((r: { record: unknown }) =>
        (typeof r.record === 'string' ? JSON.parse(r.record) : r.record) as T,
      );
    } catch (err) {
      // Null, not [] — an unreachable database must never read as "empty".
      console.error(`[durable:${this.spec.collection}] load failed:`, (err as Error).message);
      return null;
    }
  }

  describe(): string { return `postgres:durable_records[${this.spec.collection}]`; }
}

export function makeSharedStore<T>(spec: SharedCollection<T>): SharedStore<T> {
  return getSharedPool() ? new PgSharedStore<T>(spec) : new NullSharedStore<T>(spec.collection);
}

/**
 * Restore a local collection from its mirror, but never over live data.
 *
 * Returns what happened rather than a boolean so the boot log can say which
 * of the three outcomes occurred — restored, skipped because local data
 * exists, or skipped because there was nothing durable to read.
 */
export async function hydrateCollection<T>(
  store: DurableStore<T>,
  local: T[],
  writeLocal: (items: T[]) => void,
): Promise<{ hydrated: boolean; count: number; reason: string }> {
  if (local.length > 0) {
    return { hydrated: false, count: local.length, reason: 'local store already has records' };
  }
  const durable = await store.load();
  if (!durable) {
    return { hydrated: false, count: 0, reason: 'no durable records to restore from' };
  }
  if (durable.length === 0) {
    return { hydrated: false, count: 0, reason: 'durable store is empty' };
  }
  writeLocal(durable);
  return { hydrated: true, count: durable.length, reason: 'restored from durable store' };
}
