/**
 * Tests for src/events/attempts-bus.ts — in-process telemetry channel.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  onAttemptRecorded,
  publishAttemptRecorded,
  __clearAttemptListeners,
  __attemptListenerCount,
} from '../attempts-bus';
import type { Attempt } from '../../core/interfaces';

const A = (): Attempt => ({
  studentId: 's', objectId: 'o', skillId: 'k',
  correct: true, latencyMs: 1_000, ts: 1,
});

describe('attempts-bus', () => {
  beforeEach(() => __clearAttemptListeners());

  it('delivers attempts to subscribers in order', () => {
    const seen: Attempt[] = [];
    onAttemptRecorded(a => seen.push(a));
    publishAttemptRecorded(A());
    publishAttemptRecorded({ ...A(), ts: 2 });
    expect(seen).toHaveLength(2);
    expect(seen[1].ts).toBe(2);
  });

  it('unsubscribe returns a cleanup function', () => {
    const handler = vi.fn();
    const off = onAttemptRecorded(handler);
    publishAttemptRecorded(A());
    expect(handler).toHaveBeenCalledTimes(1);
    off();
    publishAttemptRecorded(A());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('subscriber throw does not break the chain', () => {
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ok = vi.fn();
    onAttemptRecorded(() => { throw new Error('bad subscriber'); });
    onAttemptRecorded(ok);
    publishAttemptRecorded(A());
    expect(ok).toHaveBeenCalledOnce();
    consoleErr.mockRestore();
  });

  it('cleanup is idempotent', () => {
    const off = onAttemptRecorded(() => {});
    expect(__attemptListenerCount()).toBe(1);
    off(); off();
    expect(__attemptListenerCount()).toBe(0);
  });
});
