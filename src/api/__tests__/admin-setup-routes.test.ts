/**
 * admin-setup-routes tests (Mission Control Phase 1, Setup wizard panel).
 * Auth gate (401 without credentials) plus each read-only aggregator,
 * with the DB/provider/registry/syllabus primitives mocked so no test
 * makes a real network call, hits a real DB, or depends on the repo's
 * actual config/providers.yaml / data/curriculum/*.yml contents.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ServerResponse } from 'http';

vi.mock('../../auth/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth/middleware')>();
  return {
    ...actual,
    requireAnyRole: vi.fn(actual.requireAnyRole),
  };
});

vi.mock('../../jobs/db-preflight', () => ({
  preflightDatabase: vi.fn(),
}));

vi.mock('../../llm/env-config', () => ({
  preflightProviders: vi.fn(),
}));

vi.mock('../../llm/registry', () => ({
  loadProvidersRegistry: vi.fn(),
}));

vi.mock('../../curriculum/exam-loader', () => ({
  listSyllabusIds: vi.fn(),
  getSyllabus: vi.fn(),
  DEFAULT_SYLLABUS_ID: 'gate-ma',
}));

import { requireAnyRole } from '../../auth/middleware';
import { preflightDatabase } from '../../jobs/db-preflight';
import { preflightProviders } from '../../llm/env-config';
import { loadProvidersRegistry } from '../../llm/registry';
import { listSyllabusIds, getSyllabus } from '../../curriculum/exam-loader';
import { setupRoutes, __testing } from '../admin-setup-routes';

const mockedRequireAnyRole = vi.mocked(requireAnyRole);
const mockedPreflightDatabase = vi.mocked(preflightDatabase);
const mockedPreflightProviders = vi.mocked(preflightProviders);
const mockedLoadProvidersRegistry = vi.mocked(loadProvidersRegistry);
const mockedListSyllabusIds = vi.mocked(listSyllabusIds);
const mockedGetSyllabus = vi.mocked(getSyllabus);

function findHandler(method: string, routePath: string) {
  const r = setupRoutes.find((x) => x.method === method && x.path === routePath);
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
    pathname: '/api/admin/setup/status',
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

beforeEach(() => {
  mockedRequireAnyRole.mockReset();
  mockedPreflightDatabase.mockReset();
  mockedPreflightProviders.mockReset();
  mockedLoadProvidersRegistry.mockReset();
  mockedListSyllabusIds.mockReset();
  mockedGetSyllabus.mockReset();

  mockedPreflightDatabase.mockResolvedValue({ ok: true } as any);
  mockedLoadProvidersRegistry.mockReturnValue({
    version: '1',
    default_provider: 'gemini',
    providers: {
      gemini: { enabled: true, api_key_env: 'GEMINI_API_KEY', models: { flash: {} } },
      anthropic: { enabled: true, api_key_env: 'ANTHROPIC_API_KEY', models: {} },
      ollama: { enabled: false, models: {} },
    },
  } as any);
  mockedListSyllabusIds.mockReturnValue(['gate-ma', 'jee-main']);
  mockedGetSyllabus.mockImplementation((id: string) => ({
    id,
    name: id === 'gate-ma' ? 'GATE Mathematics' : 'JEE Main',
    concepts: id === 'gate-ma' ? new Array(82).fill({}) : [],
    unresolvedConceptIds: id === 'gate-ma' ? [] : ['stub-1', 'stub-2'],
    atomsSubdir: id === 'gate-ma' ? '' : id,
  }) as any);
});

describe('GET /api/admin/setup/status auth gate', () => {
  it('unauthenticated requests get 401 from the real middleware', async () => {
    const actual = await vi.importActual<typeof import('../../auth/middleware')>('../../auth/middleware');
    mockedRequireAnyRole.mockImplementation(actual.requireAnyRole);
    const handler = findHandler('GET', '/api/admin/setup/status');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(401);
  });
});

describe('GET /api/admin/setup/status', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('reports key_present per provider without ever echoing the key value', async () => {
    actAsAdmin();
    const handler = findHandler('GET', '/api/admin/setup/status');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);

    expect(out.statusCode).toBe(200);
    const gemini = out.body.providers.find((p: any) => p.provider === 'gemini');
    const anthropic = out.body.providers.find((p: any) => p.provider === 'anthropic');
    const ollama = out.body.providers.find((p: any) => p.provider === 'ollama');
    expect(gemini).toMatchObject({ key_present: true, required: true, enabled: true });
    expect(anthropic).toMatchObject({ key_present: false, required: false });
    expect(ollama.key_present).toBe(true); // keyless provider always "present"
    expect(JSON.stringify(out.body)).not.toContain('test-key');
  });

  it('marks the hard requirement met only when GEMINI_API_KEY is present', async () => {
    actAsAdmin();
    const handler = findHandler('GET', '/api/admin/setup/status');

    const { res: res1, out: out1 } = makeRes();
    await handler(makeReq() as any, res1);
    expect(out1.body.hard_requirement_met).toBe(true);
    expect(out1.body.ready).toBe(true);

    delete process.env.GEMINI_API_KEY;
    const { res: res2, out: out2 } = makeRes();
    await handler(makeReq() as any, res2);
    expect(out2.body.hard_requirement_met).toBe(false);
    expect(out2.body.ready).toBe(false);
  });

  it('surfaces per-syllabus resolution counts', async () => {
    actAsAdmin();
    const handler = findHandler('GET', '/api/admin/setup/status');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);

    const gateMa = out.body.syllabi.find((s: any) => s.id === 'gate-ma');
    const jeeMain = out.body.syllabi.find((s: any) => s.id === 'jee-main');
    expect(gateMa).toMatchObject({ concept_count: 82, unresolved_count: 0, is_default: true });
    expect(jeeMain).toMatchObject({ concept_count: 0, unresolved_count: 2, is_default: false });
  });

  it('reports DB configured/reachable from preflightDatabase without a note when DATABASE_URL is set', async () => {
    process.env.DATABASE_URL = 'postgres://example';
    mockedPreflightDatabase.mockResolvedValue({ ok: false, error: 'connection refused' } as any);
    actAsAdmin();
    const handler = findHandler('GET', '/api/admin/setup/status');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.body.database).toMatchObject({ configured: true, reachable: false, error: 'connection refused' });
    delete process.env.DATABASE_URL;
  });

  it('degrades honestly when config/providers.yaml is missing or unparsable', async () => {
    mockedLoadProvidersRegistry.mockImplementation(() => {
      throw new Error('ENOENT: config/providers.yaml');
    });
    actAsAdmin();
    const handler = findHandler('GET', '/api/admin/setup/status');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(200);
    expect(out.body.providers).toEqual([]);
    expect(out.body.registry_error).toContain('ENOENT');
    expect(out.body.hard_requirement_met).toBe(false);
  });
});

describe('POST /api/admin/setup/test-providers', () => {
  it('requires admin auth', async () => {
    const actual = await vi.importActual<typeof import('../../auth/middleware')>('../../auth/middleware');
    mockedRequireAnyRole.mockImplementation(actual.requireAnyRole);
    const handler = findHandler('POST', '/api/admin/setup/test-providers');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(401);
  });

  it('returns live results on success', async () => {
    actAsAdmin();
    mockedPreflightProviders.mockResolvedValue([
      { provider: 'gemini', ok: true },
      { provider: 'anthropic', ok: false, error: 'invalid x-api-key' },
    ]);
    const handler = findHandler('POST', '/api/admin/setup/test-providers');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(200);
    expect(out.body.results).toEqual([
      { provider: 'gemini', ok: true },
      { provider: 'anthropic', ok: false, error: 'invalid x-api-key' },
    ]);
    expect(typeof out.body.tested_at).toBe('string');
  });

  it('returns a 504 with a clear message when the live check exceeds the timeout', async () => {
    actAsAdmin();
    mockedPreflightProviders.mockImplementation(() => new Promise(() => {})); // never resolves
    const handler = findHandler('POST', '/api/admin/setup/test-providers');
    const { res, out } = makeRes();
    vi.useFakeTimers();
    const p = handler(makeReq() as any, res);
    await vi.advanceTimersByTimeAsync(25_000);
    await p;
    vi.useRealTimers();
    expect(out.statusCode).toBe(504);
    expect(out.body.error).toMatch(/did not complete within/i);
  });

  it('returns a 500 with the error message when preflightProviders rejects', async () => {
    actAsAdmin();
    mockedPreflightProviders.mockRejectedValue(new Error('boom'));
    const handler = findHandler('POST', '/api/admin/setup/test-providers');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(500);
    expect(out.body.error).toContain('boom');
  });
});

describe('readProviderStatuses / readSyllabusStatuses (pure aggregators)', () => {
  it('readProviderStatuses treats a missing api_key_env as always key_present (keyless provider)', () => {
    mockedLoadProvidersRegistry.mockReturnValue({
      version: '1',
      default_provider: 'gemini',
      providers: { ollama: { enabled: true, models: { a: {} } } },
    } as any);
    const { providers, registry_error } = __testing.readProviderStatuses();
    expect(registry_error).toBeNull();
    expect(providers).toEqual([
      { provider: 'ollama', enabled: true, api_key_env: null, key_present: true, model_count: 1, required: false },
    ]);
  });

  it('readSyllabusStatuses falls back to a zeroed entry when getSyllabus throws for one id', () => {
    mockedListSyllabusIds.mockReturnValue(['gate-ma', 'broken-exam']);
    mockedGetSyllabus.mockImplementation((id: string) => {
      if (id === 'broken-exam') throw new Error('bad yaml');
      return { id, name: 'GATE Mathematics', concepts: [], unresolvedConceptIds: [], atomsSubdir: '' } as any;
    });
    const { syllabi } = __testing.readSyllabusStatuses();
    expect(syllabi.find((s) => s.id === 'broken-exam')).toMatchObject({ concept_count: 0, unresolved_count: 0 });
  });
});
