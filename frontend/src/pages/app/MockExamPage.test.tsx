/**
 * MockExamPage — MSQ submission contract.
 *
 * Bug: MSQ questions rendered a single-select radiogroup and handleSubmit
 * never emitted `selectedIndices`, so the server graded every MSQ item as
 * skipped (src/api/mock-exam-routes.ts parses `rr.selectedIndices` per
 * response — see gateResponseFromBody's contract). This locks the fix:
 * MSQ renders a real multi-select (checkboxes) and submits
 * `{ id, selectedIndices: number[] }` per selected item.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));

beforeEach(async () => {
  const { authFetch } = await import('@/lib/auth/client');
  vi.mocked(authFetch).mockReset();
});

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

const EXAM = {
  exam_id: 'exam-1',
  exam_name: 'GATE Mock',
  time_limit_minutes: 180,
  total_questions: 1,
  marks_scheme: { correct: 2, wrong: -0.66 },
  section_breakdown: {},
  questions: [
    {
      id: 'q-msq-1',
      question_text: 'Which of the following are prime?',
      options: ['2', '4', '5', '9'],
      gradable: true,
      question_type: 'msq' as const,
      topic: 'number-theory',
      difficulty: 'medium',
      marks: 2,
    },
  ],
};

async function renderPage() {
  const Page = (await import('./MockExamPage')).default;
  return render(<Page />);
}

describe('MockExamPage — MSQ', () => {
  it('renders MSQ options as a real multi-select (checkboxes), not a single-select radiogroup', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue(jsonResponse(EXAM));
    await renderPage();

    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which of the following are prime?')).toBeInTheDocument());

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('group')).toBeInTheDocument();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(4);
    boxes.forEach((b) => expect(b).toHaveAttribute('aria-checked', 'false'));
  });

  it('an MSQ submission carries selectedIndices for every option picked', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(EXAM)) // GET exam
      .mockResolvedValueOnce(jsonResponse({ // POST submit
        exam_id: 'exam-1', total: 1, correct: 1, wrong: 0, skipped: 0, ungraded: 0,
        marks: 2, max_marks: 2, accuracy: 1, by_topic: {}, late: false, recorded: true,
      }));
    await renderPage();

    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which of the following are prime?')).toBeInTheDocument());

    const boxes = screen.getAllByRole('checkbox');
    fireEvent.click(boxes[0]); // '2'
    fireEvent.click(boxes[2]); // '5'
    expect(boxes[0]).toHaveAttribute('aria-checked', 'true');
    expect(boxes[2]).toHaveAttribute('aria-checked', 'true');
    expect(boxes[1]).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(screen.getByText('Submit Exam'));

    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(2));
    const submitCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/submit'));
    expect(submitCall).toBeDefined();
    const body = JSON.parse((submitCall![1] as RequestInit).body as string);
    expect(body.responses).toEqual([{ id: 'q-msq-1', selectedIndices: [0, 2] }]);
  });

  it('an untouched MSQ question submits as skipped, not a bogus empty selectedIndices', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(EXAM))
      .mockResolvedValueOnce(jsonResponse({
        exam_id: 'exam-1', total: 1, correct: 0, wrong: 0, skipped: 1, ungraded: 0,
        marks: 0, max_marks: 2, accuracy: 0, by_topic: {}, late: false, recorded: true,
      }));
    await renderPage();

    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which of the following are prime?')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Submit Exam'));

    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(2));
    const submitCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/submit'));
    const body = JSON.parse((submitCall![1] as RequestInit).body as string);
    expect(body.responses).toEqual([{ id: 'q-msq-1' }]);
  });
});
