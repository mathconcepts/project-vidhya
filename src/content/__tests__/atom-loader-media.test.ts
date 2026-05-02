/**
 * applyMediaUrls tests (§4.15) — atom-loader enricher.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => {
  mockQuery.mockReset();
});

describe('applyMediaUrls (DB-less)', () => {
  const prevDb = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (prevDb) process.env.DATABASE_URL = prevDb; else delete process.env.DATABASE_URL; });

  it('returns input unchanged when DATABASE_URL is unset', async () => {
    const { applyMediaUrls } = await import('../atom-loader');
    const atoms = [{ id: 'a1', concept_id: 'c1', atom_type: 'intuition' } as any];
    const r = await applyMediaUrls(atoms);
    expect(r).toBe(atoms);
    expect((r[0] as any).media).toBeUndefined();
  });

  it('returns empty input as-is', async () => {
    const { applyMediaUrls } = await import('../atom-loader');
    const r = await applyMediaUrls([]);
    expect(r).toEqual([]);
  });
});

describe('applyMediaUrls (with DB)', () => {
  beforeEach(() => { process.env.DATABASE_URL = 'postgres://test'; });
  afterEach(() => { delete process.env.DATABASE_URL; });

  it('attaches gif_url and audio_url for matching atoms', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { atom_id: 'a1', kind: 'gif' },
        { atom_id: 'a1', kind: 'audio_narration' },
        { atom_id: 'a2', kind: 'gif' },
      ],
    });
    // Re-import after env setup so the fresh module sees DATABASE_URL.
    vi.resetModules();
    const { applyMediaUrls } = await import('../atom-loader');
    const atoms = [
      { id: 'a1', concept_id: 'c1', atom_type: 'intuition' } as any,
      { id: 'a2', concept_id: 'c1', atom_type: 'visual_analogy' } as any,
      { id: 'a3', concept_id: 'c1', atom_type: 'hook' } as any,
    ];
    const r = await applyMediaUrls(atoms);
    expect((r[0] as any).media).toEqual({
      gif_url: '/api/lesson/media/a1/gif',
      audio_url: '/api/lesson/media/a1/audio_narration',
    });
    expect((r[1] as any).media).toEqual({ gif_url: '/api/lesson/media/a2/gif' });
    expect((r[2] as any).media).toBeUndefined();
  });

  it('returns input unchanged when query throws', async () => {
    mockQuery.mockRejectedValueOnce(new Error('pg connect failed'));
    vi.resetModules();
    const { applyMediaUrls } = await import('../atom-loader');
    const atoms = [{ id: 'a1', concept_id: 'c1', atom_type: 'intuition' } as any];
    const r = await applyMediaUrls(atoms);
    expect(r).toBe(atoms);
    expect((r[0] as any).media).toBeUndefined();
  });
});
