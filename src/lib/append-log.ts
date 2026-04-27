// @ts-nocheck
/**
 * src/lib/append-log.ts — JSONL append-only log
 *
 * Companion to flat-file-store. Where flat-file-store is for shapes
 * that get fully rewritten (e.g. users.json, exam-profiles.json),
 * this is for append-only event-style data where:
 *
 *   - Records are immutable once written
 *   - Order matters (later records describe what happened later)
 *   - Per-record reads are rare; per-prefix scans are common
 *     (e.g. "give me all turns for student X")
 *   - Volume can grow indefinitely
 *
 * Format: one JSON object per line (JSONL). Each line stands alone —
 * if a write is interrupted mid-line, only the trailing partial line
 * is corrupt, and `readAll()` skips it cleanly.
 *
 * Concurrency: Node's single-threaded runtime serialises appends
 * through the event loop. fs.appendFileSync is atomic enough for
 * our scale (≤ a few hundred turns/sec). For a multi-process
 * deployment, this would need a real lock — not relevant today.
 *
 * Reads: linear scan of the whole file. Acceptable up to ~100k
 * records per file. Beyond that, consider rotating logs by month.
 *
 * NOT used for: anything that needs random-access read or
 * mutation. That's flat-file-store territory.
 */

import fs from 'fs';
import path from 'path';

export interface AppendLogConfig<T> {
  /** Path to the .jsonl file. Parent dir auto-created. */
  path: string;
  /** Optional validator on read — invalid lines are skipped, not thrown. */
  isValid?: (parsed: unknown) => boolean;
}

export interface AppendLog<T> {
  /** Append one record. Synchronous — atomic on POSIX. */
  append(record: T): void;
  /** Read all records. Skips corrupt lines silently. */
  readAll(): T[];
  /** Read records matching a predicate. Linear scan. */
  filter(predicate: (record: T) => boolean): T[];
  /** Count records (still linear; cached if needed externally). */
  count(): number;
  /** Truncate the log. Mostly for tests. */
  truncate(): void;
}

export function createAppendLog<T>(config: AppendLogConfig<T>): AppendLog<T> {
  const { path: filePath, isValid } = config;
  const dir = path.dirname(filePath);

  function ensureDir(): void {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function append(record: T): void {
    ensureDir();
    fs.appendFileSync(filePath, JSON.stringify(record) + '\n');
  }

  function readAll(): T[] {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw) return [];
    const out: T[] = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (!isValid || isValid(parsed)) out.push(parsed as T);
      } catch {
        // Skip corrupt / partial lines silently — append-only logs
        // are write-once and the most likely cause of a parse failure
        // is an interrupted write at the tail.
      }
    }
    return out;
  }

  function filter(predicate: (record: T) => boolean): T[] {
    return readAll().filter(predicate);
  }

  function count(): number {
    return readAll().length;
  }

  function truncate(): void {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  return { append, readAll, filter, count, truncate };
}
