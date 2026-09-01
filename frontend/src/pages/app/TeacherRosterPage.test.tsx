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

describe('TeacherRosterPage — happy path (gap found on ship coverage audit)', () => {
  // This page's actual roster fetch + render had zero test coverage
  // anywhere in the repo before this pass — every prior test (including
  // the auth-loading regression above) only ever exercised the loading or
  // permission-denied states. This locks in the real path: auth resolved,
  // role is teacher+, roster data fetched and rendered.
  it('renders the fetched roster once auth resolves and the role is teacher+', async () => {
    mockLoading = false;
    mockUser = { role: 'teacher' };
    const authModule = await import('@/lib/auth/client');
    (authModule.authFetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        teacher: { id: 't1', name: 'Kavita', email: 'kavita@example.com' },
        student_count: 2,
        attention_count: 1,
        students: [
          {
            student_id: 's1', name: 'Meera', email: 'meera@example.com',
            overall_mastery: 0.72, concepts_mastered: 12, concepts_in_progress: 3, concepts_struggling: 1,
            total_attempts: 40, needs_attention: false, attention_reason: null, last_active_at: null,
          },
          {
            student_id: 's2', name: 'Rahul', email: 'rahul@example.com',
            overall_mastery: 0.21, concepts_mastered: 2, concepts_in_progress: 4, concepts_struggling: 9,
            total_attempts: 15, needs_attention: true, attention_reason: 'frustrated', last_active_at: null,
          },
        ],
      }),
    });

    await renderPage();

    await waitFor(() => expect(screen.getByText('Meera')).toBeInTheDocument());
    expect(screen.getByText('Rahul')).toBeInTheDocument();
    expect(screen.getByText(/2 students/)).toBeInTheDocument();
    expect(screen.queryByText('Teacher role required.')).not.toBeInTheDocument();
    expect(screen.queryByText('No students assigned yet')).not.toBeInTheDocument();
  });

  it('renders the empty-roster message when the teacher has no assigned students', async () => {
    mockLoading = false;
    mockUser = { role: 'teacher' };
    const authModule = await import('@/lib/auth/client');
    (authModule.authFetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        teacher: { id: 't1', name: 'Kavita', email: 'kavita@example.com' },
        student_count: 0,
        attention_count: 0,
        students: [],
      }),
    });

    await renderPage();

    await waitFor(() => expect(screen.getByText('No students assigned yet')).toBeInTheDocument());
  });
});
