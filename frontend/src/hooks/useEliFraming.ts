/**
 * useEliFraming — single-source hook for the "why is this here" framing
 * line shown above interactive widgets and ConceptMathViz (live-QA finding,
 * 2026-09-03: students couldn't tell why an interactive or exploration
 * widget was on the page at all).
 *
 * Defaults to ON (framing shown) — unlike useCalmMode, which defaults off.
 * A struggling or new student benefits from the framing by default; an
 * advanced student who finds it repetitive can turn it off once via the
 * "Hide these tips" link WhyThisHelps renders alongside the text, and the
 * choice persists exactly like Calm Mode's (localStorage + a same-tab
 * broadcast event so every mounted WhyThisHelps reacts atomically).
 */

import { useCallback, useEffect, useState } from 'react';

const KEY = 'vidhya.eli_framing';
const EVENT = 'vidhya:eli-framing-change';

function read(): boolean {
  try {
    // Absent (never toggled) or any value other than '0' means enabled —
    // the default-on contract lives in this one comparison.
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

function write(value: boolean) {
  try {
    if (value) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, '0');
  } catch {
    /* ignore quota / SSR */
  }
}

export function useEliFraming(): [boolean, (next: boolean) => void, () => void] {
  const [enabled, setEnabled] = useState<boolean>(() => read());

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
    setEnabled(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => {
    set(!read());
  }, [set]);

  return [enabled, set, toggle];
}
