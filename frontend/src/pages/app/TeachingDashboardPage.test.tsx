/**
 * Regression (/investigate, 2026-09-01): TeachingDashboardPage gated its
 * whole render on `hasRole('teacher')` without checking AuthContext's async
 * `loading` flag first. `hasRole` reads `user`, which is null until
 * `/api/auth/me` resolves — so on any full page load (e.g. the demo-login
 * walkthrough's `window.location.assign`, which remounts the whole app) a
 * fully-authorized teacher/admin/owner briefly (or, on a slow/cold boot,
 * for several real seconds) saw "Teacher role required." instead of the
 * page, purely because auth hadn't resolved yet — not because the role was
 * actually wrong.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));

let mockLoading = true;
let mockUser: { role: string } | null = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    hasRole: (min: string) => {
      if (!mockUser) return false;
      const rank: Record<string, number> = { student: 0, teacher: 1, admin: 2, owner: 3 };
      return (rank[mockUser.role] ?? -1) >= (rank[min] ?? 99);
    },
  }),
}));

async function renderPage() {
  const TeachingDashboardPage = (await import('./TeachingDashboardPage')).default;
  return render(<TeachingDashboardPage />);
}

describe('TeachingDashboardPage — auth-loading regression', () => {
  it('REGRESSION: shows a loading state, not "Teacher role required.", while auth is still resolving', async () => {
    mockLoading = true;
    mockUser = null; // AuthContext hasn't resolved yet — this is the race window

    await renderPage();

    expect(screen.queryByText('Teacher role required.')).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders "Teacher role required." once auth resolves and the role genuinely is not teacher+', async () => {
    mockLoading = false;
    mockUser = { role: 'student' };

    await renderPage();

    await waitFor(() => expect(screen.getByText('Teacher role required.')).toBeInTheDocument());
  });
});
