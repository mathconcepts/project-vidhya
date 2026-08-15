/**
 * demo-doubt-routes — "bring your own doubt", in its collect-and-send-after form.
 *
 * D3.5 asks a visitor to bring a problem from their own material, and describes
 * a live path: generate, verify, show. That path is inherently network-dependent
 * — the plan says so itself — and the venue is now deliberately offline, with
 * the whole SPA verified to make zero external requests. Live generation there
 * would not degrade; it would simply fail, and a "verifying…" spinner that can
 * never resolve is theatre of exactly the kind this demo is supposed to refuse.
 *
 * So this ships the FIRST rung of the plan's own degradation ladder — "live
 * moment → collect-and-send-after (the promise survives; the stage gamble
 * goes)" — as the intended behaviour rather than as a fallback. The visitor's
 * problem is captured, and they are told plainly that the answer comes later,
 * from a person, verified. Nothing is claimed on stage that cannot be delivered.
 *
 * Deliberately NOT implemented: live generation, the ~20-problem pre-verified
 * bank, and the timeout choreography. The bank is content work the plan
 * schedules alongside the M1 sample-pack run, and the live path only becomes
 * meaningful on a venue with a network. Both are recorded in the CP0 report.
 *
 * Storage is a local JSONL file under the demo namespace. It never touches
 * content tables or student data: the plan's item-7 carve-out (a) has the
 * operator ingest these AFTER the session, against the production instance,
 * which keeps the boundary intact while visitors hold the device.
 */

import fs from 'fs';
import path from 'path';
import type { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { isDemoModeEnabled } from './demo-routes';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

const DOUBTS_DIR = process.env.VIDHYA_DEMO_DOUBTS_DIR
  ?? path.join(process.cwd(), '.data', 'demo-doubts');

/** Long enough for a multi-part question, short enough to bound a paste. */
const MAX_PROBLEM_CHARS = 2000;

/**
 * Terms that mark a problem as linear algebra, the topic this demo covers.
 *
 * Used to SET EXPECTATIONS, never to refuse: an out-of-scope problem is still
 * captured and still answered later. The plan's scoping line is about what can
 * be promised on the spot, and telling a visitor their question is unwelcome
 * would be a worse outcome than answering it a day later.
 */
const LA_TERMS = [
  'matrix', 'matrices', 'eigen', 'determinant', 'vector', 'linear',
  'orthogonal', 'basis', 'rank', 'null space', 'span', 'transformation',
  'diagonal', 'transpose', 'inverse', 'subspace', 'dot product',
];

export function looksLikeLinearAlgebra(text: string): boolean {
  const lower = text.toLowerCase();
  return LA_TERMS.some((t) => lower.includes(t));
}

async function handlePostDoubt(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!isDemoModeEnabled()) {
    sendError(res, 404, 'not found');
    return;
  }

  const body = (req.body ?? {}) as { problem?: unknown; persona?: unknown; contact?: unknown };
  const problem = typeof body.problem === 'string' ? body.problem.trim() : '';

  if (!problem) {
    sendError(res, 400, 'a problem is required');
    return;
  }
  if (problem.length > MAX_PROBLEM_CHARS) {
    sendError(res, 400, `problem is longer than ${MAX_PROBLEM_CHARS} characters`);
    return;
  }

  const record = {
    problem,
    persona: typeof body.persona === 'string' ? body.persona : null,
    // Optional: how to reach them. Absent is fine — the operator usually knows
    // who was in the room, and demanding contact details to ask a maths
    // question would be a strange trade to put in front of a visitor.
    contact: typeof body.contact === 'string' ? body.contact.slice(0, 200) : null,
    in_scope: looksLikeLinearAlgebra(problem),
    asked_at: new Date().toISOString(),
  };

  try {
    fs.mkdirSync(DOUBTS_DIR, { recursive: true });
    fs.appendFileSync(path.join(DOUBTS_DIR, 'doubts.jsonl'), JSON.stringify(record) + '\n', 'utf8');
  } catch (e) {
    // Do not tell the visitor their question was captured when it was not.
    sendError(res, 503, `could not record the question: ${(e as Error).message}`);
    return;
  }

  sendJSON(res, {
    recorded: true,
    in_scope: record.in_scope,
    // The response says what will actually happen, and by when. "We'll get back
    // to you" with no mechanism behind it is the kind of promise this product
    // does not make.
    promise: record.in_scope
      ? 'Captured. This demo runs offline, so it is not solved here — you will get a worked, verified solution after the session.'
      : 'Captured. It looks outside linear algebra, which is what today covers — you will still get a worked, verified solution after the session.',
  });
}

/** Operator read-back: what was asked, for the post-session ingestion step. */
async function handleGetDoubts(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!isDemoModeEnabled()) {
    sendError(res, 404, 'not found');
    return;
  }
  let lines: string[] = [];
  try {
    lines = fs
      .readFileSync(path.join(DOUBTS_DIR, 'doubts.jsonl'), 'utf8')
      .split('\n')
      .filter(Boolean);
  } catch {
    // No file yet simply means nobody has asked anything.
  }
  const doubts = lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  sendJSON(res, { count: doubts.length, doubts });
}

export const demoDoubtRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/demo/doubt', handler: handlePostDoubt },
  { method: 'GET', path: '/api/demo/doubts', handler: handleGetDoubts },
];
