/**
 * Shared mutable state + hasRole implementation for tests that mock
 * `@/contexts/AuthContext` to drive the auth-loading race (auth still
 * resolving vs. resolved with a specific role). `vi.mock()` calls
 * themselves cannot be factored into a shared function — vitest's
 * hoisting only rewrites literal `vi.mock(...)` calls in the test file
 * itself — but the factory body can safely close over imports from a
 * plain module like this one, since the factory only runs lazily when
 * the mocked module is first required.
 *
 * Usage in a test file:
 *
 *   import { authMockState, mockHasRole } from '@/test-utils/mockAuthContext';
 *
 *   vi.mock('@/contexts/AuthContext', () => ({
 *     useAuth: () => ({
 *       user: authMockState.user,
 *       loading: authMockState.loading,
 *       hasRole: mockHasRole,
 *     }),
 *   }));
 *
 *   // in a test:
 *   authMockState.loading = false;
 *   authMockState.user = { role: 'teacher' };
 *
 * Any test file that imports this module also needs a `vi.mock` for
 * '@/lib/auth/client' that preserves the real exports (roleGte, Role,
 * ROLE_RANK) rather than stubbing the whole module — use the
 * `importOriginal` form:
 *
 *   vi.mock('@/lib/auth/client', async (importOriginal) => {
 *     const actual = await importOriginal<typeof import('@/lib/auth/client')>();
 *     return { ...actual, authFetch: vi.fn() };
 *   });
 */
import { roleGte, type Role } from '@/lib/auth/client';

export interface MockAuthUser {
  role: Role;
}

export const authMockState: { loading: boolean; user: MockAuthUser | null } = {
  loading: true,
  user: null,
};

export function mockHasRole(min: Role): boolean {
  return roleGte(authMockState.user?.role, min);
}
