/**
 * Unit tests for the lock-key derivation. Postgres-touching paths
 * exercised end-to-end via docker-compose smokes; here we just verify
 * the key derivation is deterministic + collision-resistant.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from '../pg-persistence';

const { lockKeyFor } = __testing;

describe('lockKeyFor', () => {
  it('is deterministic for the same run_id', () => {
    expect(lockKeyFor('run-1')).toBe(lockKeyFor('run-1'));
  });

  it('differs across run_ids', () => {
    expect(lockKeyFor('run-1')).not.toBe(lockKeyFor('run-2'));
  });

  it('returns a 63-bit positive bigint (fits in PG BIGINT)', () => {
    for (const id of ['run-1', 'run-XYZ', 'run_2026w19_001', 'r']) {
      const key = lockKeyFor(id);
      expect(typeof key).toBe('bigint');
      expect(key).toBeGreaterThanOrEqual(0n);
      expect(key).toBeLessThanOrEqual(0x7fffffffffffffffn);
    }
  });

  it('handles empty + unicode run_ids without throwing', () => {
    expect(() => lockKeyFor('')).not.toThrow();
    expect(() => lockKeyFor('रन-१')).not.toThrow();
  });
});
