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
