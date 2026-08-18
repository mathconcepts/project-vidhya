/**
 * src/readiness/composite-content-checker.ts — T5 (A1): the "content-backed"
 * gate the prereq redirect (content-gate.ts) and the syllabus-aware
 * engine's eligible-set filter both need.
 *
 * `AtomLoaderContentChecker` (atom-content-checker.ts) answers "is there a
 * lesson to teach?" — atoms only. That's necessary but not sufficient: a
 * concept with lesson atoms but zero gradable practice items still starves
 * the practice/retain arms the moment a redirect (or the eligible-set
 * filter) lands the student there. This composite checker requires BOTH:
 *
 *   1. `AtomLoaderContentChecker.hasContent()` — real, non-placeholder atoms.
 *   2. At least one catalog item for the skill — a cheap existence probe
 *      (`LearningObjectCatalog.query({ skillId, limit: 1 })`), not a full
 *      gradability audit (that's `/api/practice/item/:id`'s job).
 *
 * Fail-closed throughout, mirroring atom-content-checker.ts: any error from
 * either dependency is treated as "no content" — a redirect (or an
 * eligible-set decision) must never fire on a guess.
 *
 * Kept beside atom-content-checker.ts (not inside content-gate.ts, which
 * stays fs/DB-free per its own header) — same layering rule, same reason.
 */

import type { ContentExistenceChecker } from './content-gate';
import { AtomLoaderContentChecker } from './atom-content-checker';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';

export interface CompositeContentCheckerDeps {
  catalog: LearningObjectCatalog;
  /** Overridable for tests; defaults to a fresh AtomLoaderContentChecker. */
  atoms?: ContentExistenceChecker;
}

export class CompositeContentChecker implements ContentExistenceChecker {
  private atoms: ContentExistenceChecker;
  private catalog: LearningObjectCatalog;

  constructor(deps: CompositeContentCheckerDeps) {
    this.atoms = deps.atoms ?? new AtomLoaderContentChecker();
    this.catalog = deps.catalog;
  }

  async hasContent(conceptId: string): Promise<boolean> {
    let hasAtoms: boolean;
    try {
      hasAtoms = await this.atoms.hasContent(conceptId);
    } catch {
      hasAtoms = false; // never fabricate — an atom-checker error means "assume no content"
    }
    if (!hasAtoms) return false;

    try {
      const items = await this.catalog.query({ skillId: conceptId, limit: 1 });
      return items.length > 0;
    } catch {
      return false; // never fabricate — a catalog error means "assume no content"
    }
  }
}

let _checker: ContentExistenceChecker | null = null;
let _checkerCatalog: LearningObjectCatalog | null = null;

/**
 * Lazily-constructed singleton, mirroring `getAtomContentChecker()`'s
 * pattern. Rebuilds if the catalog reference changes — guards against a
 * test swap or a future catalog hot-swap leaving a stale checker wired.
 */
export function getCompositeContentChecker(catalog: LearningObjectCatalog): ContentExistenceChecker {
  if (!_checker || _checkerCatalog !== catalog) {
    _checker = new CompositeContentChecker({ catalog });
    _checkerCatalog = catalog;
  }
  return _checker;
}
