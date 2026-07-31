/**
 * src/readiness/atom-content-checker.ts — concrete `ContentExistenceChecker`
 * (see src/readiness/content-gate.ts) backed by the real content module.
 *
 * Kept separate from content-gate.ts so that file stays fs/DB-free and
 * trivially unit-testable; this file is the thin, fail-closed wiring
 * adapter production code uses.
 *
 * "Real content" here means: `loadConceptAtoms()` resolves (doesn't
 * throw `ConceptNotFoundError`) AND returns at least one atom with
 * non-empty body text. An empty/whitespace-only atom is treated as no
 * content — never fabricate that a door is open when it's actually a
 * blank room.
 */

import { loadConceptAtoms, ConceptNotFoundError } from '../content/atom-loader';
import type { ContentExistenceChecker } from './content-gate';

export class AtomLoaderContentChecker implements ContentExistenceChecker {
  async hasContent(conceptId: string): Promise<boolean> {
    try {
      const atoms = await loadConceptAtoms(conceptId);
      return atoms.some((a) => typeof a.content === 'string' && a.content.trim().length > 0);
    } catch (err) {
      if (err instanceof ConceptNotFoundError) return false;
      // Any other failure (fs error, malformed frontmatter on every atom,
      // etc.) — fail closed. A redirect must never fire on a guess.
      return false;
    }
  }
}

let _checker: ContentExistenceChecker | null = null;

/** Lazily-constructed singleton — mirrors the `get*()` accessor pattern used elsewhere in src/readiness and src/scoring. */
export function getAtomContentChecker(): ContentExistenceChecker {
  if (!_checker) _checker = new AtomLoaderContentChecker();
  return _checker;
}
