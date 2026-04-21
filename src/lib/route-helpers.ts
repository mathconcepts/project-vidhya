// @ts-nocheck
/**
 * Route Helpers — common shapes and senders for HTTP handlers
 *
 * Before v2.9.1: 24 route files each re-declared ParsedRequest,
 * sendJSON, sendError, and RouteHandler. Total duplication: ~200 LOC
 * spread across the codebase. Changing the response envelope meant
 * touching 24 files.
 *
 * After v2.9.1: one shared definition. Existing handlers import from
 * here; the local declarations are kept for backward compatibility
 * during the migration — they're identical, so type-equivalence works.
 *
 * Design contract:
 *   - Pure shape / pure helpers — no I/O beyond res.end
 *   - CORS default preserved (matches every pre-existing handler)
 *   - sendJSON status defaults to 200, sendError defaults to 500
 *   - Uses Node's ServerResponse directly (no framework lock-in)
 */

import type { ServerResponse } from 'http';

// ============================================================================
// Shared request shape — matches what every route handler receives from
// the gate-server router. Keeping the field names unchanged so dropping
// this import in is a no-op substitution.
// ============================================================================

export interface ParsedRequest {
  pathname: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export type RouteHandler = (req: ParsedRequest, res: ServerResponse) => Promise<void>;

export interface RouteSpec {
  method: string;
  path: string;
  handler: RouteHandler;
}

// ============================================================================
// Response senders — identical behavior to the 19 copies they replace
// ============================================================================

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
};

export function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(data));
}

export function sendError(res: ServerResponse, status: number, msg: string, extras?: Record<string, unknown>): void {
  sendJSON(res, { error: msg, ...(extras || {}) }, status);
}

export function sendText(res: ServerResponse, text: string, status = 200): void {
  res.writeHead(status, {
    'Content-Type': 'text/plain',
    ...CORS_HEADERS,
  });
  res.end(text);
}

export function sendNoContent(res: ServerResponse): void {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}
