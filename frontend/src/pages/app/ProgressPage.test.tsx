/**
 * Regression (/investigate, 2026-09-01): ProgressPage's two useMemo calls
 * used to sit AFTER the loading/empty early returns. React only saw 5 hooks
 * on the loading render; once real topic data arrived and the component fell
 * through both early returns, it called 2 more — "Rendered more hooks than
 * during the previous render," a real thrown Error. With no ErrorBoundary
 * anywhere in the app, that crash unmounted the whole tree: a blank page at
 * /progress, live-QA reported against production.
 *
 * This test renders with non-empty topic data (the exact crash condition —
 * an anonymous session with prior attempts) and asserts the page renders
 * real content instead of throwing.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useSession', () => ({ useSession: () => 'anon-session-1' }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/components/app/ExamReadinessBreakdown', () => ({
  ExamReadinessBreakdown: () => null,
}));
vi.mock('@/components/app/ExamCountdownChip', () => ({
  ExamCountdownChip: () => null,
}));

const PROGRESS_DATA = {
  topics: [
    { topic: 'eigenvalues', totalProblems: 10, correct: 6, attempts: 8, mastery: 0.6, easiness: 2.3, due: 2 },
    { topic: 'determinants', totalProblems: 12, correct: 4, attempts: 9, mastery: 0.3, easiness: 1.9, due: 1 },
  ],
  overall: {
    problems_attempted: '22',
    total_correct: '10',
    total_attempts: '17',
    due_today: '3',
  },
  weakTopics: [
    { topic: 'determinants', mastery: 0.3, easiness: 1.9, due: 1 },
  ],
};

vi.mock('@/hooks/useApi', () => ({
  apiFetch: vi.fn(() => Promise.resolve(PROGRESS_DATA)),
}));

async function renderProgressPage() {
  const ProgressPage = (await import('./ProgressPage')).default;
  return render(
    <MemoryRouter>
      <ProgressPage />
    </MemoryRouter>,
  );
}

describe('ProgressPage — hook-order regression', () => {
  it('REGRESSION: renders real topic content instead of crashing to a blank page', async () => {
    await renderProgressPage();

    // Would throw during render (unmounting the tree) before the fix, the
    // instant topics.length > 0 fell through both early returns.
    await waitFor(() => expect(screen.getByText('Your Progress')).toBeInTheDocument());
    expect(screen.getByText('Eigenvalues')).toBeInTheDocument();
  });
});

describe('ProgressPage — weakTopics null-safety (edge case introduced by the fix)', () => {
  // Gap found on re-audit: the fix didn't just reorder the two useMemo
  // calls, it also changed their bodies from `data.weakTopics.map(...)` to
  // `(data?.weakTopics ?? []).map(...)`. That fallback is new defensive
  // code, and it's only exercised when the field is actually missing —
  // the happy-path fixture above always supplies `weakTopics`. A backend
  // response that omits the field (a real possibility this component has
  // no control over) would have thrown `Cannot read properties of
  // undefined (reading 'map')` even under the fixed hook ordering, since
  // hook order alone doesn't guarantee the accessed field exists.
  it('does not crash when the API response omits weakTopics', async () => {
    const apiModule = await import('@/hooks/useApi');
    (apiModule.apiFetch as any).mockResolvedValueOnce({
      topics: [
        { topic: 'eigenvalues', totalProblems: 10, correct: 6, attempts: 8, mastery: 0.6, easiness: 2.3, due: 2 },
      ],
      overall: { problems_attempted: '10', total_correct: '6', total_attempts: '8', due_today: '0' },
      // weakTopics intentionally omitted
    });

    await renderProgressPage();

    await waitFor(() => expect(screen.getByText('Your Progress')).toBeInTheDocument());
    expect(screen.getByText('Eigenvalues')).toBeInTheDocument();
  });
});

describe('ProgressPage — the other two hook-order transitions', () => {
  // Gap found on ship's coverage audit: the fix hoists the two useMemo
  // calls so they run on every render, not just the "loaded with topics"
  // one already covered above. The empty-topics and null-data early
  // returns exercise the exact same hoisted hooks with different inputs —
  // low risk since it's the same 2-line fix, but never separately
  // asserted, so a future edit to just one of the three return paths
  // could silently break the other two without any test catching it.
  it('renders the empty state (not a crash) when topics is an empty array', async () => {
    const apiModule = await import('@/hooks/useApi');
    (apiModule.apiFetch as any).mockResolvedValueOnce({
      topics: [],
      overall: { problems_attempted: '0', total_correct: '0', total_attempts: '0', due_today: '0' },
      weakTopics: [],
    });

    await renderProgressPage();

    await waitFor(() => expect(screen.getByText('No progress yet')).toBeInTheDocument());
  });

  it('renders the empty state (not a crash) when the fetch fails and data stays null', async () => {
    const apiModule = await import('@/hooks/useApi');
    (apiModule.apiFetch as any).mockRejectedValueOnce(new Error('network error'));

    await renderProgressPage();

    await waitFor(() => expect(screen.getByText('No progress yet')).toBeInTheDocument());
  });
});

// /investigate (2026-09-07): "sample size is too low to be completed 100%".
// The backend now sends the Wilson lower bound (not the naive ratio) as
// `mastery`, plus `hasEnoughDataForLabel` — the page's job is to trust that
// bound for the percentage/tone, and to caption the ones the backend flags
// as low-confidence rather than presenting them as an ordinary score.
describe('ProgressPage — low-confidence topic caption', () => {
  it('captions a topic below the min-attempts label gate, naming the attempt count', async () => {
    const apiModule = await import('@/hooks/useApi');
    (apiModule.apiFetch as any).mockResolvedValueOnce({
      topics: [
        {
          topic: 'discrete-mathematics', totalProblems: 5, correct: 1, attempts: 1,
          mastery: 0.21, masteryConfidence: 'low', hasEnoughDataForLabel: false, easiness: 2.5, due: 1,
        },
      ],
      overall: { problems_attempted: '1', total_correct: '1', total_attempts: '1', due_today: '1' },
      weakTopics: [],
    });

    await renderProgressPage();

    await waitFor(() => expect(screen.getByText('Discrete Mathematics')).toBeInTheDocument());
    expect(screen.getByText('Based on 1 attempt — still finding out')).toBeInTheDocument();
    // The displayed number is the Wilson bound sent by the backend, not a raw 100%.
    expect(screen.getByText('21%')).toBeInTheDocument();
  });

  it('does not caption a topic once it has enough attempts for a real label', async () => {
    const apiModule = await import('@/hooks/useApi');
    (apiModule.apiFetch as any).mockResolvedValueOnce({
      topics: [
        {
          topic: 'linear-algebra', totalProblems: 20, correct: 8, attempts: 10,
          mastery: 0.55, masteryConfidence: 'medium', hasEnoughDataForLabel: true, easiness: 2.1, due: 0,
        },
      ],
      overall: { problems_attempted: '10', total_correct: '8', total_attempts: '10', due_today: '0' },
      weakTopics: [],
    });

    await renderProgressPage();

    await waitFor(() => expect(screen.getByText('Linear Algebra')).toBeInTheDocument());
    expect(screen.queryByText(/still finding out/)).not.toBeInTheDocument();
  });

  it('does not caption an unattempted topic (nothing to "still be finding out" about)', async () => {
    const apiModule = await import('@/hooks/useApi');
    (apiModule.apiFetch as any).mockResolvedValueOnce({
      topics: [
        {
          topic: 'graph-theory', totalProblems: 8, correct: 0, attempts: 0,
          mastery: 0, masteryConfidence: 'none', hasEnoughDataForLabel: false, easiness: 0, due: 4,
        },
      ],
      overall: { problems_attempted: '0', total_correct: '0', total_attempts: '0', due_today: '4' },
      weakTopics: [],
    });

    await renderProgressPage();

    await waitFor(() => expect(screen.getByText('Graph Theory')).toBeInTheDocument());
    expect(screen.queryByText(/still finding out/)).not.toBeInTheDocument();
  });

  it('the top Accuracy stat tile also uses the Wilson bound, not the naive overall ratio', async () => {
    const apiModule = await import('@/hooks/useApi');
    (apiModule.apiFetch as any).mockResolvedValueOnce({
      topics: [
        { topic: 'eigenvalues', totalProblems: 3, correct: 1, attempts: 1, mastery: 0.21, masteryConfidence: 'low', hasEnoughDataForLabel: false, easiness: 2.5, due: 0 },
      ],
      // Naive ratio here would be 100%; the Wilson bound must be well below it.
      overall: { problems_attempted: '1', total_correct: '1', total_attempts: '1', due_today: '0' },
      weakTopics: [],
    });

    await renderProgressPage();

    await waitFor(() => expect(screen.getByText('Accuracy')).toBeInTheDocument());
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });
});
