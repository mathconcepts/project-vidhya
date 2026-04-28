// @ts-nocheck
/**
 * src/modules/content-library/index.ts
 *
 * Public surface of the content-library module.
 *
 * What this module owns:
 *   - The LibraryEntry schema — runtime-augmentable, DB-free
 *     teaching materials keyed by concept_id
 *   - Two-source persistence:
 *       seed       data/content-library/seed/<id>/{meta.yaml,
 *                  explainer.md, worked-example.md}
 *       additions  .data/content-library-additions.jsonl
 *   - In-memory index built at boot
 *   - Lookup helpers (by concept_id, by filter)
 *   - Add API for runtime additions (admin / LLM)
 *
 * What this module does NOT own:
 *   - Content routing (still in content/router)
 *   - Content rendering (still in rendering)
 *   - Student model / personalisation logic (still in gbrain)
 *   - Decision-making over which content to serve (still in
 *     gbrain/task-reasoner)
 *
 * GBrain consults this module via the resolver — see commit 3 of
 * the content-library trio. This module is intentionally a passive
 * data store; the cognitive layer stays cleanly separated.
 *
 * See LIBRARY.md for the contract, the seed format, and the
 * extensibility model.
 */

export type {
  LibraryEntry,
  LibrarySummary,
  LibraryDifficulty,
  LibrarySource,
  FindEntriesOptions,
  AddEntryRequest,
} from '../../content-library/types';

export {
  getEntry,
  findEntries,
  listSummaries,
  masteryToDifficulty,
  addEntry,
  getStats,
  reloadIndex,
} from '../../content-library/store';
