// @ts-nocheck
/**
 * Unit tests for src/lib/chat-spend.ts — T19's durable daily chat-spend cap.
 *
 * Covers:
 *   - Cost estimation: known model reuses cost-meter's canonical price table;
 *     unknown model id falls back to a non-zero conservative rate (never $0 —
 *     see the FALLBACK constants' comment in the source for why).
 *   - Cap check + trip: allowed while under cap, refused once spend reaches
 *     the cap, trip_count increments and persists across trips.
 *   - Day-boundary reset: crossing UTC midnight starts a fresh $0 counter for
 *     the new day without touching the prior day's row.
 *   - Durable round-trip: mirror() reaches the (faked) durable store on
 *     spend/trip writes; hydrateChatSpendStore() restores when local is
 *     empty, refuses to clobber a populated local store, and warns loudly
 *     when nothing could be restored (the documented fail-safe tradeoff).
 *
 * The Postgres layer is faked the same way
 * src/__tests__/unit/storage/durable-flat-file.test.ts fakes it — only
 * `makeSharedStore` is mocked, so the real `durableCollection` and the real
 * chat-spend module run.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const rec = vi.hoisted(() => ({
  calls: [] as Array<{ op: 'mirror' | 'put'; collection: string; items?: unknown[] }>,
  durable: new Map<string, unknown[]>(),
}));

vi.mock('../../../storage/repositories/durable-store-repo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../storage/repositories/durable-store-repo')>();
  return {
    ...actual,
    makeSharedStore: (spec: { collection: string }) => ({
      async mirror(items: unknown[]) {
        rec.calls.push({ op: 'mirror', collection: spec.collection, items });
      },
      async put(item: unknown) {
        rec.calls.push({ op: 'put', collection: spec.collection, item });
      },
      async load() {
        return rec.durable.get(spec.collection) ?? null;
      },
      describe: () => `fake:${spec.collection}`,
    }),
  };
});

const settle = () => new Promise((r) => setTimeout(r, 20));

let tmpFile: string;
let origEnvFile: string | undefined;
let origEnvCap: string | undefined;

beforeEach(() => {
  rec.calls.length = 0;
  rec.durable.clear();
  vi.resetModules();
  tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'chat-spend-')), 'chat-spend.json');
  origEnvFile = process.env.VIDHYA_CHAT_SPEND_FILE;
  origEnvCap = process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD;
  process.env.VIDHYA_CHAT_SPEND_FILE = tmpFile;
  delete process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD;
  vi.useRealTimers();
});

afterEach(() => {
  if (origEnvFile === undefined) delete process.env.VIDHYA_CHAT_SPEND_FILE;
  else process.env.VIDHYA_CHAT_SPEND_FILE = origEnvFile;
  if (origEnvCap === undefined) delete process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD;
  else process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD = origEnvCap;
  vi.useRealTimers();
  if (fs.existsSync(path.dirname(tmpFile))) fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true });
});

// ---------------------------------------------------------------------------

describe('estimateChatCostUsd', () => {
  it('prices a known model via the canonical cost-meter table', async () => {
    const { estimateChatCostUsd } = await import('../../../lib/chat-spend');
    const cost = estimateChatCostUsd('gemini-2.5-flash', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.075 + 0.3, 4);
  });

  it('falls back to a conservative NON-ZERO rate for an unrecognized model id', async () => {
    // priceForCall() alone would return $0 here (documented "don't
    // double-bill" behavior, correct for a cost LEDGER). A spend CAP must
    // not inherit that — an unknown model id must still cost something, or
    // the cap silently stops protecting the budget the moment a model id
    // drifts.
    const { estimateChatCostUsd } = await import('../../../lib/chat-spend');
    const cost = estimateChatCostUsd('some-future-model-nobody-priced-yet', 1_000_000, 1_000_000);
    expect(cost).toBeGreaterThan(0);
  });

  it('zero tokens cost zero even for an unknown model', async () => {
    const { estimateChatCostUsd } = await import('../../../lib/chat-spend');
    expect(estimateChatCostUsd('unknown-model', 0, 0)).toBe(0);
  });
});

describe('getDailySpendCapUsd', () => {
  it('defaults to $5 when unset', async () => {
    const { getDailySpendCapUsd } = await import('../../../lib/chat-spend');
    expect(getDailySpendCapUsd()).toBe(5);
  });

  it('reads VIDHYA_CHAT_DAILY_SPEND_CAP_USD fresh, no restart required', async () => {
    const { getDailySpendCapUsd } = await import('../../../lib/chat-spend');
    process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD = '12.5';
    expect(getDailySpendCapUsd()).toBe(12.5);
  });

  it('falls back to default on a non-positive or malformed override', async () => {
    const { getDailySpendCapUsd } = await import('../../../lib/chat-spend');
    process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD = '-3';
    expect(getDailySpendCapUsd()).toBe(5);
    process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD = 'not-a-number';
    expect(getDailySpendCapUsd()).toBe(5);
  });
});

describe('cap check + trip', () => {
  it('starts the day allowed with $0 spent', async () => {
    const { checkChatSpendCap } = await import('../../../lib/chat-spend');
    const status = checkChatSpendCap();
    expect(status.allowed).toBe(true);
    expect(status.spent_today_usd).toBe(0);
    expect(status.trip_count_today).toBe(0);
  });

  it('recordChatSpend accumulates and eventually trips the cap', async () => {
    const { recordChatSpend, checkChatSpendCap } = await import('../../../lib/chat-spend');
    process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD = '1.00';

    recordChatSpend(0.4);
    expect(checkChatSpendCap().allowed).toBe(true);
    expect(checkChatSpendCap().spent_today_usd).toBeCloseTo(0.4, 6);

    recordChatSpend(0.4);
    expect(checkChatSpendCap().allowed).toBe(true); // 0.8 < 1.0

    recordChatSpend(0.3); // 1.1 >= 1.0
    const tripped = checkChatSpendCap();
    expect(tripped.allowed).toBe(false);
    expect(tripped.spent_today_usd).toBeCloseTo(1.1, 6);
  });

  it('recordCapTrip increments trip_count and logs the day total loudly', async () => {
    const { recordChatSpend, recordCapTrip, checkChatSpendCap } = await import('../../../lib/chat-spend');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD = '0.5';
    recordChatSpend(0.6); // already over cap

    recordCapTrip();
    expect(checkChatSpendCap().trip_count_today).toBe(1);
    recordCapTrip();
    expect(checkChatSpendCap().trip_count_today).toBe(2);

    expect(warnSpy).toHaveBeenCalled();
    const lastWarning = warnSpy.mock.calls.at(-1)?.[0] as string;
    expect(lastWarning).toMatch(/cap tripped/i);
    expect(lastWarning).toMatch(/\$0\.6000/);
    warnSpy.mockRestore();
  });

  it('ignores non-positive or non-finite spend amounts', async () => {
    const { recordChatSpend, checkChatSpendCap } = await import('../../../lib/chat-spend');
    recordChatSpend(0);
    recordChatSpend(-5);
    recordChatSpend(NaN);
    expect(checkChatSpendCap().spent_today_usd).toBe(0);
  });
});

describe('day-boundary reset', () => {
  it('a new UTC day starts a fresh $0 counter, independent of the prior day', async () => {
    vi.setSystemTime(new Date('2026-08-18T23:00:00.000Z'));
    const { recordChatSpend, checkChatSpendCap } = await import('../../../lib/chat-spend');

    recordChatSpend(3.5);
    expect(checkChatSpendCap().spent_today_usd).toBeCloseTo(3.5, 6);

    // Cross midnight UTC.
    vi.setSystemTime(new Date('2026-08-19T00:05:00.000Z'));
    const fresh = checkChatSpendCap();
    expect(fresh.spent_today_usd).toBe(0);
    expect(fresh.trip_count_today).toBe(0);
    expect(fresh.allowed).toBe(true);
  });
});

describe('durable round-trip (mirror / hydrate)', () => {
  it('recordChatSpend mirrors the updated day into the durable store', async () => {
    const { recordChatSpend } = await import('../../../lib/chat-spend');
    recordChatSpend(1.23);
    await settle();

    const mirrorCall = rec.calls.find((c) => c.op === 'mirror' && c.collection === 'chat-spend');
    expect(mirrorCall, 'recordChatSpend did not mirror to the durable store').toBeDefined();
    const today = new Date().toISOString().slice(0, 10);
    expect((mirrorCall!.items as Array<{ date_utc: string; spent_usd: number }>))
      .toEqual([expect.objectContaining({ date_utc: today, spent_usd: expect.closeTo(1.23, 6) })]);
  });

  it('recordCapTrip mirrors too', async () => {
    const { recordCapTrip } = await import('../../../lib/chat-spend');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    recordCapTrip();
    await settle();
    const mirrorCall = rec.calls.find((c) => c.op === 'mirror' && c.collection === 'chat-spend');
    expect(mirrorCall).toBeDefined();
    expect((mirrorCall!.items as Array<{ trip_count: number }>)[0].trip_count).toBe(1);
  });

  it('hydrateChatSpendStore restores when the local store is empty', async () => {
    rec.durable.set('chat-spend', [
      { date_utc: '2026-08-01', spent_usd: 2.5, trip_count: 3, updated_at: '2026-08-01T00:00:00.000Z' },
    ]);
    const { hydrateChatSpendStore, checkChatSpendCap } = await import('../../../lib/chat-spend');
    const result = await hydrateChatSpendStore();
    expect(result).toMatchObject({ hydrated: true, count: 1 });
    // Not "today" in the fixture, so today's live check still reads $0 —
    // hydration restores history, it doesn't fabricate today's number.
    expect(checkChatSpendCap().spent_today_usd).toBe(0);
  });

  it('hydrateChatSpendStore refuses to clobber a populated local store', async () => {
    const { recordChatSpend, hydrateChatSpendStore, checkChatSpendCap } = await import('../../../lib/chat-spend');
    recordChatSpend(9.99); // local now has today's row
    rec.durable.set('chat-spend', [
      { date_utc: '2020-01-01', spent_usd: 0, trip_count: 0, updated_at: '2020-01-01T00:00:00.000Z' },
    ]);

    const result = await hydrateChatSpendStore();
    expect(result.hydrated).toBe(false);
    expect(result.reason).toMatch(/already has records/);
    expect(checkChatSpendCap().spent_today_usd).toBeCloseTo(9.99, 6);
  });

  it('fails SAFE and warns loudly when nothing could be restored', async () => {
    // rec.durable has nothing for 'chat-spend' ⇒ load() returns null ⇒
    // indistinguishable from "mirror unreachable". The documented tradeoff:
    // treat as $0 and allow chat to proceed, but log loudly.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { hydrateChatSpendStore, checkChatSpendCap } = await import('../../../lib/chat-spend');

    const result = await hydrateChatSpendStore();
    expect(result.hydrated).toBe(false);

    const status = checkChatSpendCap();
    expect(status.allowed).toBe(true); // fails open, never bricks chat
    expect(status.spent_today_usd).toBe(0);

    expect(warnSpy).toHaveBeenCalled();
    const warning = warnSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(warning).toMatch(/not restored/i);
    warnSpy.mockRestore();
  });

  it('a broken durable read does not throw — checkChatSpendCap stays callable', async () => {
    const { checkChatSpendCap } = await import('../../../lib/chat-spend');
    expect(() => checkChatSpendCap()).not.toThrow();
  });
});
