/**
 * Tri-state verifyProblemWithWolfram (T7 precondition — see TODOS.md /
 * docs/designs/linear-algebra-realtime-and-math-academy-plan.md "second
 * outside voice", ENG-D4 item 8).
 *
 * The verifier used to collapse three genuinely different situations into
 * one `verified: false`:
 *   1. Wolfram is unavailable (no key / outage / timeout / empty result) —
 *      the ARBITER has no opinion, not the content.
 *   2. Wolfram answered and disagrees — a genuine content problem.
 *   3. Wolfram answered and agrees — verified.
 * These tests pin the tri-state `status` field that lets both consumers
 * (wolfram-verify-job.ts, content-flywheel.ts) tell the three apart.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import { verifyProblemWithWolfram } from '../wolfram-service';

const savedAppId = process.env.WOLFRAM_APP_ID;

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  if (savedAppId === undefined) delete process.env.WOLFRAM_APP_ID;
  else process.env.WOLFRAM_APP_ID = savedAppId;
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

describe('verifyProblemWithWolfram — tri-state status', () => {
  it('is inconclusive (not failed) when WOLFRAM_APP_ID is unset — outage/no-key, not a content problem', async () => {
    delete process.env.WOLFRAM_APP_ID;
    const result = await verifyProblemWithWolfram('2+2', '4');
    expect(result.status).toBe('inconclusive');
    expect(result.verified).toBe(false);
    expect(result.error).toContain('WOLFRAM_APP_ID');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('is inconclusive on an HTTP error from Wolfram — the arbiter is down, not wrong', async () => {
    process.env.WOLFRAM_APP_ID = 'TEST-ID';
    mockFetch.mockResolvedValue(jsonResponse({}, false, 503));
    const result = await verifyProblemWithWolfram('2+2', '4');
    expect(result.status).toBe('inconclusive');
    expect(result.verified).toBe(false);
    expect(result.error).toBe('HTTP 503');
  });

  it('is inconclusive on a fetch exception (network/timeout)', async () => {
    process.env.WOLFRAM_APP_ID = 'TEST-ID';
    mockFetch.mockRejectedValue(new Error('The operation was aborted'));
    const result = await verifyProblemWithWolfram('2+2', '4');
    expect(result.status).toBe('inconclusive');
    expect(result.verified).toBe(false);
    expect(result.error).toContain('aborted');
  });

  it('is inconclusive when Wolfram answers with no usable result pod', async () => {
    process.env.WOLFRAM_APP_ID = 'TEST-ID';
    mockFetch.mockResolvedValue(jsonResponse({ queryresult: { success: false, error: false } }));
    const result = await verifyProblemWithWolfram('2+2', '4');
    expect(result.status).toBe('inconclusive');
    expect(result.verified).toBe(false);
  });

  it('is failed — a genuine disagreement — when Wolfram answers and it does not match', async () => {
    process.env.WOLFRAM_APP_ID = 'TEST-ID';
    mockFetch.mockResolvedValue(jsonResponse({
      queryresult: {
        success: true,
        pods: [{ title: 'Result', subpods: [{ plaintext: '5' }] }],
      },
    }));
    const result = await verifyProblemWithWolfram('2+2', '4');
    expect(result.status).toBe('failed');
    expect(result.verified).toBe(false);
    expect(result.wolfram_answer).toBe('5');
  });

  it('is verified when Wolfram answers and it matches', async () => {
    process.env.WOLFRAM_APP_ID = 'TEST-ID';
    mockFetch.mockResolvedValue(jsonResponse({
      queryresult: {
        success: true,
        pods: [{ title: 'Result', subpods: [{ plaintext: '4' }] }],
      },
    }));
    const result = await verifyProblemWithWolfram('2+2', '4');
    expect(result.status).toBe('verified');
    expect(result.verified).toBe(true);
    expect(result.wolfram_answer).toBe('4');
  });
});
