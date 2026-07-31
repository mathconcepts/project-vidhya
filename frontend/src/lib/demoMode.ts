/**
 * Demo Theater mode (backlog U1-9; UX-100x-Touchpoint-Design.md §7).
 *
 * `?demo` on any URL puts the app into "demo theater" mode: a small
 * persistent role switcher (DemoRoleSwitcher) appears, letting a
 * presenter flip between Student / Teacher / Parent / Admin views
 * without a keyboard, in front of GATE aspirants or institute staff.
 *
 * Role handling deliberately reuses EXISTING infrastructure rather than
 * inventing a parallel fake-role system:
 *
 *   - Student / Teacher / Admin re-use the real `/demo-login?role=...`
 *     flow (src/api/demo-login.ts) — the exact same accounts
 *     (Priya / Kavita / Arjun, seeded by demo/seed.ts) that
 *     SignInPage's "Local dev quick start" panel already signs into.
 *     Student is the one role the backlog item calls out as running the
 *     REAL engine on real data — that's simply what happens when you
 *     sign in as the seeded student, same as any other login.
 *   - Parent has no backend account at all: `auth.parent_role` is
 *     feature-flagged off by default (src/auth/user-store.ts) and
 *     demo/seed.ts never mints a parent token. So "Parent" is a
 *     client-side-only lens onto the existing /digest page — the
 *     "digest image" touchpoint the UX-100x doc calls out for parents
 *     (§7 item ④) — rather than a new fake login path.
 *
 * State lives in sessionStorage, not localStorage: a demo run is a
 * per-tab, per-visit thing. Closing the tab (or opening a fresh one)
 * should not leave a stale "demo mode" flag around for a real visitor
 * or the next presenter.
 */

import { clearToken } from '@/lib/auth/client';

const ACTIVE_KEY = 'vidhya.demo.active';
const ROLE_KEY = 'vidhya.demo.role';

export type DemoRole = 'student' | 'teacher' | 'parent' | 'admin';

export const DEMO_ROLES: DemoRole[] = ['student', 'teacher', 'parent', 'admin'];

/**
 * Roles whose on-screen data is seeded/synthetic demo content rather
 * than the presenter's own live activity. Drives the Sample data chip.
 * Student is deliberately excluded — it's the one role that is never
 * staged (backlog U1-9 / UX-100x §7 item ③).
 */
export const SEEDED_ROLES: ReadonlySet<DemoRole> = new Set<DemoRole>(['teacher', 'parent', 'admin']);

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null; // private-mode / storage-disabled — degrade to "not in demo mode"
  }
}

function writeSession(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* no-op */
  }
}

/**
 * Detects `?demo` on the current URL and latches demo mode into
 * sessionStorage so it survives the full-page navigations that
 * `/demo-login` performs (a role switch leaves the SPA entirely and
 * comes back as a fresh page load — sessionStorage is what carries the
 * "we're still in demo mode" fact across that trip; the URL param
 * itself does not need to persist).
 *
 * Idempotent — safe to call on every module load / route change.
 */
export function detectDemoModeFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('demo')) {
      writeSession(ACTIVE_KEY, '1');
      if (!readSession(ROLE_KEY)) writeSession(ROLE_KEY, 'student');
    }
  } catch {
    /* no-op outside a browser (SSR / test import without jsdom) */
  }
}

// Runs once per page load. A page load happens exactly once per full-page
// navigation, which is the granularity detectDemoModeFromUrl needs — see
// its doc comment above.
if (typeof window !== 'undefined') {
  detectDemoModeFromUrl();
}

export function isDemoMode(): boolean {
  return readSession(ACTIVE_KEY) === '1';
}

/**
 * Clears ONLY the demo sessionStorage keys — no token, no navigation.
 * Called from setToken() (frontend/src/lib/auth/client.ts) so that a REAL
 * sign-in (Google OAuth / email+password) in a tab that was left in demo
 * mode always exits demo theater, rather than leaving the role-switcher UI
 * showing over a now-real logged-in session. `/demo-login` itself writes
 * the token via its own inline script (bypassing setToken()), so this
 * never fires on a demo role switch — only on a genuine external sign-in.
 */
export function exitDemoModeOnRealSignIn(): void {
  writeSession(ACTIVE_KEY, null);
  writeSession(ROLE_KEY, null);
}

export function getDemoRole(): DemoRole {
  const r = readSession(ROLE_KEY);
  return (DEMO_ROLES as string[]).includes(r || '') ? (r as DemoRole) : 'student';
}

export function setDemoRole(role: DemoRole): void {
  writeSession(ROLE_KEY, role);
}

export function isSeededRole(role: DemoRole): boolean {
  return SEEDED_ROLES.has(role);
}

/**
 * Switch the demo theater to a role.
 *
 * Student / Teacher / Admin: full navigation through the real
 * `/demo-login?role=...` flow — mirrors the links in SignInPage's
 * "Local dev quick start" panel exactly. This performs a real sign-in;
 * it is not simulated.
 *
 * Parent: no backend account exists, so this just re-points the SPA at
 * /digest (client-side navigation) without touching auth at all. The
 * caller is expected to render <SampleDataChip /> alongside it — see
 * DemoRoleSwitcher.
 */
export function switchDemoRole(role: DemoRole): void {
  setDemoRole(role);
  if (role === 'parent') {
    window.location.assign('/digest');
    return;
  }
  window.location.assign(`/demo-login?role=${role}`);
}

/**
 * Clears demo state (both sessionStorage keys this module owns) and the
 * signed-in auth token, then returns to a clean starting route. This
 * fully exits demo theater mode — re-append `?demo` to start a new run.
 */
export function resetDemoMode(): void {
  writeSession(ACTIVE_KEY, null);
  writeSession(ROLE_KEY, null);
  clearToken();
  window.location.assign('/');
}
