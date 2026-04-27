// @ts-nocheck
/**
 * src/modules/teaching/index.ts
 *
 * Public surface of the teaching module.
 *
 * What this module owns:
 *   - The TeachingTurn schema — the unit of legibility for the
 *     content-generation-and-delivery loop
 *   - Turn-store persistence (.data/teaching-turns.jsonl)
 *   - Turn open/close primitives (used by content/router and
 *     gbrain/after-each-attempt to instrument the loop)
 *   - Per-student summarisation (improvement signal)
 *
 * What this module does NOT own:
 *   - Content generation (content module)
 *   - Rendering (rendering module)
 *   - Student model state (gbrain module)
 *   - Pedagogy decisions (gbrain/task-reasoner)
 *
 * The teaching module is a passive observer + reporter. It gives the
 * other modules a place to write "this is what just happened" and
 * gives admins/students/owners a place to read "what's been happening."
 */

export type {
  Intent,                           // re-exported for convenience
  Source,                           // re-exported for convenience
} from '../../content/router';

export type {
  TeachingTurn,
  TurnOpenEvent,
  TurnCloseEvent,
  TurnEvent,
  MasterySnapshot,
  TurnDegradationReason,
} from '../../teaching/turn-store';

export {
  newTurnId,
  openTurn,
  closeTurn,
  getTurn,
  listTurnsForStudent,
  listAllTurns,
  summariseStudent,
} from '../../teaching/turn-store';
