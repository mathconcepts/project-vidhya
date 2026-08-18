/**
 * src/scoring/learning-object-catalog-composite.ts — T21 (outside-voice
 * amendment 1, docs/designs/linear-algebra-realtime-and-math-academy-plan.md
 * "Outside-voice amendments" §1): a composite of the file catalog and the
 * Pg catalog so authored items in `data/practice-items/` stay servable on
 * every deploy shape, including the D4 posture of setting DATABASE_URL on
 * the demo deploy.
 *
 * `getLearningObjectCatalog()` used to be strictly XOR on DATABASE_URL:
 * with a database configured, `PgLearningObjectCatalog` was the whole
 * catalog and the file items became permanently invisible — nothing seeds
 * `data/practice-items/*.json` into `generated_problems`, so a deployment
 * with DATABASE_URL set had the committed items on disk but no path to
 * serve them. This composes both sources instead:
 *
 *   - `query()` merges results from both, de-duplicated by id. On an id
 *     collision the DB row wins — `generated_problems` is the mutable,
 *     growing source of truth; an authored file item happening to share
 *     an id with a generated row is the exceptional case, and the DB row
 *     is presumed newer / operator-curated.
 *   - `getById()` tries the Pg catalog first (same collision rule — a
 *     lookup can only serve ONE of the two), falling back to the file
 *     catalog.
 *   - `exposureCount()` is Pg-only signal (files aren't exposure-tracked);
 *     a file-only id, or one Pg has never served, honestly reports 0
 *     rather than guessing — matches what `PgLearningObjectCatalog`
 *     already returns for an unknown id, so this needs no special-casing.
 *
 * Each source's `verification` label is preserved exactly as it comes off
 * that catalog — this composite never blurs `human_verified` into
 * `cas_passed` or vice versa; see the receipt-law comments on both
 * underlying catalogs.
 */

import type { LearningObject } from '../core/interfaces';
import type { CatalogQuery, LearningObjectCatalog } from './learning-object-catalog';

export class CompositeLearningObjectCatalog implements LearningObjectCatalog {
  constructor(
    private readonly fileCatalog: LearningObjectCatalog,
    private readonly pgCatalog: LearningObjectCatalog,
  ) {}

  async query(q: CatalogQuery): Promise<LearningObject[]> {
    const [fileItems, pgItems] = await Promise.all([
      this.fileCatalog.query(q),
      this.pgCatalog.query(q),
    ]);

    const byId = new Map<string, LearningObject>();
    for (const item of fileItems) byId.set(item.id, item);
    // DB wins on id collision (see file header) — applied by inserting
    // pg items second so they overwrite any same-id file entry.
    for (const item of pgItems) byId.set(item.id, item);

    const limit = Math.max(1, Math.min(500, q.limit ?? 50));
    return [...byId.values()]
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, limit);
  }

  async getById(objectId: string): Promise<LearningObject | null> {
    // Pg first: on a collision the DB row is the one served (see file
    // header) — getById has no "merge", only one of the two can answer.
    const fromPg = await this.pgCatalog.getById?.(objectId);
    if (fromPg) return fromPg;
    return (await this.fileCatalog.getById?.(objectId)) ?? null;
  }

  async exposureCount(objectId: string): Promise<number> {
    // Exposure is Pg-only tracked. An id Pg has never seen (file-only, or
    // simply unserved) already resolves to 0 through PgLearningObjectCatalog
    // itself — no extra branching needed here.
    return (await this.pgCatalog.exposureCount?.(objectId)) ?? 0;
  }
}
