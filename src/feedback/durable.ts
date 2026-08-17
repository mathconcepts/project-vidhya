/**
 * Durable mirror for the feedback store.
 *
 * `src/feedback/store.ts` is flat-file — `.data/feedback.json` — and Render's
 * free tier wipes `.data` when the service sleeps. So a student reporting a
 * wrong answer on Tuesday found their report gone on Wednesday, and the
 * operator inbox that is supposed to act on those reports quietly emptied
 * itself between sessions.
 *
 * Same treatment user accounts got in migration 041: the file stays the
 * synchronous read path, Postgres becomes the durable one, and boot restores
 * the file when the disk has been wiped.
 */

import {
  makeDurableStore,
  hydrateCollection,
  type DurableStore,
} from '../storage/repositories/durable-store-repo';
import type { FeedbackItem, AppliedChange } from './types';

export interface FeedbackStoreShape {
  feedback: FeedbackItem[];
  applied_changes: AppliedChange[];
}

let _items: DurableStore<FeedbackItem> | null = null;
let _changes: DurableStore<AppliedChange> | null = null;

function items(): DurableStore<FeedbackItem> {
  if (!_items) {
    _items = makeDurableStore<FeedbackItem>({
      table: 'feedback_items',
      idColumn: 'id',
      idOf: (i) => i.id,
      // Exactly what listFeedback() filters on. Anything else stays in the
      // record, where adding a field cannot silently drop it.
      columns: {
        exam_id: (i) => i.target?.exam_id ?? null,
        kind: (i) => i.kind ?? null,
        status: (i) => i.status ?? null,
        priority: (i) => (i as { priority?: string }).priority ?? null,
        submitted_by: (i) => i.submitted_by?.user_id ?? null,
      },
    });
  }
  return _items;
}

function changes(): DurableStore<AppliedChange> {
  if (!_changes) {
    _changes = makeDurableStore<AppliedChange>({
      table: 'feedback_applied_changes',
      idColumn: 'id',
      idOf: (c) => (c as { id: string }).id,
      columns: { exam_id: (c) => (c as { exam_id?: string }).exam_id ?? null },
    });
  }
  return _changes;
}

/** Mirror the whole store. Called fire-and-forget on every write. */
export async function mirrorAll(store: FeedbackStoreShape): Promise<void> {
  await Promise.all([
    items().mirror(store.feedback ?? []),
    changes().mirror(store.applied_changes ?? []),
  ]);
}

/**
 * Restore feedback from Postgres when the file is gone.
 *
 * Called once at boot, before routes accept traffic — it cannot be lazy
 * inside a read, because every read here is synchronous and a query is not.
 * Never writes over a file that already has records.
 */
export async function hydrate(
  local: FeedbackStoreShape,
  writeLocal: (s: FeedbackStoreShape) => void,
): Promise<{ hydrated: boolean; count: number; reason: string }> {
  const next: FeedbackStoreShape = {
    feedback: local.feedback ?? [],
    applied_changes: local.applied_changes ?? [],
  };

  const a = await hydrateCollection(items(), next.feedback, (v) => { next.feedback = v; });
  const b = await hydrateCollection(changes(), next.applied_changes, (v) => { next.applied_changes = v; });

  if (a.hydrated || b.hydrated) {
    writeLocal(next);
    return {
      hydrated: true,
      count: next.feedback.length + next.applied_changes.length,
      reason: 'restored from durable store',
    };
  }
  // Both skipped for the same class of reason; report the feedback one, which
  // is the collection an operator actually asks about.
  return { hydrated: false, count: a.count, reason: a.reason };
}

/** Where the records live, for the boot log to state plainly. */
export function describe(): string {
  return items().describe();
}

/** Tests only. */
export function _reset(): void {
  _items = null;
  _changes = null;
}
