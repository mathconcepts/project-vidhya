/**
 * Regression (/investigate, 2026-09-01): the teacher persona's "Students"
 * bottom-nav tab pointed at /progress — the STUDENT's own progress page,
 * keyed off an anonymous useSession() id, never a teacher-facing view. A
 * teacher or admin tapping "Students" landed on a page about their own
 * anonymous session (also blank/crashing — see ProgressPage.test.tsx's
 * hook-order fix, same session) instead of their class roster.
 * /teacher/roster is the actual "students I teach" page.
 *
 * Extended (/ship pre-landing review, 2026-09-01): admin/owner share the same
 * 'teacher' persona bucket (AppLayout.tsx line ~114), so this same "Students"
 * tab also sent THEM to /teacher/roster — the identical personal-roster dead
 * end ("no students assigned yet") the Cohort Insight card's link was fixed
 * to avoid, reached through a second, previously-untested affordance. Admin
 * and owner now land on the platform-wide attention surface instead.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { appLayoutAuthState, appLayoutAuthValue, NullChrome } from '@/test-utils/mockAppLayoutChrome';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));
vi.mock('@/components/app/DemoRoleSwitcher', () => ({ DemoRoleSwitcher: NullChrome }));
vi.mock('@/components/app/DemoRailNav', () => ({ DemoRailNav: NullChrome }));
vi.mock('@/components/app/WalkthroughBar', () => ({ WalkthroughBar: NullChrome, default: NullChrome }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: appLayoutAuthValue }));

async function renderAtTeaching() {
  const { AppLayout } = await import('./AppLayout');
  return render(
    <MemoryRouter initialEntries={['/teaching']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="teaching" element={<div>Teaching content</div>} />
          <Route path="progress" element={<div>Progress content (student's own)</div>} />
          <Route path="teacher/roster" element={<div>Roster content</div>} />
          <Route path="admin/cohort" element={<div>Cohort attention content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout — teacher persona "Students" nav tab', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('vidhya.demo_welcomed', '1');
    appLayoutAuthState.role = 'teacher';
  });

  it('REGRESSION: tapping "Students" navigates to /teacher/roster, not /progress', async () => {
    await renderAtTeaching();
    await waitFor(() => expect(screen.getByText('Teaching content')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Students'));

    await waitFor(() => expect(screen.getByText('Roster content')).toBeInTheDocument());
    expect(screen.queryByText("Progress content (student's own)")).not.toBeInTheDocument();
  });

  it.each(['admin', 'owner'] as const)(
    'REGRESSION: as %s, tapping "Students" navigates to /admin/cohort, not the personal-roster dead end',
    async (role) => {
      appLayoutAuthState.role = role;
      await renderAtTeaching();
      await waitFor(() => expect(screen.getByText('Teaching content')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Students'));

      await waitFor(() => expect(screen.getByText('Cohort attention content')).toBeInTheDocument());
      expect(screen.queryByText('Roster content')).not.toBeInTheDocument();
    },
  );
});
