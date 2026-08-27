/**
 * src/generation/practice-item-factory/writer.ts — idempotent merge-by-id
 * writer into `data/practice-items/<exam>-<topic>.json`, matching the
 * `{version, items}` shape of the existing authored bank exactly (see
 * data/practice-items/gate-ma-linear-algebra.json).
 *
 * "Idempotent" here means: writing the SAME items twice produces
 * byte-identical output (stable id-sorted ordering), and writing an item
 * whose id already exists REPLACES that entry rather than duplicating it
 * — a re-run of the factory over the same spec supersedes the old row
 * instead of piling up near-duplicates.
 *
 * D5 guard: that "incoming wins" rule stops at a VERIFIED item. If an id
 * already on disk carries a set `verification_method` and the incoming
 * item would actually change its content, the write is refused — a
 * generated re-run must never silently clobber a hand-verified (or
 * previously verified) row just because its deterministic id happens to
 * collide. Re-writing the identical item (byte-for-byte) stays a no-op,
 * preserving the idempotency guarantee above; pass `{ supersede: true }`
 * to overwrite deliberately.
 */

import fs from 'fs';
import path from 'path';
import type { AuthoredItem } from '../../scoring/learning-object-catalog-file';

export interface PracticeItemBankFile {
  version: number;
  _comment?: string[];
  items: AuthoredItem[];
}

const DEFAULT_ITEMS_DIR = path.join(process.cwd(), 'data', 'practice-items');

/** `data/practice-items/<exam>-<topic>.json` — matches the shipped naming (gate-ma-linear-algebra.json). */
export function practiceItemBankPath(examId: string, topic: string, dirOverride?: string): string {
  return path.join(dirOverride ?? DEFAULT_ITEMS_DIR, `${examId}-${topic}.json`);
}

/** Loads a bank file, or an empty one if it doesn't exist yet. Never throws on a missing file. */
export function loadBank(filePath: string): PracticeItemBankFile {
  if (!fs.existsSync(filePath)) return { version: 1, items: [] };
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Partial<PracticeItemBankFile>;
  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    ...(raw._comment ? { _comment: raw._comment } : {}),
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}

/**
 * Thrown by `mergeItems`/`writePracticeItemBank` when an incoming item
 * would overwrite an existing item that carries a set `verification_method`
 * with genuinely different content, and `supersede` was not passed (D5).
 */
export class PracticeItemOverwriteRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PracticeItemOverwriteRefusedError';
  }
}

export interface MergeOptions {
  /**
   * Deliberately permit overwriting an existing verified item by id.
   * Mirrors a `--supersede` CLI flag for any future command-line wrapper
   * of this writer (none exists today, so the function param is the only
   * knob) — default false, i.e. refuse.
   */
  supersede?: boolean;
}

/** Deep content equality — used to let a byte-identical re-write through even for a verified item. */
function sameContent(a: AuthoredItem, b: AuthoredItem): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Merge incoming items into existing ones. On an id collision the
 * INCOMING item wins (the factory's re-run supersedes the stored row —
 * same "newer generation wins" rule T21 applies to the pg/file catalog
 * collision, kept consistent here) — UNLESS the existing item carries a
 * set `verification_method` and the incoming item's content actually
 * differs, in which case the merge refuses by throwing
 * `PracticeItemOverwriteRefusedError` (D5) rather than clobbering verified
 * content. Pass `{ supersede: true }` to override deliberately. Stable
 * id-sort makes re-running with an unchanged item set produce
 * byte-identical output.
 */
export function mergeItems(
  existing: ReadonlyArray<AuthoredItem>,
  incoming: ReadonlyArray<AuthoredItem>,
  options: MergeOptions = {},
): AuthoredItem[] {
  const byId = new Map<string, AuthoredItem>();
  for (const item of existing) byId.set(item.id, item);
  for (const item of incoming) {
    const current = byId.get(item.id);
    if (current?.verification_method && !options.supersede && !sameContent(current, item)) {
      throw new PracticeItemOverwriteRefusedError(
        `refusing to overwrite '${item.id}': verification_method='${current.verification_method}' — ` +
          'pass --supersede (or supersede: true) to override',
      );
    }
    byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Merge `items` into the bank at `filePath` and write atomically
 * (temp-file + rename, mirroring wolfram-verify-job.ts's saveBundle).
 * `comment`, if supplied, replaces the file's `_comment`; otherwise the
 * existing bank's comment (if any) is preserved untouched.
 *
 * `options.supersede` (D5) threads through to `mergeItems` — omit it (the
 * default) to have the write refuse rather than clobber a verified item by
 * id; pass `{ supersede: true }` to override deliberately.
 */
export function writePracticeItemBank(
  filePath: string,
  items: ReadonlyArray<AuthoredItem>,
  comment?: string[],
  options?: MergeOptions,
): void {
  const existingBank = loadBank(filePath);
  const merged = mergeItems(existingBank.items, items, options);
  const finalComment = comment ?? existingBank._comment;
  const out: PracticeItemBankFile = {
    version: existingBank.version,
    ...(finalComment ? { _comment: finalComment } : {}),
    items: merged,
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + '\n');
  fs.renameSync(tmp, filePath);
}
