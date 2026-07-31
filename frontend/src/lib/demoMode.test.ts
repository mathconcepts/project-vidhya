/**
 * demoMode.ts tests.
 *
 * The module runs a side effect at import time (checking the current
 * URL for `?demo`), so each `?demo`-detection case re-imports a fresh
 * module instance via `vi.resetModules()` after pushing the URL it
 * wants — same pattern used by beacon.test.ts for this codebase's other
 * module-scoped-singleton file.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function freshDemoMode() {
  vi.resetModules();
  return import('./demoMode');
}

describe('demoMode', () => {
  // Some cases below replace `window.location` with a stub ({ assign: fn })
  // to observe navigation calls, since jsdom's real Location doesn't let
  // `.assign` be spied on directly. That replacement is destructive and, if
  // left in place, breaks every later test's `window.history.pushState` +
  // `detectDemoModeFromUrl()` (which reads `window.location.search`) — the
  // stub has no `search` getter, so ?demo detection silently goes dark for
  // the rest of the file. Save + restore the real Location around every
  // test so stubbing in one case can never leak into the next.
  const realLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.history.pushState(null, '', '/');
  });

  afterEach(() => {
    // @ts-expect-error restoring the real jsdom Location after a test-local stub
    delete window.location;
    // @ts-expect-error same intentional partial-Location-stub typing gap as above
    window.location = realLocation;
  });

  it('is not active by default (no ?demo, fresh session)', async () => {
    const { isDemoMode } = await freshDemoMode();
    expect(isDemoMode()).toBe(false);
  });

  it('?demo in the URL latches active=true into sessionStorage on import', async () => {
    window.history.pushState(null, '', '/planned?demo');
    const { isDemoMode, getDemoRole } = await freshDemoMode();
    expect(isDemoMode()).toBe(true);
    expect(sessionStorage.getItem('vidhya.demo.active')).toBe('1');
    // defaults to student — the one role that is never staged
    expect(getDemoRole()).toBe('student');
  });

  it('stays active across a simulated full-page navigation (sessionStorage survives; URL need not carry ?demo again)', async () => {
    window.history.pushState(null, '', '/?demo');
    await freshDemoMode();

    // Simulate landing back from /demo-login without ?demo in the URL.
    window.history.pushState(null, '', '/planned');
    const { isDemoMode } = await freshDemoMode();
    expect(isDemoMode()).toBe(true);
  });

  it('does not clobber an already-selected role when ?demo re-fires', async () => {
    window.history.pushState(null, '', '/?demo');
    const mod1 = await freshDemoMode();
    mod1.setDemoRole('admin');

    window.history.pushState(null, '', '/admin/content-rd?demo');
    const mod2 = await freshDemoMode();
    expect(mod2.getDemoRole()).toBe('admin');
  });

  it('getDemoRole falls back to student for an unrecognized/corrupt stored value', async () => {
    sessionStorage.setItem('vidhya.demo.role', 'superuser');
    const { getDemoRole } = await freshDemoMode();
    expect(getDemoRole()).toBe('student');
  });

  it('isSeededRole is true for teacher/parent/admin and false for student', async () => {
    const { isSeededRole } = await freshDemoMode();
    expect(isSeededRole('student')).toBe(false);
    expect(isSeededRole('teacher')).toBe(true);
    expect(isSeededRole('parent')).toBe(true);
    expect(isSeededRole('admin')).toBe(true);
  });

  it('switchDemoRole persists the role and navigates through /demo-login for student/teacher/admin', async () => {
    window.history.pushState(null, '', '/?demo');
    const { switchDemoRole } = await freshDemoMode();
    const assign = vi.fn();
    // @ts-expect-error jsdom location is not fully writable; stub just the method under test
    delete window.location;
    // @ts-expect-error partial Location stub is intentional here
    window.location = { assign };

    switchDemoRole('teacher');
    expect(sessionStorage.getItem('vidhya.demo.role')).toBe('teacher');
    expect(assign).toHaveBeenCalledWith('/demo-login?role=teacher');
  });

  it('switchDemoRole routes Parent to /digest without touching /demo-login', async () => {
    window.history.pushState(null, '', '/?demo');
    const { switchDemoRole } = await freshDemoMode();
    const assign = vi.fn();
    // @ts-expect-error jsdom location is not fully writable; stub just the method under test
    delete window.location;
    // @ts-expect-error partial Location stub is intentional here
    window.location = { assign };

    switchDemoRole('parent');
    expect(sessionStorage.getItem('vidhya.demo.role')).toBe('parent');
    expect(assign).toHaveBeenCalledWith('/digest');
    expect(assign).not.toHaveBeenCalledWith(expect.stringContaining('/demo-login'));
  });

  it('resetDemoMode clears both sessionStorage keys, clears the auth token, and returns to /', async () => {
    window.history.pushState(null, '', '/?demo');
    const { resetDemoMode } = await freshDemoMode();
    localStorage.setItem('vidhya.auth.token.v1', 'fake-jwt');

    const assign = vi.fn();
    // @ts-expect-error jsdom location is not fully writable; stub just the method under test
    delete window.location;
    // @ts-expect-error partial Location stub is intentional here
    window.location = { assign };

    resetDemoMode();
    expect(sessionStorage.getItem('vidhya.demo.active')).toBeNull();
    expect(sessionStorage.getItem('vidhya.demo.role')).toBeNull();
    expect(localStorage.getItem('vidhya.auth.token.v1')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/');
  });

  it('exitDemoModeOnRealSignIn clears demo state without touching the token or navigating', async () => {
    // Regression test (eng review finding): a shared/kiosk tab left in
    // ?demo mode, then used for a real sign-in in the same tab, must not
    // keep showing the demo role-switcher over the now-real session.
    window.history.pushState(null, '', '/?demo');
    const { exitDemoModeOnRealSignIn, isDemoMode } = await freshDemoMode();
    localStorage.setItem('vidhya.auth.token.v1', 'real-jwt');
    expect(isDemoMode()).toBe(true);

    exitDemoModeOnRealSignIn();

    expect(isDemoMode()).toBe(false);
    expect(sessionStorage.getItem('vidhya.demo.role')).toBeNull();
    // Unlike resetDemoMode(), this must NOT clear the token that was just set.
    expect(localStorage.getItem('vidhya.auth.token.v1')).toBe('real-jwt');
  });
});
