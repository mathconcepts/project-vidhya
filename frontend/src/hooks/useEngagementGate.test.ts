/**
 * useEngagementGate — a minimum think-time before an advance control
 * becomes tappable (/design-review, 2026-09-06). Scaled by word count,
 * floor/ceiling clamped, re-arms on `key` change, and does NOT collapse
 * under prefers-reduced-motion (that preference governs decorative
 * animation, not reading time).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { engagementGateMs, useEngagementGate } from './useEngagementGate';

describe('engagementGateMs', () => {
  it('clamps very short text to the 1200ms floor', () => {
    expect(engagementGateMs('short')).toBe(1200);
    expect(engagementGateMs('')).toBe(1200);
  });

  it('clamps very long text to the 5000ms ceiling', () => {
    const longText = new Array(80).fill('word').join(' ');
    expect(engagementGateMs(longText)).toBe(5000);
  });

  it('scales roughly linearly with word count between the floor and ceiling', () => {
    // 30 words at 140 wpm ≈ 12857ms — clamp check aside, a longer text
    // must never produce a SHORTER gate than a shorter text.
    const short = engagementGateMs('one two three four five');
    const mid = engagementGateMs(new Array(20).fill('word').join(' '));
    expect(mid).toBeGreaterThan(short);
  });
});

describe('useEngagementGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts not-ready', () => {
    const { result } = renderHook(() => useEngagementGate('a short prompt', 'step-0'));
    expect(result.current).toBe(false);
  });

  it('becomes ready once the gate duration elapses', async () => {
    const { result } = renderHook(() => useEngagementGate('a short prompt', 'step-0'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(result.current).toBe(true);
  });

  it('re-arms (goes back to not-ready) when `key` changes', async () => {
    const { result, rerender } = renderHook(
      ({ text, key }) => useEngagementGate(text, key),
      { initialProps: { text: 'a short prompt', key: 'step-0' } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(result.current).toBe(true);

    rerender({ text: 'a different phase of text', key: 'step-1' });
    expect(result.current).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(result.current).toBe(true);
  });

  it('does not re-arm when only the text identity changes but `key` stays the same', async () => {
    const { result, rerender } = renderHook(
      ({ text, key }) => useEngagementGate(text, key),
      { initialProps: { text: 'a short prompt', key: 'step-0' } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(result.current).toBe(true);

    // Same key, new string instance with identical/different content —
    // the hook is keyed on the caller's declared re-arm signal, not on
    // text identity, so this must NOT flip back to not-ready.
    rerender({ text: 'a short prompt (re-rendered)', key: 'step-0' });
    expect(result.current).toBe(true);
  });
});
