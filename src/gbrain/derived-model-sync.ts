/**
 * src/gbrain/derived-model-sync.ts — refreshes the LEGACY `student_model`
 * read model from the canonical Elo+FSRS write path (T6/D3).
 *
 * D3 locks Elo+FSRS (`PgStudentModel`, migration 029/030) as the canonical
 * student model; the older `student_model` table (`mastery_vector`,
 * `prerequisite_alerts`, motivation state) still backs several routes
 * (`syllabus-routes.ts`, `me-routes.ts`, `knowledge-routes.ts`, the teacher
 * roster, chat's task-reasoner). Rather than migrating every one of those
 * call sites in this lane, this module makes the legacy model a DERIVED
 * projection: every attempt recorded through `PgStudentModel.update()`
 * also nudges `mastery_vector` / `prerequisite_alerts` for the same
 * (studentId, skillId), via the SAME `updateMastery()` Bayesian update the
 * legacy writers already use.
 *
 * Wiring contract (ENG-D1 / OV2-D3.7): `attempts-bus.ts`'s dispatch loop
 * isolates only SYNCHRONOUS throws (`listener` is typed `void`, called
 * inside a bare `try { listener(attempt) } catch`). A subscriber that is
 * itself `async` would return a Promise the bus never awaits — any
 * rejection inside it would escape as an unhandled promise rejection,
 * not something the bus's catch could ever see. So the exported listener
 * here (`onAttemptRecordedSyncEntry`) is a plain SYNCHRONOUS function that
 * fires off the real async work and attaches its own `.catch()` before
 * returning — the bus sees a function that never throws synchronously,
 * and the async failure path is fully owned (and logged) by this module.
 *
 * Best-effort by design: this refreshes a READ model. A failure here must
 * never affect the attempt's canonical persistence (already committed by
 * the time this subscriber runs — attempts-bus fires post-commit) and
 * must never surface to the student. Log and move on.
 *
 * DB-less (`!process.env.DATABASE_URL`): the legacy `getOrCreateStudentModel`
 * / `saveStudentModel` degrade to in-memory / no-op already, but we still
 * skip the round-trip entirely here to avoid useless work on every attempt
 * during demo/dev boots without a database.
 */

import type { Attempt } from '../core/interfaces';
import { onAttemptRecorded } from '../events/attempts-bus';

/** Default difficulty fed to `updateMastery` when the attempt carries none
 *  (the canonical `Attempt` type doesn't track item difficulty — Elo's own
 *  difficulty rating lives in `item_difficulty_elo`, not on the attempt).
 *  Matches the same fallback `gbrain-routes.ts` already uses for its own
 *  `updateMastery` call site. */
const DEFAULT_DIFFICULTY = 0.5;

/**
 * The real async refresh. Not exported directly as a bus listener — see
 * `onAttemptRecordedSyncEntry` below for why.
 */
async function refreshDerivedModel(attempt: Attempt): Promise<void> {
  if (!process.env.DATABASE_URL) return; // DB-less: nothing to refresh

  // Late import: keeps this module's own import graph light and avoids a
  // require-cycle risk (student-model.ts doesn't import this module, but
  // several api/ routes import both).
  const { getOrCreateStudentModel, updateMastery, saveStudentModel } =
    await import('./student-model.js');

  // Convention several routes already use: the auth user id doubles as the
  // legacy model's session_id key (see e.g. src/api/me-routes.ts,
  // src/api/knowledge-routes.ts). `attempt.studentId` is that same id on
  // the practice-attempt path (student-model-pg.ts's caller threads the
  // authenticated user id through as studentId).
  const model = await getOrCreateStudentModel(attempt.studentId);
  updateMastery(model, attempt.skillId, attempt.correct, DEFAULT_DIFFICULTY, attempt.latencyMs);
  await saveStudentModel(model);
}

/**
 * Synchronous bus-listener entry point. Register this (not
 * `refreshDerivedModel` directly) with `onAttemptRecorded`.
 */
export function onAttemptRecordedSyncEntry(attempt: Attempt): void {
  refreshDerivedModel(attempt).catch(err => {
    console.error(
      `[derived-model-sync] refresh failed for student=${attempt.studentId} object=${attempt.objectId}:`,
      err,
    );
  });
}

let _registered = false;

/**
 * Register the subscriber exactly once. Idempotent — safe to call from
 * multiple boot paths / repeatedly in tests without stacking listeners.
 * Returns the bus's cleanup function on first registration, or a no-op
 * cleanup on subsequent calls (the original registration owns the real
 * one — call `resetDerivedModelSyncForTests()` in test teardown instead).
 */
export function registerDerivedModelSync(): () => void {
  if (_registered) return () => {};
  _registered = true;
  const off = onAttemptRecorded(onAttemptRecordedSyncEntry);
  return () => {
    off();
    _registered = false;
  };
}

/** Test helper. Not part of the contract. */
export function __resetDerivedModelSyncForTests(): void {
  _registered = false;
}
