/**
 * useCalmMode — single-source hook for the "Calm" pillar (E1).
 *
 * When enabled:
 *   - AppLayout hides header, bottom nav, and floating tutor FAB
 *   - Lesson surface gets full vertical real estate (one concept centered)
 *   - `data-calm="true"` is written on <html> so descendant CSS can adapt
 *
 * Persisted to localStorage so the choice survives reload, and broadcast
 * via a window event so all subscribed components react atomically.
 */

import { useCallback, useEffect, useState } from 'react';

const KEY = 'vidhya.calm_mode';
const EVENT = 'vidhya:calm-mode-change';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function write(value: boolean) {
  try {
    if (value) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore quota / SSR */
  }
}

function applyAttr(value: boolean) {
  if (typeof document === 'undefined') return;
  if (value) document.documentElement.setAttribute('data-calm', 'true');
  else document.documentElement.removeAttribute('data-calm');
}

export function useCalmMode(): [boolean, (next: boolean) => void, () => void] {
  const [enabled, setEnabled] = useState<boolean>(() => read());

  useEffect(() => {
    applyAttr(enabled);
  }, [enabled]);

  useEffect(() => {
    const onChange = () => setEnabled(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const set = useCallback((next: boolean) => {
    write(next);
    applyAttr(next);
    setEnabled(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => {
    set(!read());
  }, [set]);

  return [enabled, set, toggle];
}
