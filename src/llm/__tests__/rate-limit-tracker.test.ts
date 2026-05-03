import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  recordCall,
  outcomeFromStatus,
  snapshot,
  flushToDisk,
  readCheckpoint,
  renderDigestSection,
  _resetForTests,
} from '../rate-limit-tracker';

describe('outcomeFromStatus', () => {
  it.each([
    [200, 'success'],
    [201, 'success'],
    [400, 'other_error'],
    [401, 'other_error'],
    [404, 'other_error'],
    [429, 'rate_limited'],
    [500, 'server_error'],
    [502, 'server_error'],
    [503, 'server_error'],
    [504, 'server_error'],
    [-1, 'other_error'],
  ])('status %i → %s', (status, expected) => {
    expect(outcomeFromStatus(status)).toBe(expected);
  });
});

describe('recordCall + snapshot', () => {
  beforeEach(() => _resetForTests());

  it('counts calls per (provider, model)', () => {
    recordCall({ provider: 'gemini', model: 'flash-2.5', outcome: 'success', latency_ms: 100, ts: '2026-05-03T00:00:00Z' });
    recordCall({ provider: 'gemini', model: 'flash-2.5', outcome: 'rate_limited', latency_ms: 50, ts: '2026-05-03T00:00:01Z' });
    recordCall({ provider: 'openai', model: 'gpt-4o-mini', outcome: 'success', latency_ms: 200, ts: '2026-05-03T00:00:02Z' });
    const snap = snapshot();
    expect(snap.buckets.length).toBe(2);
    const g = snap.buckets.find((b) => b.provider === 'gemini')!;
    expect(g.total).toBe(2);
    expect(g.success).toBe(1);
    expect(g.rate_limited).toBe(1);
    expect(g.rate_limited_pct).toBeCloseTo(0.5, 5);
  });

  it('records last_429_at on rate_limited calls', () => {
    recordCall({ provider: 'gemini', model: 'm', outcome: 'rate_limited', latency_ms: 0, ts: '2026-05-03T00:01:00Z' });
    recordCall({ provider: 'gemini', model: 'm', outcome: 'success', latency_ms: 0, ts: '2026-05-03T00:02:00Z' });
    const snap = snapshot();
    expect(snap.buckets[0].last_429_at).toBe('2026-05-03T00:01:00Z');
  });

  it('computes p50 and p95 from latency ring', () => {
    for (let i = 1; i <= 100; i++) {
      recordCall({ provider: 'p', model: 'm', outcome: 'success', latency_ms: i, ts: '2026-05-03T00:00:00Z' });
    }
    const snap = snapshot();
    const b = snap.buckets[0];
    expect(b.p50_ms).toBeGreaterThan(40);
    expect(b.p50_ms).toBeLessThan(60);
    expect(b.p95_ms).toBeGreaterThan(90);
  });

  it('sorts buckets by total descending', () => {
    recordCall({ provider: 'low', model: 'm', outcome: 'success', latency_ms: 0, ts: 'now' });
    for (let i = 0; i < 5; i++) {
      recordCall({ provider: 'high', model: 'm', outcome: 'success', latency_ms: 0, ts: 'now' });
    }
    const snap = snapshot();
    expect(snap.buckets[0].provider).toBe('high');
    expect(snap.buckets[1].provider).toBe('low');
  });
});

describe('flushToDisk + readCheckpoint', () => {
  let tmp: string;
  let prev: string | undefined;

  beforeEach(() => {
    _resetForTests();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rate-limit-'));
    prev = process.env.VIDHYA_RATE_LIMIT_FILE;
    process.env.VIDHYA_RATE_LIMIT_FILE = path.join(tmp, 'rate-limits.json');
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.VIDHYA_RATE_LIMIT_FILE;
    else process.env.VIDHYA_RATE_LIMIT_FILE = prev;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writes JSON readable by readCheckpoint', () => {
    recordCall({ provider: 'p', model: 'm', outcome: 'success', latency_ms: 100, ts: 'now' });
    flushToDisk();
    const back = readCheckpoint();
    expect(back).not.toBeNull();
    expect(back!.buckets[0].provider).toBe('p');
    expect(back!.buckets[0].total).toBe(1);
  });

  it('readCheckpoint returns null when no file exists', () => {
    expect(readCheckpoint()).toBeNull();
  });

  it('readCheckpoint returns null on malformed file', () => {
    fs.writeFileSync(process.env.VIDHYA_RATE_LIMIT_FILE!, 'not json');
    expect(readCheckpoint()).toBeNull();
  });
});

describe('renderDigestSection', () => {
  beforeEach(() => _resetForTests());

  it('emits a no-data message when buckets are empty', () => {
    expect(renderDigestSection(snapshot())).toContain('No LLM calls recorded');
  });

  it('emits a markdown table with one row per bucket', () => {
    recordCall({ provider: 'gemini', model: 'flash-2.5', outcome: 'success', latency_ms: 100, ts: 'now' });
    const md = renderDigestSection(snapshot());
    expect(md).toContain('| gemini | flash-2.5 |');
    expect(md).toContain('## Rate limits hit this week');
  });

  it('flags hot buckets when rate_limited_pct > 5%', () => {
    for (let i = 0; i < 9; i++) {
      recordCall({ provider: 'p', model: 'm', outcome: 'success', latency_ms: 0, ts: 'now' });
    }
    recordCall({ provider: 'p', model: 'm', outcome: 'rate_limited', latency_ms: 0, ts: 'now' });
    const md = renderDigestSection(snapshot());
    expect(md).toContain('🔥 Hot buckets');
    expect(md).toContain('p/m');
  });

  it('does NOT flag hot buckets at exactly 5%', () => {
    for (let i = 0; i < 19; i++) {
      recordCall({ provider: 'p', model: 'm', outcome: 'success', latency_ms: 0, ts: 'now' });
    }
    recordCall({ provider: 'p', model: 'm', outcome: 'rate_limited', latency_ms: 0, ts: 'now' });
    const md = renderDigestSection(snapshot());
    expect(md).not.toContain('🔥 Hot buckets');
  });
});
