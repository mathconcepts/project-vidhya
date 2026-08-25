/**
 * useIntentLanesFlag — VIDHYA_INTENT_LANES config-flag contract (T4).
 *
 * Backed by GET /api/auth/config's `intent_lanes` field, module-cached like
 * useActiveExam. Covers: true/false/absent server values, fail-closed on a
 * network error or non-OK response, and the module-scope cache sharing one
 * fetch across mounts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIntentLanesFlag, resetIntentLanesFlagCache } from './useIntentLanesFlag';

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: async () => body } as Response);
}

beforeEach(() => {
  resetIntentLanesFlagCache();
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useIntentLanesFlag', () => {
  it('starts false before the fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useIntentLanesFlag());
    expect(result.current).toBe(false);
  });

  it('resolves true when the server sets intent_lanes: true', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ intent_lanes: true, channels: {} }));
    const { result } = renderHook(() => useIntentLanesFlag());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('resolves false when the server sets intent_lanes: false', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ intent_lanes: false, channels: {} }));
    const { result } = renderHook(() => useIntentLanesFlag());
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('resolves false when intent_lanes is absent from the config response', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ channels: {} }));
    const { result } = renderHook(() => useIntentLanesFlag());
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('fails closed (false) on a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useIntentLanesFlag());
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('fails closed (false) on a non-OK response', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ error: 'boom' }, false));
    const { result } = renderHook(() => useIntentLanesFlag());
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    // fetchAuthConfig doesn't check response.ok — it always calls .json();
    // a malformed/error body without intent_lanes still resolves to false.
    expect(result.current).toBe(false);
  });

  it('shares one fetch across two concurrent mounts (module-scope cache)', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ intent_lanes: true, channels: {} }));
    const first = renderHook(() => useIntentLanesFlag());
    const second = renderHook(() => useIntentLanesFlag());
    await waitFor(() => expect(first.result.current).toBe(true));
    await waitFor(() => expect(second.result.current).toBe(true));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
