/**
 * useEliFraming — persistence contract. Mirrors useCalmMode.test.ts's
 * shape; the one deliberate difference is the default (on, not off) — see
 * the hook's own doc comment for why.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEliFraming } from './useEliFraming';

describe('useEliFraming', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts ENABLED by default, unlike calm mode', () => {
    const { result } = renderHook(() => useEliFraming());
    expect(result.current[0]).toBe(true);
  });

  it('toggle disables and writes localStorage', () => {
    const { result } = renderHook(() => useEliFraming());
    act(() => result.current[2]());
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem('vidhya.eli_framing')).toBe('0');
  });

  it('toggling twice returns to enabled and clears storage', () => {
    const { result } = renderHook(() => useEliFraming());
    act(() => result.current[2]());
    act(() => result.current[2]());
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem('vidhya.eli_framing')).toBeNull();
  });

  it('set(false) persists, set(true) clears the key back to the default', () => {
    const { result } = renderHook(() => useEliFraming());
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem('vidhya.eli_framing')).toBe('0');
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem('vidhya.eli_framing')).toBeNull();
  });

  it('rehydrates a disabled preference from localStorage on mount', () => {
    localStorage.setItem('vidhya.eli_framing', '0');
    const { result } = renderHook(() => useEliFraming());
    expect(result.current[0]).toBe(false);
  });

  it('an unrecognized stored value is treated as enabled (fails open toward showing framing)', () => {
    localStorage.setItem('vidhya.eli_framing', 'garbage');
    const { result } = renderHook(() => useEliFraming());
    expect(result.current[0]).toBe(true);
  });
});
