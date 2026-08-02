/**
 * db-preflight.ts is now a thin re-export of storage/pool.ts's
 * checkConnectivity() (CEO plan Phase 0 §5). This locks the re-export
 * contract so existing callers of preflightDatabase() never notice the
 * relocation. Full behavioral coverage lives in src/storage/__tests__/pool.test.ts.
 */

import { describe, it, expect } from 'vitest';

describe('preflightDatabase (re-export of storage/pool.ts checkConnectivity)', () => {
  it('returns ok:true when DATABASE_URL is unset', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const { preflightDatabase } = await import('../db-preflight');
      expect(await preflightDatabase()).toEqual({ ok: true });
    } finally {
      if (original === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = original;
    }
  });
});
