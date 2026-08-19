/**
 * CheckpointQuizPage — NAT input branch.
 *
 * Bug: the options-driven render branch only covered mcq/msq (radio/
 * checkbox buttons); a NAT item drawn into the quiz pool has `options:
 * null` and hit no input branch at all, so it could never be answered.
 * This locks the fix: a numeric-input branch renders for
 * `question_type === 'nat'` and a valid entry reaches `responses` as
 * `{ value: number }` (the server's Response contract), enabling
 * "Submit & next"/"Finish".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

const NAT_QUIZ = {
  quiz_id: 'quiz-1',
  deadline_at: new Date(Date.now() + 480_000).toISOString(),
  time_budget_sec: 480,
  items: [
    {
      object_id: 'obj-nat-1',
      topic: 'limits',
      question_text: 'Evaluate the limit.',
      gradable: true,
      question_type: 'nat' as const,
      marks: 2,
      options: null,
      marking: { marks_correct: 2, marks_wrong: 0 },
    },
  ],
};

async function renderPage(initialEntries: string[] = ['/checkpoint']) {
  const Page = (await import('./CheckpointQuizPage')).default;
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Page />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  const { authFetch } = await import('@/lib/auth/client');
  vi.mocked(authFetch).mockReset();
});

describe('CheckpointQuizPage — NAT items', () => {
  it('renders a numeric input for a NAT item instead of no input at all', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValueOnce(jsonResponse(NAT_QUIZ));
    await renderPage();

    fireEvent.click(screen.getByText('Start checkpoint'));
    await waitFor(() => expect(screen.getByText('Evaluate the limit.')).toBeInTheDocument());

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Numeric answer…')).toBeInTheDocument();
  });

  it('a valid numeric entry unlocks advance and submits { value } for that item', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(NAT_QUIZ)) // POST start
      .mockResolvedValueOnce(jsonResponse({ // POST submit
        earned: 2, max: 2, correct: 1, wrong: 0, skipped: 0, per_item: [], late: false, recorded: true,
      }));
    await renderPage();

    fireEvent.click(screen.getByText('Start checkpoint'));
    await waitFor(() => expect(screen.getByText('Evaluate the limit.')).toBeInTheDocument());

    // Before typing, advance is disabled (no response recorded yet).
    const finishButton = screen.getByText('Finish');
    expect(finishButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Numeric answer…');
    fireEvent.change(input, { target: { value: '3.5' } });
    expect(input).toHaveValue(3.5);
    expect(finishButton).not.toBeDisabled();

    fireEvent.click(finishButton);

    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(2));
    const submitCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/submit'));
    expect(submitCall).toBeDefined();
    const body = JSON.parse((submitCall![1] as RequestInit).body as string);
    expect(body.responses).toEqual([{ object_id: 'obj-nat-1', value: 3.5 }]);
  });

  it('an invalid/partial entry does not record a bogus response', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValueOnce(jsonResponse(NAT_QUIZ));
    await renderPage();

    fireEvent.click(screen.getByText('Start checkpoint'));
    await waitFor(() => expect(screen.getByText('Evaluate the limit.')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Numeric answer…');
    fireEvent.change(input, { target: { value: '-' } });
    expect(screen.getByText('Finish')).toBeDisabled();
  });
});

// ────────────────────────────────────────────────────────────────────
// Concept-scoped entry — /checkpoint?concept=<id> (walkthrough Test leg)
// ────────────────────────────────────────────────────────────────────

describe('CheckpointQuizPage — concept-scoped entry', () => {
  it('threads ?concept= through as concept_id in the start request body', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValueOnce(jsonResponse(NAT_QUIZ));
    await renderPage(['/checkpoint?concept=eigenvalues']);

    fireEvent.click(screen.getByText('Start checkpoint'));
    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(1));

    const startCall = vi.mocked(authFetch).mock.calls[0];
    expect(startCall[0]).toBe('/api/practice/quiz/start');
    const body = JSON.parse((startCall[1] as RequestInit).body as string);
    expect(body).toEqual({ concept_id: 'eigenvalues' });
  });

  it('omits concept_id entirely when there is no ?concept= param — unscoped stays unscoped', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValueOnce(jsonResponse(NAT_QUIZ));
    await renderPage(['/checkpoint']);

    fireEvent.click(screen.getByText('Start checkpoint'));
    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(1));

    const startCall = vi.mocked(authFetch).mock.calls[0];
    const body = JSON.parse((startCall[1] as RequestInit).body as string);
    expect(body).toEqual({});
  });

  it('a concept-scoped start still honors the honest 422 refusal, same as unscoped', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValueOnce(jsonResponse({ error: 'Checkpoint unlocks as you practise more' }, false));
    await renderPage(['/checkpoint?concept=eigenvalues']);

    fireEvent.click(screen.getByText('Start checkpoint'));
    await waitFor(() => expect(screen.getByText('Checkpoint unlocks as you practise more')).toBeInTheDocument());
  });
});

// ────────────────────────────────────────────────────────────────────
// Adversarial-review fix (CRITICAL): timer-expiry stale closure
// ────────────────────────────────────────────────────────────────────
//
// The countdown interval's effect only re-runs on [phase, quiz], so
// without the latestSubmitRef fix, `handleSubmit` inside it would always
// be the closure captured at quiz start — with `responses` still `{}` —
// meaning an expiry auto-submit sent `{skipped:true}` for every item
// regardless of what the student actually picked. This locks the fix:
// the answer selected before expiry reaches the server, not a skip.

const MCQ_QUIZ = {
  quiz_id: 'quiz-timer-1',
  deadline_at: new Date(Date.now() + 2_000).toISOString(),
  time_budget_sec: 2,
  items: [
    {
      object_id: 'obj-mcq-1',
      topic: 'eigenvalues',
      question_text: 'Which is an eigenvalue?',
      gradable: true,
      question_type: 'mcq' as const,
      marks: 2,
      options: ['1', '2', '3'],
      marking: { marks_correct: 2, marks_wrong: -0.66 },
    },
  ],
};

describe('CheckpointQuizPage — timer expiry submits the real answer, not a stale skip', () => {
  it('an answer selected before expiry is what gets submitted when the clock runs out', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_QUIZ)) // POST start
      .mockResolvedValueOnce(jsonResponse({ // POST submit
        earned: 2, max: 2, correct: 1, wrong: 0, skipped: 0, per_item: [], late: true, recorded: true,
      }));
    // Real timers throughout — the countdown's setInterval is registered
    // by a useEffect that fires DURING the initial render/click above, so
    // switching to fake timers afterward would leave that real interval
    // running unaffected. time_budget_sec is set to 2s specifically so
    // this test's real wall-clock wait stays short.
    await renderPage();

    fireEvent.click(screen.getByText('Start checkpoint'));
    await waitFor(() => expect(screen.getByText('Which is an eigenvalue?')).toBeInTheDocument());

    // Pick option "2" (index 1) — this is the render whose closure MUST
    // be the one the expiry auto-submit uses.
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    // Wait for the real countdown (time_budget_sec: 2) to expire and
    // auto-submit.
    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(2), { timeout: 4000 });
    const submitCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/submit'));
    expect(submitCall).toBeDefined();
    const body = JSON.parse((submitCall![1] as RequestInit).body as string);
    // The real pick — NOT { object_id: 'obj-mcq-1', skipped: true }.
    expect(body.responses).toEqual([{ object_id: 'obj-mcq-1', selectedIndex: 1 }]);
  }, 8000);
});
