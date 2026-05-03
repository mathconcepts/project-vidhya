/**
 * Unit tests for the admin scenarios route helpers.
 *
 * Tests the rate limiter + neutral-render disk cache as pure helpers.
 * The route handlers themselves go through requireRole('admin') which
 * is exercised end-to-end via the surveillance invariants 6 + 7.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { __testing } from '../admin-scenarios-routes';

const { checkRateLimit, resetRateLimit, RATE_MAX, readNeutralCache, writeNeutralCache } = __testing;

describe('admin-scenarios rate limiter', () => {
  beforeEach(() => resetRateLimit());

  it('allows up to RATE_MAX calls per admin in the window', () => {
    for (let i = 0; i < RATE_MAX; i++) {
      expect(checkRateLimit('admin-1')).toBe(true);
    }
    expect(checkRateLimit('admin-1')).toBe(false);
  });

  it('isolates buckets per admin id', () => {
    for (let i = 0; i < RATE_MAX; i++) checkRateLimit('admin-1');
    expect(checkRateLimit('admin-1')).toBe(false);
    expect(checkRateLimit('admin-2')).toBe(true);
  });
});

describe('admin-scenarios neutral cache', () => {
  let tmp: string;
  let orig: string | undefined;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-cache-'));
    orig = process.env.VIDHYA_SCENARIO_NEUTRAL_CACHE;
    process.env.VIDHYA_SCENARIO_NEUTRAL_CACHE = tmp;
  });
  afterEach(() => {
    if (orig === undefined) delete process.env.VIDHYA_SCENARIO_NEUTRAL_CACHE;
    else process.env.VIDHYA_SCENARIO_NEUTRAL_CACHE = orig;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('miss returns null; write then hit returns the body', () => {
    expect(readNeutralCache('limits-jee', 'limits-jee.mcq.1')).toBeNull();
    writeNeutralCache('limits-jee', 'limits-jee.mcq.1', 'NEUTRAL BODY');
    expect(readNeutralCache('limits-jee', 'limits-jee.mcq.1')).toBe('NEUTRAL BODY');
  });

  it('isolates by atom_id', () => {
    writeNeutralCache('limits-jee', 'a.1', 'A');
    writeNeutralCache('limits-jee', 'a.2', 'B');
    expect(readNeutralCache('limits-jee', 'a.1')).toBe('A');
    expect(readNeutralCache('limits-jee', 'a.2')).toBe('B');
  });
});
