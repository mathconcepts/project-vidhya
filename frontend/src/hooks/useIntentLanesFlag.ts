/**
 * useIntentLanesFlag — reads the VIDHYA_INTENT_LANES feature flag.
 *
 * Backed by GET /api/auth/config's `intent_lanes` field (T4, intent-driven
 * content restructure §5/§7 Phase 2) — the same endpoint + boolean-flag
 * convention `local_dev` and `demo_mode` already use (see auth-routes.ts's
 * handleConfig). Cached in module scope so every concept page mounting the
 * DPS block / atom reorder shares one network call, mirroring
 * useActiveExam.ts's cache pattern.
 *
 * Fails closed: a network error or non-OK response resolves to `false` —
 * an unreachable config endpoint must never turn the flag "on" by accident.
 */

import { useEffect, useState } from 'react';
import { fetchAuthConfig } from '@/lib/auth/client';

let _cache: boolean | null = null;
let _inflight: Promise<boolean> | null = null;

async function fetchIntentLanesFlag(): Promise<boolean> {
  if (_cache !== null) return _cache;
  if (_inflight) return _inflight;
  _inflight = fetchAuthConfig()
    .then((config) => {
      const value = config.intent_lanes === true;
      _cache = value;
      return value;
    })
    .catch(() => false)
    .finally(() => {
      _inflight = null;
    });
  return _inflight;
}

/** Test-only: clears the module cache so a test can simulate a fresh load. */
export function resetIntentLanesFlagCache(): void {
  _cache = null;
  _inflight = null;
}

export function useIntentLanesFlag(): boolean {
  const [enabled, setEnabled] = useState<boolean>(_cache ?? false);

  useEffect(() => {
    if (_cache !== null) {
      setEnabled(_cache);
      return;
    }
    let cancelled = false;
    fetchIntentLanesFlag().then((value) => {
      if (!cancelled) setEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
