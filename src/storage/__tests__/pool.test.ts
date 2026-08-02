/**
 * Tests for src/storage/pool.ts — the single shared Postgres pool (CEO
 * plan Phase 0 §5). Pure fixture-based: mocks the `pg` module, no live
 * network.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPoolInstances: any[] = [];
const mockQuery = vi.fn();
const mockEnd = vi.fn();

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn((config: any) => {
      const instance = { config, query: mockQuery, end: mockEnd };
      mockPoolInstances.push(instance);
      return instance;
    }),
  },
}));

describe('storage/pool.ts', () => {
  const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;

  beforeEach(() => {
    mockPoolInstances.length = 0;
    mockQuery.mockReset();
    mockEnd.mockReset();
    mockEnd.mockResolvedValue(undefined);
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_DATABASE_URL === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
  });

  it('getSharedPool returns null when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    const { getSharedPool } = await import('../pool');
    expect(getSharedPool()).toBeNull();
    expect(mockPoolInstances.length).toBe(0);
  });

  it('getSharedPool builds exactly one pool and reuses it on subsequent calls', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    const { getSharedPool } = await import('../pool');
    const a = getSharedPool();
    const b = getSharedPool();
    expect(a).toBe(b);
    expect(mockPoolInstances.length).toBe(1);
  });

  it('uses the documented SHARED_POOL_MAX for the pool ceiling', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    const { getSharedPool, SHARED_POOL_MAX } = await import('../pool');
    getSharedPool();
    expect(mockPoolInstances[0].config.max).toBe(SHARED_POOL_MAX);
  });

  it('checkConnectivity returns ok:true when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    const { checkConnectivity } = await import('../pool');
    const result = await checkConnectivity();
    expect(result).toEqual({ ok: true });
  });

  it('checkConnectivity runs SELECT 1 against a short-lived pool, then closes it', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const { checkConnectivity } = await import('../pool');
    const result = await checkConnectivity();
    expect(result.ok).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
    expect(mockEnd).toHaveBeenCalled();
  });

  it('checkConnectivity reports ok:false with the error message on failure', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));
    const { checkConnectivity } = await import('../pool');
    const result = await checkConnectivity();
    expect(result).toEqual({ ok: false, error: 'connection refused' });
    expect(mockEnd).toHaveBeenCalled();
  });

  it("checkConnectivity's short-lived pool is independent of the shared pool", async () => {
    process.env.DATABASE_URL = 'postgres://test';
    mockQuery.mockResolvedValue({ rows: [] });
    const { getSharedPool, checkConnectivity } = await import('../pool');
    getSharedPool();
    await checkConnectivity();
    // Two distinct pool instances: the shared one + checkConnectivity's own.
    expect(mockPoolInstances.length).toBe(2);
    expect(mockPoolInstances[1].config.connectionTimeoutMillis).toBe(3000);
    expect(mockPoolInstances[1].config.max).toBe(1);
  });
});
