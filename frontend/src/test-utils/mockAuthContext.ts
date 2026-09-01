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
 */

export interface MockAuthUser {
  role: string;
}

export const authMockState: { loading: boolean; user: MockAuthUser | null } = {
  loading: true,
  user: null,
};

const ROLE_RANK: Record<string, number> = { student: 0, teacher: 1, admin: 2, owner: 3 };

export function mockHasRole(min: string): boolean {
  if (!authMockState.user) return false;
  return (ROLE_RANK[authMockState.user.role] ?? -1) >= (ROLE_RANK[min] ?? 99);
}
