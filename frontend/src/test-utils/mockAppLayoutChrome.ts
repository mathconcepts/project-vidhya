/**
 * Shared mock component stubs + AuthContext user state for AppLayout tests.
 * AppLayout renders DemoRoleSwitcher/DemoRailNav/WalkthroughBar chrome that's
 * orthogonal to what these tests assert on, and reads useAuth() directly
 * (never hasRole()) to branch persona/redirect logic on `user.role` — so a
 * single settable `role` is enough to drive every case.
 *
 * `vi.mock()` calls themselves can't be factored into a shared function —
 * vitest's hoisting only rewrites literal `vi.mock(...)` calls in the test
 * file itself — but the factory body can safely close over imports from a
 * plain module like this one, since the factory only runs lazily when the
 * mocked module is first required.
 *
 * Usage in a test file:
 *
 *   import { appLayoutAuthState, appLayoutAuthValue, NullChrome } from '@/test-utils/mockAppLayoutChrome';
 *
 *   vi.mock('@/components/app/DemoRoleSwitcher', () => ({ DemoRoleSwitcher: NullChrome }));
 *   vi.mock('@/components/app/DemoRailNav', () => ({ DemoRailNav: NullChrome }));
 *   vi.mock('@/components/app/WalkthroughBar', () => ({ WalkthroughBar: NullChrome, default: NullChrome }));
 *   vi.mock('@/contexts/AuthContext', () => ({ useAuth: appLayoutAuthValue }));
 *
 *   // in a test:
 *   appLayoutAuthState.role = 'admin';
 */

export const NullChrome = () => null;

export const appLayoutAuthState: { role: string | null } = {
  role: null,
};

export function appLayoutAuthValue() {
  return {
    user: appLayoutAuthState.role
      ? { id: 'u1', email: 't@example.com', name: 'Test User', role: appLayoutAuthState.role }
      : null,
    loading: false,
    refresh: () => {},
    signOut: () => {},
    setToken: () => {},
    hasRole: () => true,
  };
}
