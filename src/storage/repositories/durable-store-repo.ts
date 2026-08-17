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
          this.spec.idOf(item),
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
      const ids = items.map((i) => this.spec.idOf(i));
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
