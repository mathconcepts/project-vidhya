/**
 * The demo deck is exam-scoped.
 *
 * Live QA, 2026-09-20: a viewer who switched the header to "JEE Main" was
 * still shown "Three weeks to GATE, weak in linear algebra", and tapping it
 * dropped them into GATE-MA's `determinants` lesson — whose exam_pattern atom
 * then correctly said "How GATE actually asks this." Three GATE surfaces in a
 * row for someone who had asked for JEE.
 *
 * Root cause was not the copy. Every persona YAML has declared `seed.exam_id`
 * since the personas were written, `handleGetRails` was already loading the
 * persona, and nothing read the field — so all four GATE journeys were served
 * to every viewer regardless of exam.
 *
 * These tests drive the real route against the real committed deck, because
 * the failure was specifically that real data flowed through a real handler
 * with one property unread. A fixture deck would have passed before the fix.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { demoRoutes } from '../demo-routes';

/** Minimal ServerResponse stand-in — captures status + parsed JSON body. */
function captureRes() {
  const out: { status: number; body: any } = { status: 0, body: undefined };
  const res: any = {
    statusCode: 200,
    setHeader() {},
    writeHead(code: number) {
      out.status = code;
      return res;
    },
    end(chunk?: string) {
      if (out.status === 0) out.status = res.statusCode;
      if (chunk) {
        try {
          out.body = JSON.parse(chunk);
        } catch {
          out.body = chunk;
        }
      }
    },
  };
  return { res, out };
}

async function getRails(examId?: string) {
  const route = demoRoutes.find((r) => r.path === '/api/demo/rails')!;
  const { res, out } = captureRes();
  const query = new URLSearchParams();
  if (examId !== undefined) query.set('exam_id', examId);
  await route.handler(
    { pathname: '/api/demo/rails', query, params: {}, body: undefined, headers: {} },
    res as any,
  );
  return out;
}

describe('GET /api/demo/rails — exam scoping', () => {
  const prev = process.env.DEMO_MODE_ENABLED;
  beforeAll(() => {
    process.env.DEMO_MODE_ENABLED = 'true';
  });
  afterAll(() => {
    if (prev === undefined) delete process.env.DEMO_MODE_ENABLED;
    else process.env.DEMO_MODE_ENABLED = prev;
  });

  it('serves every card when no exam is requested', async () => {
    const out = await getRails();
    expect(out.status).toBe(200);
    expect(out.body.cards.length).toBeGreaterThan(1);
  });

  it('serves a JEE viewer only JEE cards — never a GATE persona', async () => {
    const out = await getRails('jee-main');
    expect(out.status).toBe(200);
    expect(out.body.cards.length).toBeGreaterThan(0);
    for (const card of out.body.cards) {
      expect(card.exam_id).toBe('jee-main');
    }
    // The literal string from the bug report must not survive the filter.
    const titles = out.body.cards.map((c: any) => c.title).join(' | ');
    expect(titles).not.toMatch(/GATE/);
  });

  it('serves a GATE viewer only GATE cards', async () => {
    const out = await getRails('gate-ma');
    expect(out.status).toBe(200);
    expect(out.body.cards.length).toBeGreaterThan(0);
    for (const card of out.body.cards) {
      expect(card.exam_id).toBe('gate-ma');
    }
  });

  it('the two exams get genuinely different decks, not the same one twice', async () => {
    const gate = await getRails('gate-ma');
    const jee = await getRails('jee-main');
    const gateIds = new Set(gate.body.cards.map((c: any) => c.id));
    const jeeIds = new Set(jee.body.cards.map((c: any) => c.id));
    for (const id of jeeIds) expect(gateIds.has(id)).toBe(false);
  });

  it('every served card teaches a concept its own persona sits for', async () => {
    // The card-level invariant ci:demo-rails enforces at build time, asserted
    // here on what the route actually hands a client.
    const { CONCEPT_DECLARED_BY } = await import('../../constants/concept-graph');
    const out = await getRails();
    for (const card of out.body.cards) {
      const conceptId = card?.rail?.concept_id;
      if (!conceptId) continue; // surfaces-rails teach no single concept
      const owner = CONCEPT_DECLARED_BY.get(conceptId);
      if (!owner) continue;
      expect(owner).toBe(card.exam_id);
    }
  });

  it('an exam with no authored journey gets an honest empty deck, not another exam’s students', async () => {
    const out = await getRails('exam-that-does-not-exist');
    expect(out.status).toBe(200);
    expect(out.body.cards).toEqual([]);
    // The reason must name the gap rather than blame persona loading, which is
    // what the pre-existing 503 would have said.
    expect(String(out.body.reason)).toMatch(/no demo journey/i);
    expect(String(out.body.reason)).not.toMatch(/failed to load/i);
  });
});
