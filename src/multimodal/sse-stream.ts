// @ts-nocheck
/**
 * SSE stream helpers
 *
 * Matches the existing event format used in src/api/gemini-proxy.ts and
 * src/api/chat-routes.ts:
 *   data: {"type":"...","...":"..."}\n\n
 *
 * Keeps consumers' client code uniform — the same SSE parser works for
 * chat streaming and multimodal diagnostic streaming.
 */

import { ServerResponse } from 'http';

export function openSSE(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });
  // Comment to flush initial response so client sees stream start immediately
  res.write(': connected\n\n');
}

export function sendSSE(res: ServerResponse, type: string, payload: Record<string, unknown> = {}): void {
  res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
}

export function closeSSE(res: ServerResponse, type = 'done', payload: Record<string, unknown> = {}): void {
  sendSSE(res, type, payload);
  res.end();
}

export function errorSSE(res: ServerResponse, message: string): void {
  sendSSE(res, 'error', { error: message });
  res.end();
}
