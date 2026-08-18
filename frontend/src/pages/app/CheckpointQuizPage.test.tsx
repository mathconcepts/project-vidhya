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

async function renderPage() {
  const Page = (await import('./CheckpointQuizPage')).default;
  return render(
    <MemoryRouter>
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
