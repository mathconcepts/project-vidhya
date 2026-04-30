/**
 * useDismissible — per-key dismiss state with TTL.
 *
 * v4.0 retention pass: shared by CompoundingCard, DigestChip, WelcomeBackCard.
 * Each card needs the same logic — read localStorage, parse expiry, expose
 * dismiss() — so we factor it once.
 *
 * Storage shape: `{ key: <key>, dismissedAt: <ISO>, ttlHours: <number> }`
 *
 * Reads/writes localStorage; returns inert defaults under SSR or when
 * localStorage is unavailable (private mode, denylisted).
 */

import { useCallback, useEffect, useState } from 'react';

interface UseDismissibleOptions {
  /** Storage key. Use a date suffix for per-day, ISO week for per-week, etc. */
  key: string;
  /** Hours until the dismiss expires. 24 = once per day. */
  ttlHours: number;
}

interface UseDismissibleResult {
  /** True if currently dismissed and within TTL window. */
  dismissed: boolean;
  /** Mark as dismissed. */
  dismiss: () => void;
}

function safeRead(key: string): { dismissedAt: string; ttlHours: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.dismissedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: object) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage disabled, denied, or full — fail silently. Card will
    // re-appear on next mount, which is the safer fallback than crashing.
  }
}

export function useDismissible({ key, ttlHours }: UseDismissibleOptions): UseDismissibleResult {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = safeRead(key);
    if (!stored) {
      setDismissed(false);
      return;
    }
    const dismissedAt = Date.parse(stored.dismissedAt);
    if (!Number.isFinite(dismissedAt)) {
      setDismissed(false);
      return;
    }
    const ageHours = (Date.now() - dismissedAt) / (1000 * 60 * 60);
    setDismissed(ageHours < (stored.ttlHours ?? ttlHours));
  }, [key, ttlHours]);

  const dismiss = useCallback(() => {
    safeWrite(key, {
      dismissedAt: new Date().toISOString(),
      ttlHours,
    });
    setDismissed(true);
  }, [key, ttlHours]);

  return { dismissed, dismiss };
}
