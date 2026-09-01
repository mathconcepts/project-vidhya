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
import { authMockState, mockHasRole } from '@/test-utils/mockAuthContext';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authMockState.user,
    loading: authMockState.loading,
    hasRole: mockHasRole,
  }),
}));

async function renderPage() {
  const TeachingDashboardPage = (await import('./TeachingDashboardPage')).default;
  return render(<TeachingDashboardPage />);
}

describe('TeachingDashboardPage — auth-loading regression', () => {
  it('REGRESSION: shows a loading state, not "Teacher role required.", while auth is still resolving', async () => {
    authMockState.loading = true;
    authMockState.user = null; // AuthContext hasn't resolved yet — this is the race window

    await renderPage();

    expect(screen.queryByText('Teacher role required.')).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders "Teacher role required." once auth resolves and the role genuinely is not teacher+', async () => {
    authMockState.loading = false;
    authMockState.user = { role: 'student' };

    await renderPage();

    await waitFor(() => expect(screen.getByText('Teacher role required.')).toBeInTheDocument());
  });
});

describe('TeachingDashboardPage — happy path (gap found on ship coverage audit)', () => {
  // Same gap as TeacherRosterPage.test.tsx: this page's actual next-class
  // fetch + render had zero test coverage anywhere in the repo before this
  // pass — every prior test only exercised the loading or permission-denied
  // states. This locks in the real path: auth resolved, role is teacher+,
  // a recommendation fetched and rendered.
  it('renders the fetched recommendation once auth resolves and the role is teacher+', async () => {
    authMockState.loading = false;
    authMockState.user = { role: 'teacher' };
    const authModule = await import('@/lib/auth/client');
    (authModule.authFetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        cohort_size: 7,
        cohort_avg_mastery: 0.42,
        flagged_students: 2,
        recommendation: {
          concept_id: 'eigenvalues',
          concept_label: 'Eigenvalues',
          topic: 'linear-algebra',
          students_below_threshold: 4,
          cohort_avg_mastery: 0.35,
          reason: 'Most students below mastery threshold',
        },
      }),
    });

    await renderPage();

    await waitFor(() => expect(screen.getByText('Eigenvalues')).toBeInTheDocument());
    expect(screen.getByText('Teach next')).toBeInTheDocument();
    expect(screen.getByText(/students need attention/)).toBeInTheDocument();
    expect(screen.queryByText('Teacher role required.')).not.toBeInTheDocument();
  });

  it('renders the "nothing to recommend" message when the cohort has no gaps', async () => {
    authMockState.loading = false;
    authMockState.user = { role: 'teacher' };
    const authModule = await import('@/lib/auth/client');
    (authModule.authFetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        cohort_size: 5,
        cohort_avg_mastery: 0.81,
        recommendation: null,
        message: 'Your cohort is on track — nothing urgent to teach next.',
      }),
    });

    await renderPage();

    await waitFor(() =>
      expect(screen.getByText('Your cohort is on track — nothing urgent to teach next.')).toBeInTheDocument(),
    );
  });
});
