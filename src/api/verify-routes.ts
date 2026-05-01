// @ts-nocheck
/**
 * Verify Routes — Wolfram :::verify directive backing endpoint (B5).
 *
 * POST /api/lesson/verify
 *   Body: { student_input: string, expected: string, concept_id?: string }
 *   Returns: { status: 'verified'|'failed'|'inconclusive', detail?: string, source: 'wolfram'|'local' }
 *
 * Env-gated: when WOLFRAM_APP_ID is unset, the route falls back to a
 * symbolic-equality check (whitespace + casing + obvious algebraic forms)
 * so atoms with `:::verify` still grade in dev / paid-tier-disabled deploys.
 *
 * The verify directive in atom markdown looks like:
 *
 *   :::verify{expected="d/dx[x^2]"}
 *   What is the derivative of x²?
 *   :::
 *
 * Frontend posts the student's input + the directive's `expected` attr.
 * No DB call. No PII logged. Concept_id is for telemetry only.
 */

import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

interface VerifyBody {
  student_input?: string;
  expected?: string;
  concept_id?: string;
}

interface VerifyResult {
  status: 'verified' | 'failed' | 'inconclusive';
  detail?: string;
  source: 'wolfram' | 'local';
}

const WOLFRAM_TIMEOUT_MS = 6000;

/**
 * Cheap, deterministic local equality check. Only resolves obvious matches —
 * whitespace, casing, simple operator normalization. When unsure, returns
 * 'inconclusive' so the UI shows the student a "couldn't verify" affordance
 * rather than a wrong-answer flag.
 */
function localCheck(student: string, expected: string): VerifyResult {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\*\*/g, '^')
      .replace(/[{}]/g, '')
      .trim();

  const a = norm(student);
  const b = norm(expected);
  if (!a || !b) return { status: 'inconclusive', source: 'local' };
  if (a === b) return { status: 'verified', source: 'local', detail: 'exact match' };

  // Algebraic-form tolerance: treat '2*x' / '2x' equivalent etc.
  const collapse = (s: string) => s.replace(/\*/g, '');
  if (collapse(a) === collapse(b)) {
    return { status: 'verified', source: 'local', detail: 'matched modulo *' };
  }
  return { status: 'inconclusive', source: 'local' };
}

async function wolframCheck(student: string, expected: string): Promise<VerifyResult> {
  const appId = process.env.WOLFRAM_APP_ID;
  if (!appId) return localCheck(student, expected);

  // The cheapest, most reliable Wolfram comparison: ask Wolfram to evaluate
  // `((student) - (expected))` and check whether the simplified result is 0.
  const query = `Simplify[(${student}) - (${expected})]`;
  const url = `https://api.wolframalpha.com/v2/query?appid=${encodeURIComponent(appId)}&input=${encodeURIComponent(query)}&output=JSON&format=plaintext&podstate=Result`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), WOLFRAM_TIMEOUT_MS);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { status: 'inconclusive', source: 'wolfram', detail: `http ${r.status}` };
    const json: any = await r.json();
    const pods = json?.queryresult?.pods ?? [];
    // Look for a "Result" pod with plaintext "0".
    for (const p of pods) {
      const sub = p?.subpods?.[0];
      const text: string = (sub?.plaintext || '').trim();
      if (!text) continue;
      if (text === '0') return { status: 'verified', source: 'wolfram', detail: 'simplified to 0' };
      if (/^-?\d+(\.\d+)?$/.test(text)) {
        return { status: 'failed', source: 'wolfram', detail: `non-zero residue: ${text}` };
      }
    }
    return { status: 'inconclusive', source: 'wolfram', detail: 'no decisive pod' };
  } catch (err: any) {
    return { status: 'inconclusive', source: 'wolfram', detail: err?.name === 'AbortError' ? 'timeout' : 'error' };
  }
}

async function handleVerify(req: ParsedRequest, res: any) {
  const body = (req.body || {}) as VerifyBody;
  const student = (body.student_input || '').trim();
  const expected = (body.expected || '').trim();
  if (!student || !expected) {
    sendError(res, 400, 'student_input and expected are required');
    return;
  }
  const result = await wolframCheck(student, expected);
  sendJSON(res, result);
}

export const verifyRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/lesson/verify', handler: handleVerify },
];
