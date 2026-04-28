// @ts-nocheck
/**
 * src/content-library/store.ts
 *
 * Two-source content store:
 *
 *   SEED       data/content-library/seed/<concept_id>/
 *              Each subdir contains:
 *                meta.yaml        — concept metadata
 *                explainer.md     — main explainer text
 *                worked-example.md (optional)
 *              Read once at boot.
 *
 *   ADDITIONS  .data/content-library-additions.jsonl
 *              Append-only log of LibraryEntry records.
 *              Read once at boot. Re-read on demand if the caller
 *              reloads the store (testing).
 *
 * The store builds an in-memory Map<concept_id, LibraryEntry> at
 * boot. The merge rule: additions override seeds for the same
 * concept_id. Within additions, last write wins (the JSONL log is
 * append-only but the index keeps the latest record per concept).
 *
 * Why "last write wins" and not "earliest wins" like the teaching
 * turn store: the turn log is an audit trail (immutable history of
 * events). The library is a mutable knowledge base where new entries
 * for the same concept are *intended* to supersede old ones.
 *
 * Concurrency: Node single-thread serialises writes. A real
 * multi-process deployment would need a different mechanism. Same
 * caveat as flat-file-store; documented in DESIGN.md.
 */

import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { createAppendLog } from '../lib/append-log';
import type {
  LibraryEntry,
  LibrarySummary,
  FindEntriesOptions,
  AddEntryRequest,
  LibraryDifficulty,
} from './types';

const SEED_DIR = 'data/content-library/seed';
const ADDITIONS_PATH = '.data/content-library-additions.jsonl';

// ─── In-memory index ──────────────────────────────────────────────────

let _index: Map<string, LibraryEntry> | null = null;

const additions_log = createAppendLog<LibraryEntry>({
  path: ADDITIONS_PATH,
  isValid: (parsed: any) =>
    parsed && typeof parsed === 'object'
      && typeof parsed.concept_id === 'string'
      && typeof parsed.explainer_md === 'string',
});

/**
 * Walk SEED_DIR, parse each <concept_id>/{meta.yaml, explainer.md,
 * worked-example.md} triple, and return the resulting entries.
 *
 * Skips silently on any per-concept error — a malformed seed entry
 * shouldn't keep the rest from loading. Logs the error so it's
 * still visible.
 */
function loadSeedEntries(): LibraryEntry[] {
  const seed_dir = path.resolve(process.cwd(), SEED_DIR);
  if (!fs.existsSync(seed_dir)) return [];

  const entries: LibraryEntry[] = [];
  let dirs: string[];
  try {
    dirs = fs.readdirSync(seed_dir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch (e: any) {
    console.error(`[content-library] failed to scan seed dir: ${e?.message}`);
    return [];
  }

  for (const concept_id of dirs) {
    const concept_dir = path.join(seed_dir, concept_id);
    try {
      const meta_path = path.join(concept_dir, 'meta.yaml');
      const explainer_path = path.join(concept_dir, 'explainer.md');
      const worked_path = path.join(concept_dir, 'worked-example.md');

      if (!fs.existsSync(meta_path) || !fs.existsSync(explainer_path)) {
        console.error(`[content-library] seed ${concept_id}: meta.yaml or explainer.md missing — skipped`);
        continue;
      }
      const meta: any = parseYaml(fs.readFileSync(meta_path, 'utf-8'));
      if (!meta?.concept_id || meta.concept_id !== concept_id) {
        console.error(`[content-library] seed ${concept_id}: meta.yaml concept_id mismatch — skipped`);
        continue;
      }

      const explainer_md = fs.readFileSync(explainer_path, 'utf-8');
      const worked_example_md = fs.existsSync(worked_path)
        ? fs.readFileSync(worked_path, 'utf-8')
        : undefined;

      const entry: LibraryEntry = {
        concept_id: meta.concept_id,
        title: meta.title ?? concept_id,
        difficulty: normaliseDifficulty(meta.difficulty),
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        exams: Array.isArray(meta.exams) ? meta.exams : [],
        prereqs: Array.isArray(meta.prereqs) ? meta.prereqs : undefined,
        explainer_md,
        worked_example_md,
        source: 'seed',
        added_at: meta.reviewed_at
          ? new Date(meta.reviewed_at).toISOString()
          : new Date(0).toISOString(),
        added_by: meta.contributor ?? 'system',
        licence: meta.licence ?? 'shipped-default',
        wolfram_checkable: !!meta.wolfram_checkable,
      };
      entries.push(entry);
    } catch (e: any) {
      console.error(`[content-library] seed ${concept_id}: ${e?.message} — skipped`);
    }
  }
  return entries;
}

/**
 * The community-content meta.yaml schema uses 'intermediate' but a
 * fresh-eyes reader might also write 'standard'. Accept both;
 * canonicalise to 'intermediate' to match what's in the data today.
 */
function normaliseDifficulty(raw: any): LibraryDifficulty {
  if (raw === 'intro' || raw === 'beginner') return 'intro';
  if (raw === 'advanced' || raw === 'expert' || raw === 'hard') return 'advanced';
  return 'intermediate';   // default, including 'standard', 'medium', and undefined
}

/**
 * Build the in-memory index. Idempotent — safe to call on every
 * lookup; cached after first call.
 */
function getIndex(): Map<string, LibraryEntry> {
  if (_index) return _index;
  const idx = new Map<string, LibraryEntry>();

  // Layer 1: seed
  for (const e of loadSeedEntries()) idx.set(e.concept_id, e);

  // Layer 2: additions (override seeds; later additions override earlier)
  for (const e of additions_log.readAll()) idx.set(e.concept_id, e);

  _index = idx;
  return idx;
}

/**
 * Force a re-read on the next lookup. Used after add() and in tests.
 * Cheap — just clears the cache; the next lookup rebuilds the index.
 */
export function reloadIndex(): void {
  _index = null;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Get a single entry by concept_id. Returns null if not in the library.
 */
export function getEntry(concept_id: string): LibraryEntry | null {
  return getIndex().get(concept_id) ?? null;
}

/**
 * Find entries matching optional filters. Sorted by:
 *   1. Exact difficulty match (if prefer_difficulty given) wins
 *   2. Exam-relevance (if exam_id given) wins as tiebreak
 *   3. Title alphabetical
 *
 * Returns ALL entries when no filters. Use the list endpoint for
 * paginated full-list views; this returns the full set in memory.
 */
export function findEntries(opts: FindEntriesOptions = {}): LibraryEntry[] {
  const all = Array.from(getIndex().values());

  let candidates = all;
  if (opts.tags && opts.tags.length > 0) {
    const required = new Set(opts.tags);
    candidates = candidates.filter(e =>
      [...required].every(t => e.tags.includes(t)),
    );
  }
  if (opts.exam_id) {
    // Don't EXCLUDE non-matching entries — exam_id is a preference,
    // not a filter. We want to fall back to exam-agnostic entries
    // if no exam-specific match exists. Apply the exam preference
    // in the ranker below.
  }

  // Rank
  const score = (e: LibraryEntry): number => {
    let s = 0;
    if (opts.prefer_difficulty && e.difficulty === opts.prefer_difficulty) s += 100;
    if (opts.exam_id && e.exams.includes(opts.exam_id)) s += 10;
    return s;
  };
  candidates.sort((a, b) => {
    const sa = score(a), sb = score(b);
    if (sa !== sb) return sb - sa;
    return a.title.localeCompare(b.title);
  });
  return candidates;
}

/**
 * Concept summaries for list views. Lightweight — no markdown bodies.
 */
export function listSummaries(): LibrarySummary[] {
  return Array.from(getIndex().values())
    .map(e => ({
      concept_id: e.concept_id,
      title: e.title,
      difficulty: e.difficulty,
      source: e.source,
      tags: e.tags,
      exams: e.exams,
      has_worked_example: !!e.worked_example_md,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Compute the difficulty band a student is at for a given concept,
 * given their mastery score in [0, 1]. Used by callers that want
 * personalised pickin without thinking about the band thresholds.
 *
 * Bands match the LibraryDifficulty values in the seed data.
 * Thresholds are pedagogical heuristics, not measured — feel free
 * to tune. Documented thresholds in TEACHING.md.
 */
export function masteryToDifficulty(mastery: number): LibraryDifficulty {
  if (mastery < 0.3) return 'intro';
  if (mastery < 0.7) return 'intermediate';
  return 'advanced';
}

/**
 * Add a new entry to the library. Appends to the JSONL log AND
 * updates the in-memory index. Returns the persisted entry (with
 * `source` and `added_at` filled in by the store).
 *
 * Validation: concept_id, title, explainer_md, added_by are required.
 * Empty / whitespace-only values throw. Difficulty defaults to
 * 'intermediate' if absent; tags and exams default to empty arrays.
 *
 * Persistence happens atomically (one append). Index update happens
 * AFTER the append succeeds, so a crash between append and index
 * update means the entry is on disk and will be picked up on next
 * boot — no data loss, just a one-request lag.
 */
export function addEntry(req: AddEntryRequest): LibraryEntry {
  const concept_id = (req.concept_id ?? '').trim();
  const title = (req.title ?? '').trim();
  const explainer_md = req.explainer_md ?? '';
  const added_by = (req.added_by ?? '').trim();

  if (!concept_id) throw new Error('concept_id is required');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(concept_id)) {
    throw new Error('concept_id must be lowercase kebab-case (a-z, 0-9, -)');
  }
  if (!title) throw new Error('title is required');
  if (!explainer_md.trim()) throw new Error('explainer_md is required');
  if (!added_by) throw new Error('added_by is required');
  if (req.source !== 'user' && req.source !== 'llm') {
    throw new Error("source must be 'user' or 'llm' ('seed' is reserved)");
  }

  const entry: LibraryEntry = {
    concept_id,
    title,
    difficulty: normaliseDifficulty(req.difficulty),
    tags: Array.isArray(req.tags) ? req.tags : [],
    exams: Array.isArray(req.exams) ? req.exams : [],
    prereqs: Array.isArray(req.prereqs) ? req.prereqs : undefined,
    explainer_md,
    worked_example_md: req.worked_example_md,
    source: req.source,
    added_at: new Date().toISOString(),
    added_by,
    licence: req.licence ?? 'user-contributed',
    wolfram_checkable: !!req.wolfram_checkable,
  };

  additions_log.append(entry);
  // Update in-memory index in place — newer override existing.
  getIndex().set(entry.concept_id, entry);
  return entry;
}

/**
 * Total entry count, broken down by source.
 */
export function getStats(): {
  total: number;
  by_source: Record<string, number>;
} {
  const by_source: Record<string, number> = { seed: 0, user: 0, llm: 0 };
  for (const e of getIndex().values()) {
    by_source[e.source] = (by_source[e.source] ?? 0) + 1;
  }
  return {
    total: getIndex().size,
    by_source,
  };
}

/**
 * Test helper. Clears the in-memory index AND truncates the additions
 * log. Seeds remain untouched on disk.
 */
export function _resetForTests(): void {
  _index = null;
  additions_log.truncate();
}
