/**
 * Regression (/investigate, 2026-08-30): the bare `/` index route rendered
 * <Home/> (GateHome — student diagnostic prompts, a topic-practice grid,
 * "Try a 15-minute session") completely unconditionally, regardless of the
 * signed-in user's persona. A teacher landing on `/` — via the header
 * logo's plain `<a href="/">`, or any direct navigation — saw that
 * student-only page while the bottom nav below it correctly read
 * "Teach" / "Students", an unmistakable wrong-interface mismatch. Every
 * other persona's nav already points its own "home" tab elsewhere
 * (knowledge→/knowledge-home, exam→/planned, teacher→/teaching); `/` was
 * simply never migrated off the pre-three-room-superstrategy default.
 *
 * Reproduced live in a real browser session against this exact repro
 * before the fix; these tests pin it at the component level.
 *
 * Refined (/investigate, 2026-09-01): the original fix sent admin/owner to
 * /teaching too, since AppLayout folds those roles into the same 'teacher'
 * persona bucket as real teachers. Live QA on an admin account found that's
 * its own dead end — /teaching assumes a personal class roster ("no
 * students assigned yet") an admin was never given. The admin/owner test
 * below now asserts the corrected destination (their own dashboard route)
 * instead of re-asserting the bug.
 *
 * Fixed (/ship Red Team review, 2026-09-01): that refinement checked
 * user?.role before persona, which bypassed the vidhya.room "first-priority
 * persona override" (RoomsPage.tsx) — an admin/owner who had deliberately
 * entered the exam or learn room (both role-open, per ROOMS in
 * RoomsPage.tsx) got bounced back to their admin dashboard the instant they
 * hit `/`. Gating on persona === 'teacher' first restores the override.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { appLayoutAuthState, appLayoutAuthValue, NullChrome } from '@/test-utils/mockAppLayoutChrome';

vi.mock('@/lib/auth/client', () => ({
  authFetch: vi.fn(),
}));

vi.mock('@/components/app/DemoRoleSwitcher', () => ({ DemoRoleSwitcher: NullChrome }));
vi.mock('@/components/app/DemoRailNav', () => ({ DemoRailNav: NullChrome }));
vi.mock('@/components/app/WalkthroughBar', () => ({ WalkthroughBar: NullChrome, default: NullChrome }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: appLayoutAuthValue }));

async function renderAtRoot() {
  const { AppLayout } = await import('./AppLayout');
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>GateHome content</div>} />
          <Route path="teaching" element={<div>Teaching content</div>} />
          <Route path="planned" element={<div>Planned content</div>} />
          <Route path="admin/dashboard" element={<div>Admin dashboard content</div>} />
          <Route path="owner/dashboard" element={<div>Owner dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout — root route persona redirect', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Skip the separate one-time /welcome redirect — orthogonal to this bug.
    localStorage.setItem('vidhya.demo_welcomed', '1');
    appLayoutAuthState.role = null;
  });

  it('REGRESSION: redirects a teacher away from `/` to /teaching instead of showing GateHome', async () => {
    appLayoutAuthState.role = 'teacher';
    const { queryByText, getByText } = await renderAtRoot();

    await waitFor(() => expect(getByText('Teaching content')).toBeInTheDocument());
    expect(queryByText('GateHome content')).toBeNull();
  });

  it('REGRESSION: redirects an admin away from `/` to their own dashboard, not /teaching', async () => {
    appLayoutAuthState.role = 'admin';
    const { queryByText, getByText } = await renderAtRoot();

    await waitFor(() => expect(getByText('Admin dashboard content')).toBeInTheDocument());
    expect(queryByText('Teaching content')).toBeNull();
  });

  it('REGRESSION: redirects an owner away from `/` to their own dashboard, not /teaching', async () => {
    appLayoutAuthState.role = 'owner';
    const { queryByText, getByText } = await renderAtRoot();

    await waitFor(() => expect(getByText('Owner dashboard content')).toBeInTheDocument());
    expect(queryByText('Teaching content')).toBeNull();
  });

  it('does not redirect an anonymous (exam-persona) visitor — GateHome stays at `/`', async () => {
    appLayoutAuthState.role = null;
    const { getByText } = await renderAtRoot();

    // Give the persona-detection effect a tick to settle, then confirm no redirect fired.
    await waitFor(() => expect(getByText('GateHome content')).toBeInTheDocument());
  });

  // Gap found on re-audit: every existing case here is admin/owner/teacher
  // (redirected) or a signed-out anonymous visitor (not redirected). A
  // signed-in 'student' exercises a THIRD path through the new branching —
  // it falls through all three `if`s (not admin, not owner, persona resolves
  // to 'exam'/'knowledge' via the /api/student/profile fetch, never
  // 'teacher') — and was never asserted, even though the reordered effect
  // touches every role's fallthrough behavior, not just admin/owner's.
  it('does not redirect a signed-in student away from `/` — GateHome stays', async () => {
    appLayoutAuthState.role = 'student';
    const { authFetch } = await import('@/lib/auth/client');
    (authFetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ exams: [] }),
    });
    const { getByText, queryByText } = await renderAtRoot();

    await waitFor(() => expect(getByText('GateHome content')).toBeInTheDocument());
    expect(queryByText('Teaching content')).toBeNull();
    expect(queryByText('Admin dashboard content')).toBeNull();
    expect(queryByText('Owner dashboard content')).toBeNull();
  });

  // Regression (/ship Red Team review, 2026-09-01): an admin/owner who
  // deliberately chose the exam or learn room (vidhya.room in localStorage)
  // must stay there — the role-based redirect must never override a
  // conscious room choice.
  it('REGRESSION: does not force-redirect an admin who chose the exam room to /admin/dashboard', async () => {
    appLayoutAuthState.role = 'admin';
    localStorage.setItem('vidhya.room', 'exam');
    const { getByText, queryByText } = await renderAtRoot();

    // The exam room doesn't itself navigate away from `/` — it only changes
    // which persona (and thus which redirect rules) apply. The bug was the
    // role-based redirect firing regardless of the room override and
    // bouncing this admin to their dashboard; the fix is that it doesn't.
    await waitFor(() => expect(getByText('GateHome content')).toBeInTheDocument());
    expect(queryByText('Admin dashboard content')).toBeNull();
  });
});
