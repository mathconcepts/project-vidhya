/**
 * useCalmMode — calm-mode persistence + DOM attribute contract.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalmMode } from './useCalmMode';

describe('useCalmMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-calm');
  });

  it('starts disabled by default', () => {
    const { result } = renderHook(() => useCalmMode());
    expect(result.current[0]).toBe(false);
    expect(document.documentElement.getAttribute('data-calm')).toBeNull();
  });

  it('toggle enables and writes data-calm + localStorage', () => {
    const { result } = renderHook(() => useCalmMode());
    act(() => result.current[2]());
    expect(result.current[0]).toBe(true);
    expect(document.documentElement.getAttribute('data-calm')).toBe('true');
    expect(localStorage.getItem('vidhya.calm_mode')).toBe('1');
  });

  it('set(false) clears state, attribute, and storage', () => {
    localStorage.setItem('vidhya.calm_mode', '1');
    const { result } = renderHook(() => useCalmMode());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(document.documentElement.getAttribute('data-calm')).toBeNull();
    expect(localStorage.getItem('vidhya.calm_mode')).toBeNull();
  });

  it('rehydrates from localStorage on mount', () => {
    localStorage.setItem('vidhya.calm_mode', '1');
    const { result } = renderHook(() => useCalmMode());
    expect(result.current[0]).toBe(true);
    expect(document.documentElement.getAttribute('data-calm')).toBe('true');
  });
});
