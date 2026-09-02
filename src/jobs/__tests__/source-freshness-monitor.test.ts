import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Isolate each test's .data/source-freshness.json in a throwaway cwd so
// runs don't interfere with each other or leave real files behind.
let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-freshness-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
});

function fakeFetch(bodiesByUrl: Record<string, string | { fail: string }>) {
  return vi.fn(async (url: string) => {
    const entry = bodiesByUrl[url];
    if (entry === undefined) throw new Error(`unexpected fetch: ${url}`);
    if (typeof entry === 'object') throw new Error(entry.fail);
    return { ok: true, status: 200, text: async () => entry };
  });
}

describe('checkSourceFreshness', () => {
  it('first check on both sources reports first_check, not changed', async () => {
    const { checkSourceFreshness, OFFICIAL_SOURCES } = await import('../source-freshness-monitor');
    const bodies: Record<string, string> = {};
    for (const s of OFFICIAL_SOURCES) bodies[s.url] = `<html>${s.id}</html>`;

    const results = await checkSourceFreshness(fakeFetch(bodies) as any);

    expect(results).toHaveLength(OFFICIAL_SOURCES.length);
    for (const r of results) {
      expect(r.last_status).toBe('first_check');
      expect(r.changed).toBe(false);
      expect(r.last_hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('an unchanged body on the second check reports unchanged', async () => {
    const { checkSourceFreshness, OFFICIAL_SOURCES } = await import('../source-freshness-monitor');
    const bodies: Record<string, string> = {};
    for (const s of OFFICIAL_SOURCES) bodies[s.url] = 'same content';

    await checkSourceFreshness(fakeFetch(bodies) as any);
    const second = await checkSourceFreshness(fakeFetch(bodies) as any);

    for (const r of second) {
      expect(r.last_status).toBe('unchanged');
      expect(r.changed).toBe(false);
    }
  });

  it('a changed body flags changed and updates last_changed_at', async () => {
    const { checkSourceFreshness, OFFICIAL_SOURCES } = await import('../source-freshness-monitor');
    const [first, ...rest] = OFFICIAL_SOURCES;
    const bodiesV1: Record<string, string> = { [first.url]: 'v1' };
    for (const s of rest) bodiesV1[s.url] = 'unchanged-body';

    await checkSourceFreshness(fakeFetch(bodiesV1) as any);

    const bodiesV2: Record<string, string> = { [first.url]: 'v2 — scope changed' };
    for (const s of rest) bodiesV2[s.url] = 'unchanged-body';
    const second = await checkSourceFreshness(fakeFetch(bodiesV2) as any);

    const changedRecord = second.find((r) => r.id === first.id)!;
    expect(changedRecord.last_status).toBe('changed');
    expect(changedRecord.changed).toBe(true);
    expect(changedRecord.last_changed_at).not.toBeNull();

    for (const r of second) {
      if (r.id !== first.id) expect(r.last_status).toBe('unchanged');
    }
  });

  it('a fetch failure on one source is recorded and does not block the others', async () => {
    const { checkSourceFreshness, OFFICIAL_SOURCES } = await import('../source-freshness-monitor');
    const [first, ...rest] = OFFICIAL_SOURCES;
    const bodies: Record<string, string | { fail: string }> = { [first.url]: { fail: 'network unreachable' } };
    for (const s of rest) bodies[s.url] = 'ok body';

    const results = await checkSourceFreshness(fakeFetch(bodies) as any);

    const failed = results.find((r) => r.id === first.id)!;
    expect(failed.last_status).toBe('fetch_failed');
    expect(failed.last_error).toMatch(/network unreachable/);

    for (const r of results) {
      if (r.id !== first.id) expect(r.last_status).toBe('first_check');
    }
  });

  it('getSourceFreshnessState reflects the last check without fetching again', async () => {
    const mod = await import('../source-freshness-monitor');
    const bodies: Record<string, string> = {};
    for (const s of mod.OFFICIAL_SOURCES) bodies[s.url] = 'stable';
    await mod.checkSourceFreshness(fakeFetch(bodies) as any);

    const state = mod.getSourceFreshnessState();
    expect(state).toHaveLength(mod.OFFICIAL_SOURCES.length);
    expect(state.every((r) => r.last_status === 'first_check')).toBe(true);
  });

  it('runSourceFreshnessMonitor summarizes checked/changed/failed counts', async () => {
    const mod = await import('../source-freshness-monitor');
    const bodies: Record<string, string> = {};
    for (const s of mod.OFFICIAL_SOURCES) bodies[s.url] = 'x';
    vi.spyOn(globalThis, 'fetch').mockImplementation(fakeFetch(bodies) as any);

    const summary = await mod.runSourceFreshnessMonitor();
    expect(summary.status).toBe('ran');
    expect(summary.checked).toBe(mod.OFFICIAL_SOURCES.length);
    expect(summary.changed).toBe(0);
    expect(summary.failed).toBe(0);
  });
});
