// @ts-nocheck
/**
 * demo/telemetry.ts — demo-usage telemetry.
 *
 * Captures what each demo tester does. Owner-visible. Explicit and
 * opt-in (every demo tester is told their session is logged when
 * they hit /demo.html).
 *
 * Storage: .data/demo-usage-log.json (flat file; last-1000 entries
 * retained). No PII beyond the demo user's id; demo users all have
 * the "demo-*" name prefix so they are identifiable as demo traffic.
 *
 * Used by:
 *   - demo/seed.ts                 — records seed events
 *   - demo/demo-log-middleware.ts  — optional HTTP middleware that
 *                                     records requests from demo users
 *
 * Viewable via:
 *   - npm run demo:log              — CLI tail
 *   - the owner's admin dashboard   — (manual fetch of the file for now)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const LOG_PATH = '.data/demo-usage-log.json';
const MAX_ENTRIES = 1000;

export interface DemoUsageEntry {
  timestamp: string;          // ISO
  role: 'owner' | 'admin' | 'teacher' | 'student' | 'unknown';
  user_id: string | null;
  event: string;              // short code, e.g. 'seed.user-created' or 'http.GET /api/...'
  detail?: Record<string, unknown>;
}

function ensureDir(): void {
  if (!existsSync('.data')) mkdirSync('.data', { recursive: true });
}

function readLog(): DemoUsageEntry[] {
  if (!existsSync(LOG_PATH)) return [];
  try {
    const raw = readFileSync(LOG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function writeLog(entries: DemoUsageEntry[]): void {
  ensureDir();
  // Keep last MAX_ENTRIES — demo is not a compliance system.
  const trimmed = entries.length > MAX_ENTRIES
    ? entries.slice(-MAX_ENTRIES)
    : entries;
  writeFileSync(
    LOG_PATH,
    JSON.stringify({ version: 1, entries: trimmed }, null, 2),
  );
}

export function logDemoEvent(entry: Omit<DemoUsageEntry, 'timestamp'>): void {
  const log = readLog();
  log.push({
    timestamp: new Date().toISOString(),
    ...entry,
  });
  writeLog(log);
}

export function listDemoEvents(limit = 100): DemoUsageEntry[] {
  const log = readLog();
  return log.slice(-limit).reverse();   // newest first
}

export function clearDemoLog(): void {
  writeLog([]);
}

export function summariseDemoLog(): {
  total: number;
  by_role: Record<string, number>;
  by_event: Record<string, number>;
  first: string | null;
  last: string | null;
} {
  const log = readLog();
  const by_role: Record<string, number> = {};
  const by_event: Record<string, number> = {};
  for (const e of log) {
    by_role[e.role] = (by_role[e.role] ?? 0) + 1;
    // Coarse event-kind — take everything before the first space
    const kind = e.event.split(' ')[0];
    by_event[kind] = (by_event[kind] ?? 0) + 1;
  }
  return {
    total: log.length,
    by_role,
    by_event,
    first: log[0]?.timestamp ?? null,
    last: log[log.length - 1]?.timestamp ?? null,
  };
}
