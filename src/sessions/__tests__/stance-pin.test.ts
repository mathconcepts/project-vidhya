/**
 * Stance pinning.
 *
 * The bug this closes only exists once recovery works. Before it, a struggling
 * student could never stop being struggling, so re-deriving the stance on
 * every compose always returned the same answer. Now that two correct answers
 * lift a student to steady, re-deriving mid-concept would silently swap every
 * remaining lesson body — while they are reading it.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  stanceForConcept,
  releaseStancePin,
  PIN_TTL_MS,
  MAX_PINS,
  __resetStancePinsForTests,
  __pinCountForTests,
} from '../stance-pin';

beforeEach(() => __resetStancePinsForTests());
afterEach(() => vi.useRealTimers());

describe('stanceForConcept', () => {
  it('pins the first derivation and stops consulting the deriver', () => {
    const derive = vi.fn().mockReturnValueOnce('shaken').mockReturnValue('steady');
    expect(stanceForConcept('s1', 'eigenvalues', derive)).toBe('shaken');
    // The student has now answered two correctly and derives as steady. The
    // lesson they are part-way through must not change under them.
    expect(stanceForConcept('s1', 'eigenvalues', derive)).toBe('shaken');
    expect(stanceForConcept('s1', 'eigenvalues', derive)).toBe('shaken');
    expect(derive).toHaveBeenCalledTimes(1);
  });

  it('re-derives at the next concept, which is where the change belongs', () => {
    const derive = vi.fn().mockReturnValueOnce('shaken').mockReturnValue('steady');
    expect(stanceForConcept('s1', 'eigenvalues', derive)).toBe('shaken');
    expect(stanceForConcept('s1', 'determinants', derive)).toBe('steady');
    expect(derive).toHaveBeenCalledTimes(2);
  });

  it('keeps sessions independent', () => {
    stanceForConcept('s1', 'c', () => 'shaken');
    expect(stanceForConcept('s2', 'c', () => 'assured')).toBe('assured');
    expect(stanceForConcept('s1', 'c', () => 'steady')).toBe('shaken');
  });

  it('derives every time for an anonymous caller', () => {
    // No session id means no continuity to protect, so behaviour is unchanged
    // from before pinning existed.
    const derive = vi.fn().mockReturnValueOnce('shaken').mockReturnValue('steady');
    expect(stanceForConcept(null, 'c', derive)).toBe('shaken');
    expect(stanceForConcept(null, 'c', derive)).toBe('steady');
    expect(derive).toHaveBeenCalledTimes(2);
  });

  it('re-derives once the pin goes stale', () => {
    vi.useFakeTimers();
    const derive = vi.fn().mockReturnValueOnce('shaken').mockReturnValue('steady');
    expect(stanceForConcept('s1', 'c', derive)).toBe('shaken');
    vi.advanceTimersByTime(PIN_TTL_MS + 1);
    // Coming back much later should reflect where the student is now, not the
    // register they were in yesterday.
    expect(stanceForConcept('s1', 'c', derive)).toBe('steady');
  });

  it('does not let a long read expire the pin under the student', () => {
    vi.useFakeTimers();
    const derive = vi.fn().mockReturnValueOnce('shaken').mockReturnValue('steady');
    stanceForConcept('s1', 'c', derive);
    // Reading with pauses: each compose refreshes recency, so an hour of
    // stop-start reading does not cross the TTL.
    for (let i = 0; i < 6; i++) {
      vi.advanceTimersByTime(PIN_TTL_MS / 2);
      expect(stanceForConcept('s1', 'c', derive)).toBe('shaken');
    }
    expect(derive).toHaveBeenCalledTimes(1);
  });
});

describe('releaseStancePin', () => {
  it('forces the next compose to re-derive', () => {
    const derive = vi.fn().mockReturnValueOnce('shaken').mockReturnValue('steady');
    stanceForConcept('s1', 'c', derive);
    releaseStancePin('s1', 'c');
    expect(stanceForConcept('s1', 'c', derive)).toBe('steady');
  });

  it('is safe to call for a session that never pinned anything', () => {
    expect(() => releaseStancePin('nobody', 'c')).not.toThrow();
    expect(() => releaseStancePin(null, 'c')).not.toThrow();
  });
});

describe('bounded memory', () => {
  it('evicts oldest pins rather than growing without limit', () => {
    // Session ids come from clients, so an unbounded map keyed by them is a
    // slow leak that nobody notices until it matters.
    for (let i = 0; i < MAX_PINS + 250; i++) {
      stanceForConcept(`s${i}`, 'c', () => 'shaken');
    }
    expect(__pinCountForTests()).toBeLessThanOrEqual(MAX_PINS);
  });

  it('keeps the most recent pins when it evicts', () => {
    for (let i = 0; i < MAX_PINS + 100; i++) {
      stanceForConcept(`s${i}`, 'c', () => 'shaken');
    }
    const derive = vi.fn().mockReturnValue('steady');
    // The newest session pinned must still be pinned.
    expect(stanceForConcept(`s${MAX_PINS + 99}`, 'c', derive)).toBe('shaken');
    expect(derive).not.toHaveBeenCalled();
  });
});
