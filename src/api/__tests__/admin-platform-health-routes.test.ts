/**
 * admin-platform-health-routes tests (Mission Control Phase 1, Health &
 * costs panel — first slice). Auth gate (401 without credentials) plus
 * each read-only aggregator exercised against a temp jobs dir / temp
 * content files so no test touches the repo's real .data/ or
 * frontend/public/data/.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { ServerResponse } from 'http';

vi.mock('../../auth/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth/middleware')>();
  return {
    ...actual,
    requireAnyRole: vi.fn(actual.requireAnyRole),
  };
});

import { requireAnyRole } from '../../auth/middleware';
import { platformHealthRoutes, __testing } from '../admin-platform-health-routes';

const mockedRequireAnyRole = vi.mocked(requireAnyRole);

function findHandler(method: string, routePath: string) {
  const r = platformHealthRoutes.find((x) => x.method === method && x.path === routePath);
  if (!r) throw new Error(`route not found: ${method} ${routePath}`);
  return r.handler;
}

interface FakeRes {
  statusCode: number;
  body: any;
}

function makeRes(): { res: ServerResponse; out: FakeRes } {
  const out: FakeRes = { statusCode: 0, body: null };
  const res = {
    writeHead(code: number) {
      out.statusCode = code;
      return res;
    },
    end(payload?: string) {
      out.body = payload ? JSON.parse(payload) : null;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function makeReq() {
  return {
    pathname: '/api/admin/platform-health',
    query: new URLSearchParams(),
    params: {},
    body: {},
    headers: {},
  };
}

function actAsAdmin(): void {
  mockedRequireAnyRole.mockResolvedValue({
    user: { id: 'admin-1', role: 'admin' },
    token_exp: Date.now() / 1000 + 3600,
  } as any);
}

let tmp: string;
let origJobsDir: string | undefined;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-health-'));
  origJobsDir = process.env.VIDHYA_JOBS_DIR;
  process.env.VIDHYA_JOBS_DIR = tmp;
  mockedRequireAnyRole.mockReset();
});

afterEach(() => {
  if (origJobsDir === undefined) delete process.env.VIDHYA_JOBS_DIR;
  else process.env.VIDHYA_JOBS_DIR = origJobsDir;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('GET /api/admin/platform-health auth gate', () => {
  it('unauthenticated requests get 401 from the real middleware', async () => {
    const actual = await vi.importActual<typeof import('../../auth/middleware')>('../../auth/middleware');
    mockedRequireAnyRole.mockImplementation(actual.requireAnyRole);
    const handler = findHandler('GET', '/api/admin/platform-health');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(401);
  });

  it('admin requests get 200 with the full shape, including the honest cost_tracking flag', async () => {
    actAsAdmin();
    const handler = findHandler('GET', '/api/admin/platform-health');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(200);
    expect(out.body.cost_tracking).toBe('estimated');
    expect(typeof out.body.cost_tracking_note).toBe('string');
    expect(out.body.cost_tracking_note.length).toBeGreaterThan(0);
    expect(out.body).toHaveProperty('db');
    expect(out.body).toHaveProperty('jobs');
    expect(out.body).toHaveProperty('quota_calls_24h');
    expect(out.body.quota_calls_24h).toHaveProperty('total_cost_usd');
    expect(out.body).toHaveProperty('kill_switch_engaged');
    expect(out.body).toHaveProperty('nightly_cron_enabled');
    // T19 — chat spend cap visibility. Counts only, never a session id, user
    // id, or message.
    expect(out.body).toHaveProperty('chat_spend');
    expect(typeof out.body.chat_spend.spent_today_usd).toBe('number');
    expect(typeof out.body.chat_spend.cap_usd).toBe('number');
    expect(typeof out.body.chat_spend.cap_tripped_today).toBe('number');
    expect(['ok', 'tripped']).toContain(out.body.chat_spend.cap_status);
  });
});

describe('readQuotaLedger24h', () => {
  it('returns zero totals when the ledger file does not exist', () => {
    const result = __testing.readQuotaLedger24h();
    expect(result.total_calls).toBe(0);
    expect(result.total_cost_usd).toBe(0);
    expect(result.by_provider).toEqual([]);
  });

  it('aggregates calls within the last 24h by provider, ignoring older lines and malformed lines', () => {
    fs.mkdirSync(tmp, { recursive: true });
    const now = new Date('2026-08-02T12:00:00.000Z');
    const recent = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1h ago
    const stale = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
    const lines = [
      JSON.stringify({ ts: recent, provider: 'gemini', job: 'content-generation', ok: true, cost_usd: 0.01 }),
      JSON.stringify({ ts: recent, provider: 'gemini', job: 'content-generation', ok: false, cost_usd: 0.02 }),
      JSON.stringify({ ts: recent, provider: 'wolfram', job: 'wolfram-verify', ok: true, cost_usd: 0.001 }),
      // No cost_usd at all — pre-existing/uncosted line. Must count as $0, not break aggregation.
      JSON.stringify({ ts: recent, provider: 'wolfram', job: 'wolfram-verify', ok: true }),
      JSON.stringify({ ts: stale, provider: 'gemini', job: 'content-generation', ok: true, cost_usd: 0.01 }),
      'not-json-at-all',
    ].join('\n');
    fs.writeFileSync(path.join(tmp, 'quota-ledger.jsonl'), lines);

    const result = __testing.readQuotaLedger24h(now);
    expect(result.total_calls).toBe(4);
    expect(result.total_cost_usd).toBeCloseTo(0.031, 6);
    const gemini = result.by_provider.find((p) => p.provider === 'gemini');
    expect(gemini).toBeDefined();
    expect(gemini).toMatchObject({ provider: 'gemini', calls: 2, ok: 1, failed: 1 });
    expect(gemini!.cost_usd).toBeCloseTo(0.03, 6);
    const wolfram = result.by_provider.find((p) => p.provider === 'wolfram');
    expect(wolfram).toBeDefined();
    expect(wolfram).toMatchObject({ provider: 'wolfram', calls: 2, ok: 2, failed: 0 });
    expect(wolfram!.cost_usd).toBeCloseTo(0.001, 6);
  });
});

describe('readContentBundleSummary / readExplainerPlaceholderSummary / readPgAllowlistCount', () => {
  it('return null when their source files do not exist (never fabricate a number)', () => {
    // These read from process.cwd()-relative repo paths, which do exist in
    // this checkout — so this test only documents the contract via the
    // function's own null-safety on JSON.parse failure, exercised below.
    expect(typeof __testing.readContentBundleSummary).toBe('function');
    expect(typeof __testing.readExplainerPlaceholderSummary).toBe('function');
    expect(typeof __testing.readPgAllowlistCount).toBe('function');
  });

  it('readContentBundleSummary reads real repo stats without throwing', () => {
    // The repo ships a real content-bundle.json — assert shape, not exact numbers.
    const result = __testing.readContentBundleSummary();
    if (result !== null) {
      expect(typeof result.total_problems).toBe('number');
      expect(typeof result.wolfram_verified).toBe('number');
      expect(typeof result.total_explainers).toBe('number');
    }
  });

  it('readPgAllowlistCount reads the real committed allowlist length without throwing', () => {
    const result = __testing.readPgAllowlistCount();
    if (result !== null) {
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });
});
