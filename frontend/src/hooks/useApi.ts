/**
 * Simple fetch wrapper for GATE API calls.
 */

import { withExamChoice } from '@/lib/exam-choice';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // The viewer's exam choice rides along on every call (v4.86.0). See
  // `withExamChoice` for why this is central rather than per-call site.
  const res = await fetch(`${API_BASE}${withExamChoice(path)}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  return res.json();
}
