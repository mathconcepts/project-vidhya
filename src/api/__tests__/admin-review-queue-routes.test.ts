/**
 * Tests for src/api/admin-review-queue-routes.ts — D4's item review queue.
 *
 * Covers the four things that would make the queue untrustworthy if they
 * broke: the admin gate, the decide flow's `decided_by` stamp, the
 * reject-requires-a-reason rule, and the batch path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ServerResponse } from 'http';
import type pg from 'pg';
import {
  adminReviewQueueRoutes,
  buildQueueRows,
  decisionReason,
  operatorIdFor,
  resolveReviewDetails,
  validateDecision,
  MAX_BATCH,
  REVIEWED_GATE,
} from '../admin-review-queue-routes';
import type { GateLedgerRow } from '../../generation/gate-ledger';

// ── Test doubles ───────────────────────────────────────────────────────────

function fakeRes() {
  const captured = { status: 0, body: null as unknown, headers: {} as Record<string, string> };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      captured.status = status;
      if (headers) captured.headers = headers;
    },
    end(body?: string) {
      captured.body = body ? JSON.parse(body) : null;
    },
  } as unknown as ServerResponse;
  return { res, captured };
}

function fakeReq(overrides: Partial<{ query: URLSearchParams; params: Record<string, string>; body: unknown }> = {}) {
  return {
    pathname: '/api/admin/review-queue',
    query: overrides.query ?? new URLSearchParams(),
    params: overrides.params ?? {},
    body: overrides.body ?? {},
    headers: {},
  };
}

const handlerFor = (method: string, path: string) =>
  adminReviewQueueRoutes.find((r) => r.method === method && r.path === path)!.handler;

// ── Pure rules ─────────────────────────────────────────────────────────────

describe('validateDecision', () => {
  it('accepts the three decisions', () => {
    expect(validateDecision('approve', undefined)).toBeNull();
    expect(validateDecision('needs_fix', undefined)).toBeNull();
    expect(validateDecision('reject', 'the key says 4, the answer is 5')).toBeNull();
  });

  it('names the allowed decisions when given a bad one', () => {
    const msg = validateDecision('yolo', undefined)!;
    expect(msg).toContain('approve/reject/needs_fix');
    expect(msg).toContain('"yolo"');
  });

  it('REJECT REQUIRES A REASON — whitespace does not count', () => {
    expect(validateDecision('reject', undefined)).toMatch(/requires notes/);
    expect(validateDecision('reject', '   ')).toMatch(/requires notes/);
  });
});

describe('decisionReason + operatorIdFor', () => {
  it('records who decided and what they said', () => {
    expect(decisionReason('approve', 'checked by hand', 'admin-7')).toContain("operator 'admin-7'");
    expect(decisionReason('approve', 'checked by hand', 'admin-7')).toContain('checked by hand');
    expect(decisionReason('reject', 'wrong key', 'admin-7')).toMatch(/rejected/);
  });

  it('prefers the user id, falls back to email, then labels the shared-secret path honestly', () => {
    expect(operatorIdFor({ userId: 'u1', email: 'a@b.c' })).toBe('u1');
    expect(operatorIdFor({ email: 'a@b.c' })).toBe('a@b.c');
    expect(operatorIdFor(null)).toBe('cron-secret');
  });
});

describe('buildQueueRows', () => {
  const base: GateLedgerRow = {
    id: 'gl-1',
    generation_run_id: 'run-1',
    item_id: 'pi-x',
    gate: 'mathematics',
    status: 'pending',
    reason: 'awaiting operator',
    decided_by: null,
    decided_at: null,
    created_at: '2026-08-27T00:00:00Z',
  };

  it('joins all five gates and counts the satisfied ones', () => {
    const all: GateLedgerRow[] = [
      base,
      { ...base, id: 'gl-2', gate: 'scope', status: 'passed' },
      { ...base, id: 'gl-3', gate: 'provenance', status: 'passed' },
      { ...base, id: 'gl-4', gate: 'misconception_coverage', status: 'waived' },
      { ...base, id: 'gl-5', gate: 'assessment_contract', status: 'failed' },
    ];
    const [r] = buildQueueRows([base], all, new Map());
    expect(Object.keys(r.gates).sort()).toHaveLength(5);
    expect(r.gates_satisfied).toBe(3);
    expect(r.gates_total).toBe(5);
    expect(r.detail.source).toBe('unresolved');
  });

  it('derives needs_fix from a pending gate an operator already touched', () => {
    const touched = { ...base, decided_by: 'admin-7', decided_at: '2026-08-27T01:00:00Z' };
    expect(buildQueueRows([base], [base], new Map())[0].needs_fix).toBe(false);
    expect(buildQueueRows([touched], [touched], new Map())[0].needs_fix).toBe(true);
  });
});

describe('resolveReviewDetails', () => {
  it('prefers the generated_problems row', async () => {
    const pool = {
      query: async () => ({ rows: [{ id: 'gen-1', concept_id: 'eigenvalues', question_text: 'db q', options: ['a'] }] }),
    } as unknown as pg.Pool;
    const out = await resolveReviewDetails(['gen-1'], pool, () => []);
    expect(out.get('gen-1')!.source).toBe('generated_problems');
    expect(out.get('gen-1')!.question_text).toBe('db q');
  });

  it('falls back to the committed file bank, answer key included', async () => {
    const out = await resolveReviewDetails(['pi-1'], null, () => [
      { id: 'pi-1', concept_id: 'eigenvalues', question_text: 'file q', correct_answer: '4', solution_steps: ['s'] },
    ]);
    const d = out.get('pi-1')!;
    expect(d.source).toBe('file_bank');
    expect(d.correct_answer).toBe('4');
    expect(d.solution_steps).toEqual(['s']);
  });

  it('reports an item neither source knows as unresolved rather than dropping it', async () => {
    const out = await resolveReviewDetails(['ghost'], null, () => []);
    expect(out.get('ghost')).toEqual({ source: 'unresolved' });
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────

const authMock = vi.hoisted(() => ({ requireRole: vi.fn() }));
vi.mock('../auth-middleware', () => authMock);

const poolMock = vi.hoisted(() => ({ getSharedPool: vi.fn() }));
vi.mock('../../storage/pool', () => poolMock);

const ledgerMock = vi.hoisted(() => ({
  decideGate: vi.fn(),
  gateRowsForItems: vi.fn(),
  listGateRows: vi.fn(),
  CONTENT_GATES: ['scope', 'mathematics', 'assessment_contract', 'misconception_coverage', 'provenance'] as const,
}));
vi.mock('../../generation/gate-ledger', () => ledgerMock);

describe('routes', () => {
  const fakePool = { query: vi.fn().mockResolvedValue({ rows: [] }) } as unknown as pg.Pool;

  beforeEach(() => {
    authMock.requireRole.mockReset();
    poolMock.getSharedPool.mockReset().mockReturnValue(fakePool);
    ledgerMock.decideGate.mockReset().mockResolvedValue(true);
    ledgerMock.gateRowsForItems.mockReset().mockResolvedValue([]);
    ledgerMock.listGateRows.mockReset().mockResolvedValue([]);
  });
  afterEach(() => vi.clearAllMocks());

  it('every route is admin-gated', async () => {
    authMock.requireRole.mockResolvedValue(null); // requireRole already wrote 403
    for (const route of adminReviewQueueRoutes) {
      const { res, captured } = fakeRes();
      await route.handler(fakeReq({ params: { itemId: 'x' } }) as never, res);
      expect(authMock.requireRole).toHaveBeenCalledWith(expect.anything(), res, 'admin');
      expect(captured.body).toBeNull(); // handler returned without writing its own body
    }
  });

  it('GET returns 503 with an honest message when there is no database', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    poolMock.getSharedPool.mockReturnValue(null);
    const { res, captured } = fakeRes();
    await handlerFor('GET', '/api/admin/review-queue')(fakeReq() as never, res);
    expect(captured.status).toBe(503);
    expect((captured.body as { message: string }).message).toMatch(/content_gate_ledger/);
  });

  it('GET lists the pending mathematics gate by default', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    const { res, captured } = fakeRes();
    await handlerFor('GET', '/api/admin/review-queue')(fakeReq() as never, res);
    expect(ledgerMock.listGateRows).toHaveBeenCalledWith(
      expect.objectContaining({ gate: REVIEWED_GATE, status: 'pending' }),
      fakePool,
    );
    expect(captured.status).toBe(200);
    expect((captured.body as { items: unknown[] }).items).toEqual([]);
  });

  it('approve writes passed on the mathematics gate with decided_by from the JWT', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    ledgerMock.gateRowsForItems.mockResolvedValue([
      { item_id: 'pi-1', gate: 'mathematics', generation_run_id: 'run-1' },
    ]);
    const { res, captured } = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/:itemId/decide')(
      fakeReq({ params: { itemId: 'pi-1' }, body: { decision: 'approve' } }) as never,
      res,
    );
    expect(captured.status).toBe(200);
    expect(ledgerMock.decideGate).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: 'pi-1',
        generation_run_id: 'run-1',
        gate: 'mathematics',
        status: 'passed',
        decided_by: 'admin-7',
      }),
      fakePool,
    );
  });

  it('reject without a reason is refused before anything is written', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    const { res, captured } = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/:itemId/decide')(
      fakeReq({ params: { itemId: 'pi-1' }, body: { decision: 'reject' } }) as never,
      res,
    );
    expect(captured.status).toBe(400);
    expect((captured.body as { message: string }).message).toMatch(/requires notes/);
    expect(ledgerMock.decideGate).not.toHaveBeenCalled();
  });

  it('needs_fix keeps the gate pending but stamps the operator', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    ledgerMock.gateRowsForItems.mockResolvedValue([
      { item_id: 'pi-1', gate: 'mathematics', generation_run_id: 'run-1' },
    ]);
    const { res } = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/:itemId/decide')(
      fakeReq({ params: { itemId: 'pi-1' }, body: { decision: 'needs_fix', notes: 'option C is ambiguous' } }) as never,
      res,
    );
    expect(ledgerMock.decideGate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', decided_by: 'admin-7' }),
      fakePool,
    );
  });

  it('deciding an item with no gate row 404s with a reason instead of writing one', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    const { res, captured } = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/:itemId/decide')(
      fakeReq({ params: { itemId: 'ghost' }, body: { decision: 'approve' } }) as never,
      res,
    );
    expect(captured.status).toBe(404);
    expect((captured.body as { message: string }).message).toContain("item 'ghost'");
    expect(ledgerMock.decideGate).not.toHaveBeenCalled();
  });

  it('batch decides every resolvable item and reports the rest', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    ledgerMock.gateRowsForItems.mockResolvedValue([
      { item_id: 'pi-1', gate: 'mathematics', generation_run_id: 'run-1' },
      { item_id: 'pi-2', gate: 'mathematics', generation_run_id: 'run-1' },
    ]);
    const { res, captured } = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/decide-batch')(
      fakeReq({ body: { item_ids: ['pi-1', 'pi-2', 'ghost'], decision: 'approve' } }) as never,
      res,
    );
    expect(captured.status).toBe(200);
    const body = captured.body as { decided: number; failed: Array<{ item_id: string }> };
    expect(body.decided).toBe(2);
    expect(body.failed.map((f) => f.item_id)).toEqual(['ghost']);
    expect(ledgerMock.decideGate).toHaveBeenCalledTimes(2);
  });

  it('batch reject also requires a reason', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    const { res, captured } = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/decide-batch')(
      fakeReq({ body: { item_ids: ['pi-1'], decision: 'reject' } }) as never,
      res,
    );
    expect(captured.status).toBe(400);
    expect(ledgerMock.decideGate).not.toHaveBeenCalled();
  });

  it('batch refuses an empty list and an oversized one, naming the limit', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-7', role: 'admin' });
    const empty = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/decide-batch')(
      fakeReq({ body: { item_ids: [], decision: 'approve' } }) as never,
      empty.res,
    );
    expect(empty.captured.status).toBe(400);

    const big = fakeRes();
    await handlerFor('POST', '/api/admin/review-queue/decide-batch')(
      fakeReq({ body: { item_ids: Array.from({ length: MAX_BATCH + 1 }, (_, i) => `pi-${i}`), decision: 'approve' } }) as never,
      big.res,
    );
    expect(big.captured.status).toBe(400);
    expect((big.captured.body as { message: string }).message).toContain(String(MAX_BATCH));
  });
});
