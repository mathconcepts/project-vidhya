/**
 * Persistence for the syllabus-bridge framework.
 *
 * Two flat-file stores:
 *   .data/syllabus-bridge-content.json  — generated content units
 *   .data/syllabus-bridge-batches.json  — batch requests + their status/results
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { GeneratedContent, BatchRequest } from './types';

// ----- Generated content store -----

interface ContentStoreShape { items: GeneratedContent[]; }

const _content = createFlatFileStore<ContentStoreShape>({
  path: '.data/syllabus-bridge-content.json',
  defaultShape: () => ({ items: [] }),
});

/**
 * Durable mirror for generated content.
 *
 * `.data` is wiped when Render's free tier puts the service to sleep, so every
 * restart used to discard every unit the bridge had generated — and the model
 * spend that produced them. Same treatment accounts got in migration 041: the
 * file stays the synchronous read path, Postgres is the durable one, and boot
 * restores the file when the disk has been reset.
 *
 * Batch records are deliberately not mirrored. They are transient job state,
 * rewritten on every unit, and a lost in-flight batch is simply re-runnable —
 * unlike the content it produced.
 */
const _durableContent = () =>
  import('../storage/repositories/durable-store-repo').then(({ makeDurableStore }) =>
    makeDurableStore<GeneratedContent>({
      table: 'bridge_generated_content',
      idColumn: 'content_id',
      idOf: (c) => c.content_id,
      columns: {
        mapping_id: (c) => c.mapping_id ?? null,
        unit_id: (c) => c.unit_id ?? null,
        source: (c) => c.source ?? null,
      },
    }),
  );

function mirrorContent(items: GeneratedContent[]): void {
  // Fire-and-forget. Generation must not fail because the mirror is down;
  // the local write has already succeeded.
  void _durableContent()
    .then((store) => store.mirror(items))
    .catch(() => {});
}

export function saveGeneratedContent(item: GeneratedContent): void {
  const next = _content.update(s => {
    // Replace if same content_id already exists (idempotent retries)
    const i = s.items.findIndex(x => x.content_id === item.content_id);
    if (i >= 0) s.items[i] = item; else s.items.push(item);
    return s;
  }) as ContentStoreShape;
  mirrorContent(next?.items ?? _content.read().items);
}

/**
 * Restore generated content when the local file is gone.
 * Called once at boot; never writes over a file that already has records.
 */
export async function hydrateGeneratedContent(): Promise<{
  hydrated: boolean; count: number; reason: string;
}> {
  const [{ hydrateCollection }, store] = await Promise.all([
    import('../storage/repositories/durable-store-repo'),
    _durableContent(),
  ]);
  return hydrateCollection(store, _content.read().items, (items) =>
    _content.write({ items }),
  );
}

export function getGeneratedContent(content_id: string): GeneratedContent | null {
  return _content.read().items.find(c => c.content_id === content_id) ?? null;
}

export function listGeneratedContentForMapping(mapping_id: string): GeneratedContent[] {
  return _content.read().items.filter(c => c.mapping_id === mapping_id);
}

export function listGeneratedContentForUnit(unit_id: string): GeneratedContent[] {
  return _content.read().items.filter(c => c.unit_id === unit_id);
}

// ----- Batch request store -----

interface BatchStoreShape { batches: BatchRequest[]; }

const _batches = createFlatFileStore<BatchStoreShape>({
  path: '.data/syllabus-bridge-batches.json',
  defaultShape: () => ({ batches: [] }),
});

export function saveBatch(batch: BatchRequest): void {
  _batches.update(s => {
    const i = s.batches.findIndex(b => b.batch_id === batch.batch_id);
    if (i >= 0) s.batches[i] = batch; else s.batches.push(batch);
    return s;
  });
}

export function getBatch(batch_id: string): BatchRequest | null {
  return _batches.read().batches.find(b => b.batch_id === batch_id) ?? null;
}

export function listBatches(): BatchRequest[] {
  return _batches.read().batches.slice().sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export function listBatchesForMapping(mapping_id: string): BatchRequest[] {
  return listBatches().filter(b => b.mapping_id === mapping_id);
}
