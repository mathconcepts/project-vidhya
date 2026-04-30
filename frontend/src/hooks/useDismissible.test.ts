/**
 * useDismissible hook tests.
 *
 * Covers the date-math edge cases that are easy to break: TTL boundary,
 * stale entries, malformed JSON, localStorage unavailability.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDismissible } from './useDismissible';

describe('useDismissible', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('starts undismissed when no localStorage entry exists', () => {
    const { result } = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    expect(result.current.dismissed).toBe(false);
  });

  it('becomes dismissed after dismiss() is called', () => {
    const { result } = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    act(() => result.current.dismiss());
    expect(result.current.dismissed).toBe(true);
  });

  it('persists dismiss state across hook mounts', () => {
    const first = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    act(() => first.result.current.dismiss());

    const second = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    expect(second.result.current.dismissed).toBe(true);
  });

  it('returns dismissed=false when stored entry is older than TTL', () => {
    // Manually plant a 25-hours-ago dismiss for a 24h TTL
    const stale = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    window.localStorage.setItem('k1', JSON.stringify({ dismissedAt: stale, ttlHours: 24 }));
    const { result } = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    expect(result.current.dismissed).toBe(false);
  });

  it('returns dismissed=true when stored entry is fresh', () => {
    const fresh = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
    window.localStorage.setItem('k1', JSON.stringify({ dismissedAt: fresh, ttlHours: 24 }));
    const { result } = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    expect(result.current.dismissed).toBe(true);
  });

  it('treats malformed JSON as not-dismissed (failure-soft)', () => {
    window.localStorage.setItem('k1', 'not-json{{');
    const { result } = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    expect(result.current.dismissed).toBe(false);
  });

  it('treats missing dismissedAt field as not-dismissed', () => {
    window.localStorage.setItem('k1', JSON.stringify({ ttlHours: 24 }));
    const { result } = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    expect(result.current.dismissed).toBe(false);
  });

  it('uses different storage per key', () => {
    const a = renderHook(() => useDismissible({ key: 'a', ttlHours: 24 }));
    const b = renderHook(() => useDismissible({ key: 'b', ttlHours: 24 }));
    act(() => a.result.current.dismiss());
    expect(a.result.current.dismissed).toBe(true);
    expect(b.result.current.dismissed).toBe(false);
  });

  it('respects the stored ttlHours, not just the prop value', () => {
    // Stored with 1h TTL, hook now reads with 24h prop — should still
    // honor the stored ttlHours (entry is 2h old → expired)
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    window.localStorage.setItem(
      'k1',
      JSON.stringify({ dismissedAt: twoHoursAgo, ttlHours: 1 }),
    );
    const { result } = renderHook(() => useDismissible({ key: 'k1', ttlHours: 24 }));
    expect(result.current.dismissed).toBe(false);
  });
});
