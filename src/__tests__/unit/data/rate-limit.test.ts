// @ts-nocheck
/**
 * Unit tests for the rate limiter.
 *
 * Covers:
 *   - Allowed within bucket capacity
 *   - Denied when bucket exhausted
 *   - Lazy refill — wait → tokens come back
 *   - Per-actor isolation (one user's drain doesn't affect another)
 *   - Per-endpoint isolation (chat drain doesn't affect content-studio)
 *   - Unknown endpoint allowed (fail-open default)
 *   - Override per-call works
 *   - getRateLimitStats returns accurate counts
 *   - VIDHYA_RATE_LIMIT_DISABLED short-circuits to allowed
 *     (verified at module-load time so this is a separate test file)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, _resetForTests, getRateLimitStats } from '../../../lib/rate-limit';

beforeEach(() => {
  _resetForTests();
});

describe('rate limiter', () => {
  it('allows requests within capacity', () => {
    // chat: capacity 30
    for (let i = 0; i < 30; i++) {
      const r = checkRateLimit('chat', 'user-A');
      expect(r.allowed).toBe(true);
    }
  });

  it('denies once bucket is exhausted', () => {
    for (let i = 0; i < 30; i++) checkRateLimit('chat', 'user-B');
    const r = checkRateLimit('chat', 'user-B');
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retry_after_ms).toBeGreaterThan(0);
  });

  it('per-actor isolation — user-A drain does not affect user-B', () => {
    for (let i = 0; i < 30; i++) checkRateLimit('chat', 'user-A');
    expect(checkRateLimit('chat', 'user-A').allowed).toBe(false);
    // user-B has fresh bucket
    expect(checkRateLimit('chat', 'user-B').allowed).toBe(true);
  });

  it('per-endpoint isolation — chat drain does not affect content-studio', () => {
    for (let i = 0; i < 30; i++) checkRateLimit('chat', 'user-A');
    expect(checkRateLimit('chat', 'user-A').allowed).toBe(false);
    // Content-studio bucket for the same user is untouched
    expect(checkRateLimit('content-studio.generate', 'user-A').allowed).toBe(true);
  });

  it('unknown endpoint is allowed (fail-open)', () => {
    for (let i = 0; i < 100; i++) {
      const r = checkRateLimit('not-a-real-endpoint', 'user-A');
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(Infinity);
    }
  });

  it('override capacity is respected', () => {
    const tiny = { capacity: 2, refill_per_sec: 1 };
    expect(checkRateLimit('foo', 'u1', tiny).allowed).toBe(true);
    expect(checkRateLimit('foo', 'u1', tiny).allowed).toBe(true);
    // 3rd is denied
    const r = checkRateLimit('foo', 'u1', tiny);
    expect(r.allowed).toBe(false);
  });

  it('lazy refill — after waiting, tokens come back', async () => {
    // Use a fast-refill override so the test doesn't take seconds
    const fast = { capacity: 2, refill_per_sec: 50 };  // 50 tokens/sec = 1 token per 20ms
    expect(checkRateLimit('foo', 'u-refill', fast).allowed).toBe(true);
    expect(checkRateLimit('foo', 'u-refill', fast).allowed).toBe(true);
    expect(checkRateLimit('foo', 'u-refill', fast).allowed).toBe(false);
    // Wait 50ms — should refill ~2.5 tokens
    await new Promise(r => setTimeout(r, 50));
    const r = checkRateLimit('foo', 'u-refill', fast);
    expect(r.allowed).toBe(true);
  });

  it('reports stats per endpoint', () => {
    checkRateLimit('chat', 'user-A');
    checkRateLimit('chat', 'user-B');
    checkRateLimit('content-library.write', 'user-A');
    const stats = getRateLimitStats();
    expect(stats.total_buckets).toBe(3);
    expect(stats.by_endpoint['chat']).toBe(2);
    expect(stats.by_endpoint['content-library.write']).toBe(1);
  });

  // ── New endpoints in DEFAULT_LIMITS ──

  it('gemini-proxy endpoints are in DEFAULT_LIMITS with sensible caps', () => {
    // classify-error 60/min — 60 calls allowed, 61st denied
    for (let i = 0; i < 60; i++) {
      expect(checkRateLimit('gemini.classify-error', 'session-A').allowed).toBe(true);
    }
    expect(checkRateLimit('gemini.classify-error', 'session-A').allowed).toBe(false);
  });

  it('gemini.vision-ocr has tighter cap than gemini.embed (vision is pricier)', () => {
    // vision-ocr: 20/min
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit('gemini.vision-ocr', 'session-V').allowed).toBe(true);
    }
    expect(checkRateLimit('gemini.vision-ocr', 'session-V').allowed).toBe(false);
    // embed: 100/min — much more permissive
    for (let i = 0; i < 100; i++) {
      expect(checkRateLimit('gemini.embed', 'session-E').allowed).toBe(true);
    }
    expect(checkRateLimit('gemini.embed', 'session-E').allowed).toBe(false);
  });

  it('gate.verify-any is bucketed separately from gemini.* endpoints', () => {
    // Drain gate.verify-any — 30/min
    for (let i = 0; i < 30; i++) checkRateLimit('gate.verify-any', 'session-X');
    expect(checkRateLimit('gate.verify-any', 'session-X').allowed).toBe(false);
    // gemini.chat for the same actor still has full quota
    expect(checkRateLimit('gemini.chat', 'session-X').allowed).toBe(true);
  });

  it('gemini-proxy buckets isolate per-actor (sessionId vs IP)', () => {
    // Drain session:abc — 60 capacity for classify-error
    for (let i = 0; i < 60; i++) checkRateLimit('gemini.classify-error', 'session:abc');
    expect(checkRateLimit('gemini.classify-error', 'session:abc').allowed).toBe(false);
    // ip:127.0.0.1 has its own bucket
    expect(checkRateLimit('gemini.classify-error', 'ip:127.0.0.1').allowed).toBe(true);
  });
});
