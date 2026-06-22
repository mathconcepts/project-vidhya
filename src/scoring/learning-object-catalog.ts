/**
 * src/scoring/learning-object-catalog.ts — read side for ItemSelector.
 *
 * The blueprint's `LearningObject` is a typed atom of teachable content
 * (story / manim / interactive / worked_example / practice). The catalog
 * is what an ItemSelector queries to find candidates that match a
 * skill + difficulty band + time budget.
 *
 * Why a separate interface and not a concrete DB query in the selector?
 *   - The catalog can be backed by different stores: `generated_problems`,
 *     `atom_versions`, a flat-file fixture for tests, or a future
 *     content-bundle store. Selector logic stays pure.
 *   - Tests of the selector don't need a database — they hand it an
 *     InMemoryCatalog with known items.
 *   - Future Phase 4 swaps (IRT-calibrated catalog with `discrimination`
 *     and `guessing` parameters) drop in behind this seam.
 */

import type { LearningObject, ObjectType, SkillId } from '../core/interfaces';

export interface CatalogQuery {
  skillId: SkillId;
  /** Restrict to certain object types. Empty = all types. */
  types?: ReadonlyArray<ObjectType>;
  /** Hard difficulty bounds (Elo scale). */
  diffMin?: number;
  diffMax?: number;
  /** Soft cap on returned objects. Default 50. */
  limit?: number;
}

export interface LearningObjectCatalog {
  /**
   * Return candidate objects matching the query, sorted by difficulty
   * ASC. The selector applies success-band filtering on top.
   */
  query(q: CatalogQuery): Promise<LearningObject[]>;

  /**
   * Optional: how often this object has been served in the recent
   * exposure window. Selectors use this for exposure control so popular
   * items don't over-serve and leak. Catalogs that can't track exposure
   * may return 0 — the selector's bandit logic still works, it just
   * loses the over-exposure penalty.
   */
  exposureCount?(objectId: string): Promise<number>;
}

// ────────────────────────────────────────────────────────────────────
// In-memory implementation (tests + dev)
// ────────────────────────────────────────────────────────────────────

export class InMemoryCatalog implements LearningObjectCatalog {
  private exposures = new Map<string, number>();

  constructor(private objects: ReadonlyArray<LearningObject>) {}

  async query(q: CatalogQuery): Promise<LearningObject[]> {
    const limit = Math.max(1, Math.min(500, q.limit ?? 50));
    return this.objects
      .filter(o => {
        // Catalog rows in this in-memory impl carry a `skillId` property
        // on payload for tests; production catalogs map skill via the
        // node graph.
        const objSkill = (o.payload as any)?.skillId ?? o.nodeId;
        if (objSkill !== q.skillId) return false;
        if (q.types && q.types.length > 0 && !q.types.includes(o.type)) return false;
        if (q.diffMin !== undefined && o.difficulty < q.diffMin) return false;
        if (q.diffMax !== undefined && o.difficulty > q.diffMax) return false;
        return true;
      })
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, limit);
  }

  async exposureCount(objectId: string): Promise<number> {
    return this.exposures.get(objectId) ?? 0;
  }

  /** Test helper. Increments the exposure counter; not part of the contract. */
  bumpExposure(objectId: string): void {
    this.exposures.set(objectId, (this.exposures.get(objectId) ?? 0) + 1);
  }
}
