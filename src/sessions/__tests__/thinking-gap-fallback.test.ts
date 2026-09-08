/**
 * `deterministicGapFallback()` — the real, content-free explanation
 * `getThinkingGap` now returns instead of `{ text: null, source: 'unavailable' }`
 * whenever no chat LLM provider is configured. See thinking-gap-service.ts's
 * doc comment and /investigate's live-QA finding ("insight not available" on
 * a Laplace-transform PYQ item — actually a platform-wide missing-LLM-key
 * condition, not a per-item content gap).
 */
import { describe, it, expect } from 'vitest';
import { deterministicGapFallback } from '../thinking-gap-service';

describe('deterministicGapFallback', () => {
  it('names the sign flip for a sign-error mistake', () => {
    expect(deterministicGapFallback('sign_error')).toMatch(/sign/i);
  });

  it('names the factor-of-2 mistake for a factor-error mistake', () => {
    expect(deterministicGapFallback('factor_error')).toMatch(/factor of 2/i);
  });

  it('names the radians/degrees or π mistake for a pi-confusion mistake', () => {
    expect(deterministicGapFallback('pi_confusion')).toMatch(/π|radians|degrees/i);
  });

  it("tells the student nothing was entered for a no-attempt mistake", () => {
    expect(deterministicGapFallback('no_attempt')).toMatch(/no answer|nothing to diagnose/i);
  });

  it('falls back to a generic-but-real method-check sentence for an unclassified mistake', () => {
    const text = deterministicGapFallback('wrong_formula');
    expect(text.length).toBeGreaterThan(20);
    expect(text).not.toMatch(/no extra insight|unavailable/i);
  });

  it('never returns an empty string for an unknown error-type key', () => {
    // classifyErrorType is a closed set today, but the switch's default
    // branch must still hold if a new error type is ever added there
    // without a matching case here.
    const text = deterministicGapFallback('some_future_error_type');
    expect(text.length).toBeGreaterThan(20);
  });
});
