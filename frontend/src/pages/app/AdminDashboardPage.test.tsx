/**
 * Regression (/investigate, 2026-09-01): the Cohort Insight card's
 * "N need attention" chip linked to /teacher/roster, but the count above it
 * (`flagged_for_teacher_attention`) comes from summarizeCohort() over every
 * student platform-wide — while /teacher/roster's backend scopes to the
 * CALLING user's own teacher_of[] list. An admin (never personally assigned
 * as anyone's teacher) clicked a real "1 need attention" stat and landed on
 * "No students assigned yet." /admin/cohort is the actual platform-wide
 * attention surface this stat corresponds to.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { authMockState, mockHasRole } from '@/test-utils/mockAuthContext';

vi.mock('@/components/admin/ContentMaturityCard', () => ({ ContentMaturityCard: () => null }));
vi.mock('@/components/admin/AdminQuickLinks', () => ({ AdminQuickLinks: () => null }));

authMockState.loading = false;
authMockState.user = { role: 'admin' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authMockState.user,
    loading: authMockState.loading,
    hasRole: mockHasRole,
  }),
}));

const DASHBOARD_SUMMARY = {
  deployment: { channels: { web: true, telegram: false, whatsapp: false }, llm_configured: true, llm_provider: 'gemini' },
  users: { total: 7, by_role: { student: 7 }, active_today: 2, active_7d: 5, signed_up_7d: 1 },
  cohort: {
    total_students: 7,
    avg_mastery: 0.18,
    struggling_concepts: [],
    frustrated_count: 1,
    anxious_count: 0,
    flagged_for_teacher_attention: 1,
  },
  active_users_sparkline: [1, 2, 1, 3, 2, 4, 2],
  checklist: [],
};

vi.mock('@/lib/auth/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/client')>();
  return {
    ...actual,
    authFetch: vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, json: async () => DASHBOARD_SUMMARY } as Response),
    ),
  };
});

async function renderPage() {
  const AdminDashboardPage = (await import('./AdminDashboardPage')).default;
  return render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  );
}

describe('AdminDashboardPage — cohort attention link regression', () => {
  it('REGRESSION: "need attention" links to /admin/cohort, not /teacher/roster', async () => {
    await renderPage();

    const link = await waitFor(() => screen.getByText(/need attention/));
    expect(link.closest('a')).toHaveAttribute('href', '/admin/cohort');
  });
});

describe('AdminDashboardPage — "need attention" chip hidden when nothing is flagged', () => {
  // Gap found on ship's coverage audit: the fixed link only renders inside
  // `flagged_for_teacher_attention > 0` (AdminDashboardPage.tsx:292). The
  // regression test above only exercises the count>0 branch; this locks in
  // that a healthy cohort (nothing flagged) renders no link to
  // /admin/cohort at all, rather than a chip pointing at a stale/empty view.
  it('renders no "need attention" chip when flagged_for_teacher_attention is 0', async () => {
    const authModule = await import('@/lib/auth/client');
    (authModule.authFetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ...DASHBOARD_SUMMARY,
        cohort: { ...DASHBOARD_SUMMARY.cohort, flagged_for_teacher_attention: 0 },
      }),
    });

    await renderPage();

    await waitFor(() => expect(screen.getByText(/Admin Dashboard/)).toBeInTheDocument());
    expect(screen.queryByText(/need attention/)).not.toBeInTheDocument();
  });
});
