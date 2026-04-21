// @ts-nocheck
/**
 * Flat-File Store — atomic-write JSON persistence
 *
 * Before v2.9.1: three different modules (content/telemetry.ts,
 * curriculum/quality-aggregator.ts, auth/user-store.ts) each reimplemented
 * atomic tmp+rename writes, mkdir-p of the parent dir, and
 * corruption-tolerant reads. ~60 LOC of duplication per module.
 *
 * After v2.9.1: one generic implementation. The three stores pass their
 * path + default-shape factory, get back read/write helpers.
 *
 * Guarantees:
 *   - Writes are atomic (tmp + rename), safe on POSIX and NTFS
 *   - Parent directory is auto-created
 *   - Corrupt / missing files return the default shape (never throw)
 *   - Node's single-threaded runtime serializes writes — no lock needed
 *     at small scale (<10k users, <100k telemetry events)
 *   - Typed via generic T — callers get full type inference
 */

import fs from 'fs';
import path from 'path';

export interface FlatFileStoreConfig<T> {
  /** Absolute or cwd-relative path for the JSON file */
  path: string;
  /** Factory that returns the default shape for a fresh store */
  defaultShape: () => T;
  /** Optional validator — must return a truthy value for valid data */
  isValid?: (parsed: unknown) => boolean;
}

export interface FlatFileStore<T> {
  /** Read current state (or default if missing / corrupt) */
  read(): T;
  /** Atomic write */
  write(state: T): void;
  /** Update helper — read, mutate via callback, write. Returns the new state. */
  update<R = T>(mutator: (state: T) => R | void): R | T;
  /** Convenience: does the file exist yet? */
  exists(): boolean;
  /** Absolute path (resolved) */
  readonly absPath: string;
}

/**
 * Create a flat-file store. No I/O performed until read() / write() / update().
 */
export function createFlatFileStore<T>(config: FlatFileStoreConfig<T>): FlatFileStore<T> {
  const absPath = path.isAbsolute(config.path)
    ? config.path
    : path.resolve(process.cwd(), config.path);

  function read(): T {
    try {
      if (!fs.existsSync(absPath)) return config.defaultShape();
      const raw = fs.readFileSync(absPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (config.isValid && !config.isValid(parsed)) return config.defaultShape();
      return parsed as T;
    } catch {
      return config.defaultShape();
    }
  }

  function write(state: T): void {
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${absPath}.tmp.${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, absPath); // atomic on POSIX + NTFS
  }

  function update<R = T>(mutator: (state: T) => R | void): R | T {
    const state = read();
    const result = mutator(state);
    write(state);
    return (result as R) ?? state;
  }

  function exists(): boolean {
    return fs.existsSync(absPath);
  }

  return { read, write, update, exists, absPath };
}
