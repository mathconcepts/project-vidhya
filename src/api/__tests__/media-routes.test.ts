/**
 * media-routes tests (§4.15).
 *
 * Covers the path-traversal defense, kind allowlist, and 404 path. Uses a
 * mocked getActiveArtifact so the test doesn't need a real DB or real files
 * for the rejection cases.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerResponse } from 'http';
import path from 'node:path';

const mockGetActive = vi.fn();
vi.mock('../../content/concept-orchestrator', () => ({
  getActiveArtifact: (...args: any[]) => mockGetActive(...args),
  MEDIA_STORAGE_DIR: '/tmp/vidhya-media-test',
}));

const { mediaRoutes } = await import('../media-routes');

beforeEach(() => {
  mockGetActive.mockReset();
});

function makeReq(params: any) {
  return { pathname: '', query: {}, params, body: null, headers: {} } as any;
}
function makeRes() {
  const captured: any = { status: 200, payload: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (s: number) => { captured.status = s; },
    end: (d?: string) => { if (d) { try { captured.payload = JSON.parse(d); } catch { captured.payload = d; } } },
    write: () => {},
  };
  Object.defineProperty(res, 'statusCode', {
    get: () => captured.status,
    set: (v: number) => { captured.status = v; },
  });
  return { res: res as ServerResponse, get status() { return captured.status; }, get payload() { return captured.payload; } };
}

const handler = mediaRoutes.find((r) => r.method === 'GET' && r.path === '/api/lesson/media/:atom_id/:kind')!.handler;

describe('media-routes', () => {
  it('400 when kind is invalid', async () => {
    const r = makeRes();
    await handler(makeReq({ atom_id: 'abc', kind: 'evil' }), r.res);
    expect(r.status).toBe(400);
    expect(mockGetActive).not.toHaveBeenCalled();
  });

  it('400 when atom_id missing', async () => {
    const r = makeRes();
    await handler(makeReq({ kind: 'gif' }), r.res);
    expect(r.status).toBe(400);
  });

  it('404 when no active artifact', async () => {
    mockGetActive.mockResolvedValueOnce(null);
    const r = makeRes();
    await handler(makeReq({ atom_id: 'abc', kind: 'gif' }), r.res);
    expect(r.status).toBe(404);
    expect(r.payload).toEqual({ error: 'no active artifact' });
  });

  it('blocks path-traversal attempts that escape MEDIA_STORAGE_DIR', async () => {
    mockGetActive.mockResolvedValueOnce({
      atom_id: 'abc',
      version_n: 1,
      kind: 'gif',
      status: 'done',
      src_path: '/etc/passwd',
      bytes: 100,
      duration_ms: 0,
      generated_at: new Date().toISOString(),
      expires_at: null,
      error_log: null,
    });
    const r = makeRes();
    await handler(makeReq({ atom_id: 'abc', kind: 'gif' }), r.res);
    expect(r.status).toBe(404); // resolved as 404 to avoid leaking the escape attempt
  });

  it('404 when artifact file is missing on disk', async () => {
    const fakePath = path.join('/tmp/vidhya-media-test', 'missing.gif');
    mockGetActive.mockResolvedValueOnce({
      atom_id: 'abc',
      version_n: 1,
      kind: 'gif',
      status: 'done',
      src_path: fakePath,
      bytes: 100,
      duration_ms: 0,
      generated_at: new Date().toISOString(),
      expires_at: null,
      error_log: null,
    });
    const r = makeRes();
    await handler(makeReq({ atom_id: 'abc', kind: 'gif' }), r.res);
    expect(r.status).toBe(404);
    expect(r.payload).toEqual({ error: 'artifact file missing on disk' });
  });

  it('audio_narration kind is accepted', async () => {
    mockGetActive.mockResolvedValueOnce(null);
    const r = makeRes();
    await handler(makeReq({ atom_id: 'abc', kind: 'audio_narration' }), r.res);
    expect(mockGetActive).toHaveBeenCalledWith('abc', 'audio_narration');
    expect(r.status).toBe(404);
  });
});
