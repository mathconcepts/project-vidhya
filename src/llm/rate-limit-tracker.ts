/**
 * src/llm/rate-limit-tracker.ts
 *
 * Tracks LLM call outcomes per (provider, model). Surfaces:
 *   - request count
 *   - 429 count (rate-limited)
 *   - 5xx count (provider errors)
 *   - success count
 *   - latency p50 / p95 (rough — running quantiles via sorted ring)
 *
 * In-memory + periodic flat-file checkpoint. The learnings-ledger weekly
 * digest reads the checkpoint file and includes a "Rate limits hit this
 * week" section.
 *
 * SURVEILLANCE NOTE: this tracks PROVIDER call outcomes, not student
 * behaviour. No user_id, no session_id, no atom_id ever recorded here.
 * Surveillance invariant 1 (no behavioural columns) is unaffected.
 */

import fs from 'fs';
import path from 'path';

export type CallOutcome = 'success' | 'rate_limited' | 'server_error' | 'other_error';

export interface CallEvent {
  provider: string;
  model: string;
  outcome: CallOutcome;
  /** Round-trip latency in ms; -1 if not measured. */
  latency_ms: number;
  /** ISO timestamp of the call. */
  ts: string;
}

interface BucketStats {
  total: number;
  success: number;
  rate_limited: number;
  server_error: number;
  other_error: number;
  /** Rolling window of recent latencies (capped). */
  latencies: number[];
}

const LATENCY_RING_SIZE = 200;
const FLUSH_INTERVAL_HOURS = 1;

// In-memory state. Keyed by `${provider}::${model}`.
const buckets = new Map<string, BucketStats>();

// Last seen 429 timestamps per bucket — for "is currently throttled?" UI.
const last429: Map<string, string> = new Map();

let lastFlushAt: string = new Date().toISOString();

// ----------------------------------------------------------------------------

export function recordCall(event: CallEvent): void {
  const key = bucketKey(event.provider, event.model);
  const b = buckets.get(key) ?? newBucket();
  b.total++;
  b[event.outcome]++;
  if (event.latency_ms >= 0) {
    b.latencies.push(event.latency_ms);
    if (b.latencies.length > LATENCY_RING_SIZE) b.latencies.shift();
  }
  buckets.set(key, b);
  if (event.outcome === 'rate_limited') last429.set(key, event.ts);
}

/**
 * Classify an HTTP status into our outcome enum. Used by the wiring
 * layer in callChat / callBatch.
 */
export function outcomeFromStatus(status: number): CallOutcome {
  if (status >= 200 && status < 300) return 'success';
  if (status === 429) return 'rate_limited';
  if (status >= 500 && status < 600) return 'server_error';
  return 'other_error';
}

/**
 * Snapshot of current state. Used by the digest + admin debug.
 */
export interface RateLimitSnapshot {
  generated_at: string;
  buckets: Array<{
    provider: string;
    model: string;
    total: number;
    success: number;
    rate_limited: number;
    server_error: number;
    other_error: number;
    rate_limited_pct: number;
    last_429_at: string | null;
    p50_ms: number;
    p95_ms: number;
  }>;
}

export function snapshot(): RateLimitSnapshot {
  const now = new Date().toISOString();
  const out: RateLimitSnapshot = { generated_at: now, buckets: [] };
  for (const [key, b] of buckets.entries()) {
    const [provider, model] = key.split('::');
    const sorted = [...b.latencies].sort((a, c) => a - c);
    out.buckets.push({
      provider,
      model,
      total: b.total,
      success: b.success,
      rate_limited: b.rate_limited,
      server_error: b.server_error,
      other_error: b.other_error,
      rate_limited_pct: b.total === 0 ? 0 : b.rate_limited / b.total,
      last_429_at: last429.get(key) ?? null,
      p50_ms: percentile(sorted, 0.5),
      p95_ms: percentile(sorted, 0.95),
    });
  }
  out.buckets.sort((a, b) => b.total - a.total);
  return out;
}

/**
 * Persist the current snapshot to disk. Idempotent — safe to call
 * repeatedly. Path overridable via VIDHYA_RATE_LIMIT_FILE for tests.
 */
export function flushToDisk(): string {
  const file = process.env.VIDHYA_RATE_LIMIT_FILE
    ?? path.join(process.cwd(), '.data', 'rate-limits.json');
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const snap = snapshot();
  fs.writeFileSync(file, JSON.stringify(snap, null, 2));
  lastFlushAt = snap.generated_at;
  return file;
}

/** Read the most recent on-disk checkpoint. Returns null if none. */
export function readCheckpoint(): RateLimitSnapshot | null {
  const file = process.env.VIDHYA_RATE_LIMIT_FILE
    ?? path.join(process.cwd(), '.data', 'rate-limits.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as RateLimitSnapshot;
  } catch {
    return null;
  }
}

/** Render a markdown section for inclusion in the weekly learnings digest. */
export function renderDigestSection(snap: RateLimitSnapshot): string {
  if (snap.buckets.length === 0) {
    return '## Rate limits\n\nNo LLM calls recorded this window.\n';
  }
  const lines: string[] = ['## Rate limits hit this week', ''];
  lines.push('| Provider | Model | Calls | 429s | 429% | 5xx | p50 | p95 |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const b of snap.buckets) {
    lines.push(
      `| ${b.provider} | ${b.model} | ${b.total} | ${b.rate_limited} | ${(b.rate_limited_pct * 100).toFixed(1)}% | ${b.server_error} | ${b.p50_ms.toFixed(0)}ms | ${b.p95_ms.toFixed(0)}ms |`,
    );
  }
  const hot = snap.buckets.filter((b) => b.rate_limited_pct > 0.05);
  if (hot.length > 0) {
    lines.push('');
    lines.push('**🔥 Hot buckets** (>5% 429s):');
    for (const b of hot) {
      lines.push(`- \`${b.provider}/${b.model}\` — ${(b.rate_limited_pct * 100).toFixed(1)}% throttled. Consider routing through batch or backing off.`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

/** Reset for tests. Not for production use. */
export function _resetForTests(): void {
  buckets.clear();
  last429.clear();
}

export function _stateForTests() {
  return { buckets, last429, lastFlushAt, FLUSH_INTERVAL_HOURS };
}

// ----------------------------------------------------------------------------

function bucketKey(provider: string, model: string): string {
  return `${provider}::${model}`;
}

function newBucket(): BucketStats {
  return { total: 0, success: 0, rate_limited: 0, server_error: 0, other_error: 0, latencies: [] };
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * p));
  return sortedAsc[idx];
}
