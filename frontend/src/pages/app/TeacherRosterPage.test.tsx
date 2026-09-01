/**
 * Regression (/investigate, 2026-09-01): same missing-loading-guard bug as
 * TeachingDashboardPage.test.tsx — see that file's header comment for the
 * full mechanism. This page is also the "Students" tab destination for the
 * teacher/admin nav (AppLayout.tsx's NAV_BY_PERSONA, fixed the same
 * session), so it sits on the same demo-login full-page-reload path that
 * exposed the race in production.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));
vi.mock('@/lib/demoMode', () => ({
  isDemoMode: () => false,
  isSeededRole: () => false,
  getDemoRole: () => null,
}));
vi.mock('@/components/app/SampleDataChip', () => ({ SampleDataChip: () => null }));

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
  const TeacherRosterPage = (await import('./TeacherRosterPage')).default;
  return render(<TeacherRosterPage />);
}

describe('TeacherRosterPage — auth-loading regression', () => {
  it('REGRESSION: shows a loading state, not "Teacher role required.", while auth is still resolving', async () => {
    mockLoading = true;
    mockUser = null;

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
