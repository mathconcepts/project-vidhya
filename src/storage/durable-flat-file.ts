/**
 * Making a flat-file store durable, in four lines.
 *
 * The audit found ~17 stores holding data nobody can recompute — a student's
 * notebook, their review schedules, their mastery trajectory, teacher work,
 * admin-authored exams — all in files that Render's free tier wipes when the
 * service sleeps. Wiring each one by hand, the way accounts and feedback were
 * wired, is the same forty lines seventeen times.
 *
 * So this is that shape as a helper:
 *
 *     const durable = durableCollection({
 *       collection: 'retention-items',
 *       idOf: (i) => `${i.student_id}:${i.concept_id}`,
 *       scopeOf: (i) => i.student_id,
 *       readLocal: () => _store.read().items,
 *       writeLocal: (items) => _store.write({ items }),
 *     });
 *
 * Then `durable.mirror()` after a write, and `durable.hydrate()` at boot.
 *
 * The three rules from 041 hold for every collection and are enforced here
 * rather than re-argued each time:
 *
 *   1. Mirroring is fire-and-forget. A student's action must not fail because
 *      the mirror is unreachable; the local write already succeeded.
 *   2. Hydration never writes over a populated local store. The file is live
 *      state, the mirror may be stale, and restoring on top of it would
 *      delete real records — worse than the loss being fixed.
 *   3. A failed read returns null, never an empty list, so an unreachable
 *      database cannot be mistaken for "there is nothing here".
 */

import { makeSharedStore, type SharedStore } from './repositories/durable-store-repo';

export interface DurableCollectionConfig<T> {
  /** Stable discriminator in `durable_records`. Changing it orphans rows. */
  collection: string;
  idOf(item: T): string;
  /** Per-owner key, where one exists. Lets a scope be mirrored in isolation. */
  scopeOf?(item: T): string | null;
  /** Current local contents. */
  readLocal(): T[];
  /** Replace local contents. Called only by hydrate, only when local is empty. */
  writeLocal(items: T[]): void;
}

export interface DurableCollectionHandle<T> {
  /** Mirror the whole collection. Fire-and-forget; never throws. */
  mirror(): void;
  /**
   * Mirror one owner's records, leaving every other owner's alone.
   *
   * For collections where a write touches one student but the file holds the
   * whole cohort — a trajectory point, a notebook entry. Deletions still
   * propagate, but only within the scope, so mirroring one student can never
   * wipe another's history.
   */
  mirrorScope(scope: string, items: T[]): void;
  /** Mirror one record without touching the rest. For high-churn collections. */
  put(item: T): void;
  /** Restore from the mirror when local is empty. Safe to call at every boot. */
  hydrate(): Promise<{ hydrated: boolean; count: number; reason: string }>;
  /** Where the records live, for the boot log to state plainly. */
  describe(): string;
  /** Escape hatch for scoped operations. */
  store(): SharedStore<T>;
}

export function durableCollection<T>(cfg: DurableCollectionConfig<T>): DurableCollectionHandle<T> {
  let _s: SharedStore<T> | null = null;
  const store = () => (_s ??= makeSharedStore<T>({
    collection: cfg.collection,
    idOf: cfg.idOf,
    scopeOf: cfg.scopeOf,
  }));

  return {
    store,
    describe: () => store().describe(),

    mirror(): void {
      void Promise.resolve()
        .then(() => store().mirror(cfg.readLocal()))
        .catch(() => {});
    },

    mirrorScope(scope: string, items: T[]): void {
      void Promise.resolve()
        .then(() => store().mirror(items, scope))
        .catch(() => {});
    },

    put(item: T): void {
      void Promise.resolve()
        .then(() => store().put(item))
        .catch(() => {});
    },

    async hydrate() {
      const local = cfg.readLocal();
      if (local.length > 0) {
        return { hydrated: false, count: local.length, reason: 'local store already has records' };
      }
      const durable = await store().load();
      if (!durable) {
        return { hydrated: false, count: 0, reason: 'no durable records to restore from' };
      }
      if (durable.length === 0) {
        return { hydrated: false, count: 0, reason: 'durable store is empty' };
      }
      cfg.writeLocal(durable);
      return { hydrated: true, count: durable.length, reason: 'restored from durable store' };
    },
  };
}

/**
 * Every collection wired through this helper, so boot can restore them all
 * without server.ts needing to know each one by name.
 *
 * Registration happens at module load of the store that owns the collection,
 * which is why `hydrateAll` imports them explicitly rather than relying on
 * something else having touched them first.
 */
const _registry = new Map<string, DurableCollectionHandle<unknown>>();

export function registerDurable<T>(
  name: string,
  handle: DurableCollectionHandle<T>,
): DurableCollectionHandle<T> {
  _registry.set(name, handle as DurableCollectionHandle<unknown>);
  return handle;
}

export function registeredDurableNames(): string[] {
  return [..._registry.keys()].sort();
}

/**
 * Restore every registered collection. Each is independent — one failing must
 * not skip the rest, which is why this reports per-collection rather than
 * throwing on the first problem.
 */
export async function hydrateAllDurable(): Promise<
  Array<{ name: string; hydrated: boolean; count: number; reason: string }>
> {
  const out: Array<{ name: string; hydrated: boolean; count: number; reason: string }> = [];
  for (const [name, handle] of _registry) {
    try {
      out.push({ name, ...(await handle.hydrate()) });
    } catch (err) {
      out.push({ name, hydrated: false, count: 0, reason: `error: ${(err as Error).message}` });
    }
  }
  return out;
}

/** Tests only. */
export function _clearDurableRegistry(): void {
  _registry.clear();
}
