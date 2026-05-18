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

export function saveGeneratedContent(item: GeneratedContent): void {
  _content.update(s => {
    // Replace if same content_id already exists (idempotent retries)
    const i = s.items.findIndex(x => x.content_id === item.content_id);
    if (i >= 0) s.items[i] = item; else s.items.push(item);
    return s;
  });
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
