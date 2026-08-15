/**
 * Tests for the demo-mode gate (src/api/demo-routes.ts).
 *
 * `/api/demo/rails` describes the whole walkthrough: which personas exist,
 * which concepts they land on, what the deck offers. On a production
 * instance none of that should be reachable or even discoverable, which is
 * why the refusal is a 404 and not a 403 — a 403 confirms the surface is
 * there and merely locked.
 *
 * The sibling `/demo-login` gate has its own tests. This file covers the
 * strictness of the flag itself: the demo surface opens for exactly one
 * value and nothing that merely looks like it.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ServerResponse } from 'http';
import { isDemoModeEnabled, demoRoutes } from '../demo-routes';

const ORIGINAL = process.env.DEMO_MODE_ENABLED;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.DEMO_MODE_ENABLED;
  else process.env.DEMO_MODE_ENABLED = ORIGINAL;
});

beforeEach(() => {
  delete process.env.DEMO_MODE_ENABLED;
});

describe('isDemoModeEnabled', () => {
  it('opens for the exact opt-in value', () => {
    process.env.DEMO_MODE_ENABLED = 'true';
    expect(isDemoModeEnabled()).toBe(true);
  });

  it('stays shut when the flag is absent', () => {
    expect(isDemoModeEnabled()).toBe(false);
  });

  it.each(['1', 'yes', 'TRUE', 'True', 'on', '', 'false'])(
    'stays shut for %o',
    (v) => {
      // Deliberately strict. A near-miss value on a production instance
      // should fail closed, and an operator who meant to enable the demo
      // finds out immediately rather than shipping a half-open surface.
      process.env.DEMO_MODE_ENABLED = v;
      expect(isDemoModeEnabled()).toBe(false);
    },
  );
});

describe('GET /api/demo/rails when demo mode is off', () => {
  it('answers 404, not 403', async () => {
    const handler = demoRoutes.find(
      (r) => r.method === 'GET' && r.path === '/api/demo/rails',
    )!.handler;

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

    await handler(
      { pathname: '/api/demo/rails', params: {}, query: new URLSearchParams(), headers: {} } as any,
      res as ServerResponse,
    );

    expect(captured.status).toBe(404);
    // The refusal must not name the deck, the personas, or the flag that
    // would open it.
    expect(JSON.stringify(captured.payload)).not.toMatch(/persona|rail|DEMO_MODE/i);
  });
});
