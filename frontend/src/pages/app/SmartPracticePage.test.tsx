/**
 * SmartPracticePage — regression coverage for the "Previous problem"
 * history state machine added by /investigate (2026-09-02, issue #5:
 * "i do not see the option to see previous problem").
 *
 * Before this change there was no way back — only forward (resolve() on
 * every click). The fix adds a `history`/`historyPos` pair: stepping back
 * or re-stepping forward through already-seen problems must never call
 * resolve() again, only a genuinely new problem should. This is exactly
 * the kind of state machine where "Next after Previous serves a third,
 * unrelated problem" bugs hide — a coverage-audit subagent (ship Step 7)
 * flagged this file as the one real HIGH-severity gap in that PR and this
 * file closes it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useSession', () => ({ useSession: () => 'test-session-1' }));
vi.mock('@/hooks/useActiveExam', () => ({ useActiveExam: () => ({ exam: null, loading: false, error: false }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/gbrain/client', () => ({ recordAttempt: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/auth/client', () => ({
  // Rejects so nextProblem()'s try/catch falls through to rendering
  // in-page instead of redirecting to /attempt/:id — the history state
  // machine only exists on the in-page render path.
  authFetch: vi.fn().mockRejectedValue(new Error('no gradable item')),
}));

const resolveMock = vi.fn();
vi.mock('@/lib/content/resolver', () => ({
  resolve: (...args: unknown[]) => resolveMock(...args),
  warmContentBundle: vi.fn().mockResolvedValue(undefined),
}));

function problem(id: string, question: string) {
  return {
    source: 'tier-0-bundle-exact' as const,
    confidence: 1,
    latency_ms: 10,
    cost_estimate_usd: 0,
    problem: { id, question_text: question, topic: 'linear-algebra', concept_id: 'linear-algebra', marks: 2 },
  };
}

async function renderPage() {
  const Page = (await import('./SmartPracticePage')).default;
  return render(
    <MemoryRouter initialEntries={['/smart-practice']}>
      <Page />
    </MemoryRouter>,
  );
}

describe('SmartPracticePage — problem history (Previous / Next)', () => {
  beforeEach(() => {
    resolveMock.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  it('first problem: no Previous button, resolve() called once', async () => {
    resolveMock.mockResolvedValueOnce(problem('p-a', 'Problem A'));
    await renderPage();

    fireEvent.click(screen.getByText('Get problem'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());

    expect(screen.queryByText('Previous')).toBeNull();
    expect(resolveMock).toHaveBeenCalledTimes(1);
  });

  it('Previous steps back through history without calling resolve() again, and Next after Previous replays forward instead of fetching a third problem', async () => {
    resolveMock
      .mockResolvedValueOnce(problem('p-a', 'Problem A'))
      .mockResolvedValueOnce(problem('p-b', 'Problem B'));
    await renderPage();

    // Fetch problem A (fresh — resolve #1)
    fireEvent.click(screen.getByText('Get problem'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());

    // Fetch problem B (fresh — resolve #2). Button relabels to "Next problem" once resolved is set.
    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem B')).toBeInTheDocument());
    expect(resolveMock).toHaveBeenCalledTimes(2);

    // Now at history = [A, B], historyPos = 1 — Previous button appears.
    expect(screen.getByText('Previous')).toBeInTheDocument();

    // Step back to A — must NOT call resolve() a third time.
    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());
    expect(resolveMock).toHaveBeenCalledTimes(2);
    // historyPos is now 0 — Previous button hides again.
    expect(screen.queryByText('Previous')).toBeNull();

    // Step forward again — must retrace to B from history, NOT fetch a
    // third, unrelated problem. This is the exact regression the history
    // stack exists to prevent.
    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem B')).toBeInTheDocument());
    expect(resolveMock).toHaveBeenCalledTimes(2);
  });

  it('Next at the frontier (no problem behind it in history) always fetches fresh', async () => {
    resolveMock
      .mockResolvedValueOnce(problem('p-a', 'Problem A'))
      .mockResolvedValueOnce(problem('p-b', 'Problem B'))
      .mockResolvedValueOnce(problem('p-c', 'Problem C'));
    await renderPage();

    fireEvent.click(screen.getByText('Get problem'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem B')).toBeInTheDocument());

    // At the frontier (historyPos === history.length - 1) — clicking Next
    // must resolve a genuinely new problem, not replay history.
    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem C')).toBeInTheDocument());
    expect(resolveMock).toHaveBeenCalledTimes(3);
  });

  // Multi-specialist confirmed (/ship review army, 2026-09-02): switching
  // topic or difficulty while sitting behind the frontier (after "Previous")
  // must invalidate history — otherwise "Next problem" replays a stale entry
  // fetched for the OLD topic instead of resolving fresh content for the
  // newly selected one.
  it('changing topic after Previous invalidates history — Next fetches fresh for the new topic instead of replaying a stale entry', async () => {
    resolveMock
      .mockResolvedValueOnce(problem('p-a', 'Problem A'))
      .mockResolvedValueOnce(problem('p-b', 'Problem B'))
      .mockResolvedValueOnce(problem('p-c', 'Problem C (calculus)'));
    await renderPage();

    fireEvent.click(screen.getByText('Get problem'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem B')).toBeInTheDocument());

    // Step back — now sitting behind the frontier (history = [A, B], historyPos = 0).
    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());

    // Switch topic while behind the frontier.
    fireEvent.click(screen.getByText('calculus'));

    // "Next problem" must NOT replay B (a stale, wrong-topic history entry)
    // — it must resolve fresh content for the new topic selection.
    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem C (calculus)')).toBeInTheDocument());
    expect(resolveMock).toHaveBeenCalledTimes(3);
    expect(screen.queryByText('Problem B')).toBeNull();
  });

  it('changing difficulty after Previous invalidates history the same way', async () => {
    resolveMock
      .mockResolvedValueOnce(problem('p-a', 'Problem A'))
      .mockResolvedValueOnce(problem('p-b', 'Problem B'))
      .mockResolvedValueOnce(problem('p-c', 'Problem C (hard)'));
    await renderPage();

    fireEvent.click(screen.getByText('Get problem'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem B')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => expect(screen.getByText('Problem A')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Hard'));
    fireEvent.click(screen.getByText('Next problem'));
    await waitFor(() => expect(screen.getByText('Problem C (hard)')).toBeInTheDocument());
    expect(resolveMock).toHaveBeenCalledTimes(3);
  });
});
