/**
 * CadenceStrategy — extension contract for knowledge-vs-exam-prep cadence.
 *
 * The router calls a CadenceStrategy as a post-filter once primary content has
 * been resolved. The strategy reorders or trims results based on the student's
 * session mode and exam proximity.
 *
 * Adding a new CadenceStrategy:
 *   1. Create src/content/cadence-<name>.ts that exports a default instance.
 *   2. Register it in src/content/cadence-strategies.ts (the active map).
 *   3. Write a test that runs `runCadenceStrategyContract(yourStrategy)` and passes.
 *
 * See EXTENDING.md.
 */

import type { SessionMode } from './content-types';

export type { SessionMode };

/** A single content item that a CadenceStrategy can reorder, weight, or drop. */
export interface CadenceItem {
  /** Stable id (concept_id or content id). */
  id: string;
  /** Difficulty tier — used by CadenceStrategy to weight per session mode. */
  difficulty?: 'intro' | 'intermediate' | 'advanced';
  /** Exam relevance score in [0, 1]; higher means more aligned with the student's exam. */
  examRelevance?: number;
  /** Mastery score in [0, 1]; CadenceStrategy uses this for weakness-weighted ordering. */
  mastery?: number;
  /** Free-form payload the router will deliver if this item is selected. */
  payload?: unknown;
}

export interface CadenceContext {
  mode: SessionMode;
  /** Days until the student's next exam, if known. */
  examProximityDays?: number;
}

export interface CadenceStrategy {
  /** Stable name used in telemetry and the debug trace. */
  readonly name: string;
  /** True if this strategy should run for this mode/proximity combo. */
  appliesTo(ctx: CadenceContext): boolean;
  /**
   * Reorder/filter content items. Return an array (possibly shorter than input).
   * MUST be deterministic given the same inputs — used in tests.
   */
  selectContent(items: CadenceItem[], ctx: CadenceContext): CadenceItem[];
}
