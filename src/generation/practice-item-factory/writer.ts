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
 * Merge incoming items into existing ones. On an id collision the
 * INCOMING item wins (the factory's re-run supersedes the stored row —
 * same "newer generation wins" rule T21 applies to the pg/file catalog
 * collision, kept consistent here). Stable id-sort makes re-running with
 * an unchanged item set produce byte-identical output.
 */
export function mergeItems(
  existing: ReadonlyArray<AuthoredItem>,
  incoming: ReadonlyArray<AuthoredItem>,
): AuthoredItem[] {
  const byId = new Map<string, AuthoredItem>();
  for (const item of existing) byId.set(item.id, item);
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Merge `items` into the bank at `filePath` and write atomically
 * (temp-file + rename, mirroring wolfram-verify-job.ts's saveBundle).
 * `comment`, if supplied, replaces the file's `_comment`; otherwise the
 * existing bank's comment (if any) is preserved untouched.
 */
export function writePracticeItemBank(
  filePath: string,
  items: ReadonlyArray<AuthoredItem>,
  comment?: string[],
): void {
  const existingBank = loadBank(filePath);
  const merged = mergeItems(existingBank.items, items);
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
