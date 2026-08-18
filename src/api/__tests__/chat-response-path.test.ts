/**
 * T19 chat off-corpus guardrails — the pure decision logic in
 * src/api/chat-routes.ts.
 *
 * `resolveChatResponsePath` is the one branch point handleChat's SSE loop
 * defers to for "what do we actually serve this turn." Pulled out as a pure
 * function specifically so the atom-first invariant can be locked without
 * standing up the whole route (Postgres pool, vector store, GBrain task
 * reasoner, SSE response object).
 *
 * `chatRateLimitOverride` is the env-driven override for the per-session
 * rate limiter (VIDHYA_CHAT_RATE_LIMIT / VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveChatResponsePath, chatRateLimitOverride } from '../chat-routes';

describe('resolveChatResponsePath — atom-first invariant', () => {
  it('an atom match ALWAYS wins, regardless of LLM availability or spend-cap state', () => {
    // All four combinations of the other two flags — hasAtom must dominate
    // every one of them. This is the property the LLM fallback's two
    // guardrails (spend cap, rate limit-adjacent "no LLM configured" path)
    // must never be able to override.
    for (const llmAvailable of [true, false]) {
      for (const spendCapAllowed of [true, false]) {
        expect(resolveChatResponsePath({ hasAtom: true, llmAvailable, spendCapAllowed })).toBe('atom');
      }
    }
  });

  it('the LLM fallback is reached ONLY on an atom miss, with LLM available and cap not tripped', () => {
    expect(resolveChatResponsePath({ hasAtom: false, llmAvailable: true, spendCapAllowed: true })).toBe('llm_stream');
  });

  it('no LLM configured refuses honestly, even though there is no atom', () => {
    expect(resolveChatResponsePath({ hasAtom: false, llmAvailable: false, spendCapAllowed: true })).toBe('no_llm_configured');
    // spend-cap state is irrelevant once there's no LLM to gate at all
    expect(resolveChatResponsePath({ hasAtom: false, llmAvailable: false, spendCapAllowed: false })).toBe('no_llm_configured');
  });

  it('spend-cap tripped refuses the LLM path, but only when an LLM IS otherwise available', () => {
    expect(resolveChatResponsePath({ hasAtom: false, llmAvailable: true, spendCapAllowed: false })).toBe('spend_cap_tripped');
  });

  it('every path is one of the four documented outcomes — no silent fifth case', () => {
    const outcomes = new Set<string>();
    for (const hasAtom of [true, false]) {
      for (const llmAvailable of [true, false]) {
        for (const spendCapAllowed of [true, false]) {
          outcomes.add(resolveChatResponsePath({ hasAtom, llmAvailable, spendCapAllowed }));
        }
      }
    }
    expect(outcomes).toEqual(new Set(['atom', 'no_llm_configured', 'spend_cap_tripped', 'llm_stream']));
  });
});

describe('chatRateLimitOverride', () => {
  let origLimit: string | undefined;
  let origWindow: string | undefined;

  beforeEach(() => {
    origLimit = process.env.VIDHYA_CHAT_RATE_LIMIT;
    origWindow = process.env.VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC;
    delete process.env.VIDHYA_CHAT_RATE_LIMIT;
    delete process.env.VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC;
  });

  afterEach(() => {
    if (origLimit === undefined) delete process.env.VIDHYA_CHAT_RATE_LIMIT;
    else process.env.VIDHYA_CHAT_RATE_LIMIT = origLimit;
    if (origWindow === undefined) delete process.env.VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC;
    else process.env.VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC = origWindow;
  });

  it('returns undefined (default DEFAULT_LIMITS applies) when unset', () => {
    expect(chatRateLimitOverride()).toBeUndefined();
  });

  it('builds a capacity/refill override from VIDHYA_CHAT_RATE_LIMIT + window', () => {
    process.env.VIDHYA_CHAT_RATE_LIMIT = '10';
    process.env.VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC = '30';
    expect(chatRateLimitOverride()).toEqual({ capacity: 10, refill_per_sec: 10 / 30 });
  });

  it('defaults the window to 60s when only the count is set', () => {
    process.env.VIDHYA_CHAT_RATE_LIMIT = '5';
    expect(chatRateLimitOverride()).toEqual({ capacity: 5, refill_per_sec: 5 / 60 });
  });

  it('falls back to undefined on a non-positive or malformed count', () => {
    process.env.VIDHYA_CHAT_RATE_LIMIT = '0';
    expect(chatRateLimitOverride()).toBeUndefined();
    process.env.VIDHYA_CHAT_RATE_LIMIT = 'not-a-number';
    expect(chatRateLimitOverride()).toBeUndefined();
  });

  it('ignores a malformed window and falls back to the 60s default', () => {
    process.env.VIDHYA_CHAT_RATE_LIMIT = '8';
    process.env.VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC = 'garbage';
    expect(chatRateLimitOverride()).toEqual({ capacity: 8, refill_per_sec: 8 / 60 });
  });
});
