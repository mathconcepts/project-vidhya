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
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@/lib/auth/client', () => ({
  authFetch: vi.fn(),
}));

vi.mock('@/components/app/DemoRoleSwitcher', () => ({ DemoRoleSwitcher: () => null }));
vi.mock('@/components/app/DemoRailNav', () => ({ DemoRailNav: () => null }));
vi.mock('@/components/app/WalkthroughBar', () => ({ WalkthroughBar: () => null, default: () => null }));

let mockUser: { role: string } | null = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser ? { id: 'u1', email: 't@example.com', name: 'Test User', role: mockUser.role } : null,
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
    setToken: vi.fn(),
    hasRole: () => true,
  }),
}));

async function renderAtRoot() {
  const { AppLayout } = await import('./AppLayout');
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>GateHome content</div>} />
          <Route path="teaching" element={<div>Teaching content</div>} />
          <Route path="planned" element={<div>Planned content</div>} />
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
    mockUser = null;
  });

  it('REGRESSION: redirects a teacher away from `/` to /teaching instead of showing GateHome', async () => {
    mockUser = { role: 'teacher' };
    const { queryByText, getByText } = await renderAtRoot();

    await waitFor(() => expect(getByText('Teaching content')).toBeInTheDocument());
    expect(queryByText('GateHome content')).toBeNull();
  });

  it('also redirects an admin away from `/` (same persona bucket as teacher)', async () => {
    mockUser = { role: 'admin' };
    const { getByText } = await renderAtRoot();

    await waitFor(() => expect(getByText('Teaching content')).toBeInTheDocument());
  });

  it('does not redirect an anonymous (exam-persona) visitor — GateHome stays at `/`', async () => {
    mockUser = null;
    const { getByText } = await renderAtRoot();

    // Give the persona-detection effect a tick to settle, then confirm no redirect fired.
    await waitFor(() => expect(getByText('GateHome content')).toBeInTheDocument());
  });
});
