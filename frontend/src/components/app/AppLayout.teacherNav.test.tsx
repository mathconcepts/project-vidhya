/**
 * Regression (/investigate, 2026-09-01): the teacher persona's "Students"
 * bottom-nav tab pointed at /progress — the STUDENT's own progress page,
 * keyed off an anonymous useSession() id, never a teacher-facing view. A
 * teacher or admin tapping "Students" landed on a page about their own
 * anonymous session (also blank/crashing — see ProgressPage.test.tsx's
 * hook-order fix, same session) instead of their class roster.
 * /teacher/roster is the actual "students I teach" page.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));
vi.mock('@/components/app/DemoRoleSwitcher', () => ({ DemoRoleSwitcher: () => null }));
vi.mock('@/components/app/DemoRailNav', () => ({ DemoRailNav: () => null }));
vi.mock('@/components/app/WalkthroughBar', () => ({ WalkthroughBar: () => null, default: () => null }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 't@example.com', name: 'Test Teacher', role: 'teacher' },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
    setToken: vi.fn(),
    hasRole: () => true,
  }),
}));

async function renderAtTeaching() {
  const { AppLayout } = await import('./AppLayout');
  return render(
    <MemoryRouter initialEntries={['/teaching']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="teaching" element={<div>Teaching content</div>} />
          <Route path="progress" element={<div>Progress content (student's own)</div>} />
          <Route path="teacher/roster" element={<div>Roster content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout — teacher persona "Students" nav tab', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('vidhya.demo_welcomed', '1');
  });

  it('REGRESSION: tapping "Students" navigates to /teacher/roster, not /progress', async () => {
    await renderAtTeaching();
    await waitFor(() => expect(screen.getByText('Teaching content')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Students'));

    await waitFor(() => expect(screen.getByText('Roster content')).toBeInTheDocument());
    expect(screen.queryByText("Progress content (student's own)")).not.toBeInTheDocument();
  });
});
