/**
 * demo-routes — the journey deck behind `/demo`.
 *
 * Serves `config/demo-rails.json` to the demo entry page, gated by
 * `DEMO_MODE_ENABLED`. The gate matters: the CEO plan's locked decision is
 * "the production instance keeps DEMO_MODE_ENABLED=false (no publicly
 * reachable /demo), and the venue instance is a LOCAL install with the flag
 * true." Today the neighbouring `/demo-login` route has no such gate — it is
 * hidden by omission rather than access-controlled, reachable by anyone who
 * guesses the URL as long as demo tokens happen to exist on disk. This route
 * does not repeat that.
 *
 * The config is read from disk on each request rather than cached at boot.
 * The deck is read a handful of times per demo, an operator editing a card at
 * the venue should not have to restart the server to see it, and a stale cache
 * in front of a visitor is a worse failure than a file read.
 *
 * The rails file is the same one `scripts/check-demo-rails.ts` validates in
 * CI, so anything served here has already been walked: persona resolves, atoms
 * exist, every interactive block in the rail parses.
 */

import fs from 'fs';
import path from 'path';
import type { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

const RAILS_PATH = path.join(process.cwd(), 'config', 'demo-rails.json');

/**
 * Demo mode is opt-in and off unless explicitly enabled.
 *
 * Deliberately NOT inheriting the existing `VIDHYA_DEMO_MODE` flag, which
 * means something narrower ("show quick-access buttons on the sign-in page")
 * and defaults to true whenever Google OAuth is unconfigured. Reusing it would
 * silently expose the visitor-facing deck on every deployment that has not set
 * up OAuth, which is the opposite of the locked decision.
 */
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE_ENABLED === 'true';
}

async function handleGetRails(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!isDemoModeEnabled()) {
    // 404 rather than 403: on an instance where demo mode is off, the deck
    // should not advertise its own existence.
    sendError(res, 404, 'not found');
    return;
  }

  let raw: string;
  try {
    raw = fs.readFileSync(RAILS_PATH, 'utf8');
  } catch {
    sendError(res, 503, 'demo rails config is not available on this instance');
    return;
  }

  let config: any;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    // CI validates this file, so reaching here means the venue copy was hand-
    // edited into invalid JSON. Say so plainly — the operator is standing next
    // to the machine and can fix it, but only if the error names the cause.
    sendError(res, 500, `demo rails config is not valid JSON: ${(e as Error).message}`);
    return;
  }

  const cards = Array.isArray(config.cards) ? config.cards : [];
  if (cards.length === 0) {
    sendError(res, 503, 'demo rails config contains no cards');
    return;
  }

  sendJSON(res, { version: config.version, cards });
}

export const demoRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/demo/rails', handler: handleGetRails },
];
