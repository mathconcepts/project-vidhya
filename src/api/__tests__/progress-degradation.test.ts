/**
 * Tests for GET /api/progress/:sessionId without a database
 * (src/api/gate-routes.ts).
 *
 * This endpoint used to throw a 500 on a DB-less instance. Every other read
 * path in this codebase answers honestly when the pool is absent
 * (PgLearningObjectCatalog, PgStudentModel, the readiness routes), and the
 * demo deploy runs exactly that way — so a 500 here was the odd one out and
 * showed up as a broken panel on a page where everything else worked.
 *
 * The empty shape is the *true* answer, not a quiet one: an instance with no
 * session store genuinely has no progress to report. These lock that the
 * caller gets a 200 with a fully-formed shape it can render, rather than an
 * error it has to special-case.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ServerResponse } from 'http';

const ORIGINAL_DB_URL = process.env.DATABASE_URL;

function makeRes() {
  const captured: any = { status: 200, payload: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (s: number) => {
      captured.status = s;
    },
    end: (d?: string) => {
      if (d) {
        try {
          captured.payload = JSON.parse(d);
        } catch {
          captured.payload = d;
        }
      }
    },
    write: () => {},
  };
  return {
    res: res as ServerResponse,
    get status() {
      return captured.status;
    },
    get payload() {
      return captured.payload;
    },
  };
}

beforeEach(() => {
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  if (ORIGINAL_DB_URL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL_DB_URL;
});

async function callProgress(sessionId = 'session-with-no-db') {
  // Imported inside the test so the module-level pool cache is not shared
  // with a suite that may have configured DATABASE_URL.
  const { gateRoutes } = await import('../gate-routes');
  const handler = gateRoutes.find(
    (r: any) => r.method === 'GET' && r.path === '/api/progress/:sessionId',
  )!.handler;
  const r = makeRes();
  await handler(
    { pathname: `/api/progress/${sessionId}`, params: { sessionId }, query: new URLSearchParams(), headers: {} } as any,
    r.res,
  );
  return r;
}

describe('GET /api/progress/:sessionId with no database', () => {
  it('answers 200 rather than throwing', async () => {
    const r = await callProgress();
    expect(r.status).toBe(200);
  });

  it('returns a shape the client can render without special-casing', async () => {
    // The page maps over `topics` and reads `overall.*`. A partial object
    // would move the crash from the server to the browser.
    const r = await callProgress();
    expect(r.payload).toEqual({
      topics: [],
      overall: {
        problems_attempted: 0,
        total_correct: 0,
        total_attempts: 0,
        due_today: 0,
      },
      weakTopics: [],
    });
  });

  it('reports zero rather than omitting the counters', async () => {
    // "No data" and "zero" render the same here and both are honest for an
    // instance with no session store. Omitting the keys would render "NaN".
    const r = await callProgress();
    for (const v of Object.values(r.payload.overall)) {
      expect(typeof v).toBe('number');
      expect(Number.isNaN(v as number)).toBe(false);
    }
  });

  it('does not invent progress for an arbitrary session id', async () => {
    const r = await callProgress('0aded0a0-not-a-real-session');
    expect(r.payload.topics).toEqual([]);
    expect(r.payload.overall.total_attempts).toBe(0);
  });
});
