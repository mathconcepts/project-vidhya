/**
 * src/events/attempts-bus.ts — in-process telemetry for every attempt.
 *
 * Blueprint §5.8 calls for "every attempt emits an event; the student
 * model, monitoring, and calibration all subscribe." This is the bus
 * that makes that wiring possible without each producer knowing about
 * each consumer.
 *
 * Why a dedicated bus rather than the generic `event-bus.ts`?
 *   - Attempt events are high-frequency and worth their own type-safe
 *     channel; consumers shouldn't have to filter by `type` field.
 *   - We want a CLOSED contract: only Attempt is a publishable event
 *     here, so type-broken subscribers fail at compile time.
 *
 * Producers: PgStudentModel.update() (publishes post-commit).
 * Consumers: cockpit aggregators, calibration store, mock-to-marks
 *   collector, future student-facing "your streak just grew" toasts.
 *
 * Subscription returns a cleanup function (matches the LLMClient
 * convention). The bus is synchronous on purpose — subscribers do
 * their own deferral (queueMicrotask, async I/O) when they need it.
 */

import type { Attempt } from '../core/interfaces';

export type AttemptListener = (attempt: Attempt) => void;

const listeners = new Set<AttemptListener>();

/**
 * Subscribe to attempt events. Returns a function that, when called,
 * unsubscribes. Idempotent — calling the cleanup twice is safe.
 */
export function onAttemptRecorded(listener: AttemptListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * Publish an attempt event. Producers MUST publish post-commit (after
 * the persistence transaction has succeeded) so subscribers can rely
 * on reading durable state.
 *
 * Subscriber exceptions are caught and logged; one bad subscriber
 * never kills the chain.
 */
export function publishAttemptRecorded(attempt: Attempt): void {
  for (const listener of listeners) {
    try {
      listener(attempt);
    } catch (err) {
      console.error('[attempts-bus] subscriber threw:', err);
    }
  }
}

/** Test helper. Not part of the contract. */
export function __clearAttemptListeners(): void {
  listeners.clear();
}

/** Test helper. Not part of the contract. */
export function __attemptListenerCount(): number {
  return listeners.size;
}
