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

/**
 * C1's topic picker fetches `/api/gbrain/mock-exam/topics` on mount — an
 * extra authFetch call ahead of every GET-exam/POST-submit sequence these
 * tests already exercise. This helper keeps every test's sequence exactly
 * as it reads (GET exam, then POST submit, in that order) by answering the
 * topics call out of band, dispatched on URL rather than call position;
 * `responses` still serves in strict order for every OTHER call, repeating
 * the last entry for any call past the end (mirrors plain mockResolvedValue's
 * "keep returning this" behavior for the single-response tests).
 */
function mockAuthFetchSequence(authFetchMock: any, responses: Response[]) {
  let i = 0;
  authFetchMock.mockImplementation(async (url: unknown) => {
    if (String(url).includes('/mock-exam/topics')) return jsonResponse({ topics: [] });
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return r;
  });
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
    mockAuthFetchSequence(vi.mocked(authFetch), [jsonResponse(EXAM)]);
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
    mockAuthFetchSequence(vi.mocked(authFetch), [
      jsonResponse(EXAM), // GET exam
      jsonResponse({ // POST submit
        exam_id: 'exam-1', total: 1, correct: 1, wrong: 0, skipped: 0, ungraded: 0,
        marks: 2, max_marks: 2, accuracy: 1, by_topic: {}, late: false, recorded: true,
      }),
    ]);
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

    // topics (mount) + GET exam + POST submit = 3.
    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(3));
    const submitCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/submit'));
    expect(submitCall).toBeDefined();
    const body = JSON.parse((submitCall![1] as RequestInit).body as string);
    expect(body.responses).toEqual([{ id: 'q-msq-1', selectedIndices: [0, 2] }]);
  });

  it('an untouched MSQ question submits as skipped, not a bogus empty selectedIndices', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchSequence(vi.mocked(authFetch), [
      jsonResponse(EXAM),
      jsonResponse({
        exam_id: 'exam-1', total: 1, correct: 0, wrong: 0, skipped: 1, ungraded: 0,
        marks: 0, max_marks: 2, accuracy: 0, by_topic: {}, late: false, recorded: true,
      }),
    ]);
    await renderPage();

    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which of the following are prime?')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Submit Exam'));

    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(3));
    const submitCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/submit'));
    const body = JSON.parse((submitCall![1] as RequestInit).body as string);
    expect(body.responses).toEqual([{ id: 'q-msq-1' }]);
  });
});

// ────────────────────────────────────────────────────────────────────
// Adversarial-review fix (CRITICAL): timer-expiry stale closure
// ────────────────────────────────────────────────────────────────────
//
// Identical pre-existing idiom to CheckpointQuizPage's countdown effect:
// it only re-runs on [phase], so without the latestSubmitRef fix,
// `handleSubmit` inside it would be the closure captured when the timer
// started (`answers` still `{}`) — an expiry auto-submit would grade as
// if the student answered nothing. This locks the fix.

const MCQ_EXAM = {
  exam_id: 'exam-timer-1',
  exam_name: 'GATE Mock',
  time_limit_minutes: 2 / 60, // 2 seconds
  total_questions: 1,
  marks_scheme: { correct: 2, wrong: -0.66 },
  section_breakdown: {},
  questions: [
    {
      id: 'q-mcq-1',
      question_text: 'Which is prime?',
      options: ['4', '5', '9'],
      gradable: true,
      question_type: 'mcq' as const,
      topic: 'number-theory',
      difficulty: 'medium',
      marks: 2,
    },
  ],
};

describe('MockExamPage — timer expiry submits the real answer, not a stale skip', () => {
  it('an answer selected before expiry is what gets submitted when the clock runs out', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchSequence(vi.mocked(authFetch), [
      jsonResponse(MCQ_EXAM), // GET exam
      jsonResponse({ // POST submit
        exam_id: 'exam-timer-1', total: 1, correct: 1, wrong: 0, skipped: 0, ungraded: 0,
        marks: 2, max_marks: 2, accuracy: 1, by_topic: {}, late: true, recorded: true,
      }),
    ]);
    // Real timers throughout — see the identical note in
    // CheckpointQuizPage.test.tsx (the interval is registered by a
    // useEffect that fires during the render/click above, so switching
    // to fake timers afterward wouldn't touch it). time_limit_minutes is
    // set to 2 seconds specifically so this test's real wait stays short.
    await renderPage();

    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which is prime?')).toBeInTheDocument());

    // Pick option "5" (index 1) — this is the render whose closure MUST
    // be the one the expiry auto-submit uses.
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    // Wait for the real countdown (2s) to expire and auto-submit.
    // topics (mount) + GET exam + POST submit = 3.
    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(3), { timeout: 4000 });
    const submitCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/submit'));
    expect(submitCall).toBeDefined();
    const body = JSON.parse((submitCall![1] as RequestInit).body as string);
    // The real pick — NOT { id: 'q-mcq-1' } (skipped).
    expect(body.responses).toEqual([{ id: 'q-mcq-1', selectedIndex: 1 }]);
  }, 8000);
});

// ────────────────────────────────────────────────────────────────────
// Regression lock: both failure paths render an in-page error surface
// instead of a browser alert(), and a failed submit never discards the
// student's mid-exam state.
// ────────────────────────────────────────────────────────────────────

const MCQ_EXAM_LONG = {
  exam_id: 'exam-submit-fail',
  exam_name: 'GATE Mock',
  time_limit_minutes: 180, // generous — this suite is not testing timer expiry
  total_questions: 1,
  marks_scheme: { correct: 2, wrong: -0.66 },
  section_breakdown: {},
  questions: [
    {
      id: 'q-mcq-fail',
      question_text: 'Which is prime?',
      options: ['4', '5', '9'],
      gradable: true,
      question_type: 'mcq' as const,
      topic: 'number-theory',
      difficulty: 'medium',
      marks: 2,
    },
  ],
};

describe('MockExamPage — start failure renders in-page, never alert()', () => {
  it('shows the server error message inline and does not call window.alert', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchSequence(vi.mocked(authFetch), [
      jsonResponse({ error: 'mock exam unavailable — try again shortly' }, false),
    ]);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await renderPage();
    fireEvent.click(screen.getByText('Start Mock Exam'));

    await waitFor(() =>
      expect(screen.getByText('mock exam unavailable — try again shortly')).toBeInTheDocument()
    );
    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});

describe('MockExamPage — submit failure keeps the exam intact for a retry', () => {
  it('renders an error inline, leaves the answer + exam in progress, and a retry succeeds', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchSequence(vi.mocked(authFetch), [
      jsonResponse(MCQ_EXAM_LONG), // GET exam succeeds
      jsonResponse({ error: 'mock exam unavailable — try again shortly' }, false), // submit fails
      jsonResponse({ // retry submit succeeds
        exam_id: 'exam-submit-fail', total: 1, correct: 1, wrong: 0, skipped: 0, ungraded: 0,
        marks: 2, max_marks: 2, accuracy: 1, by_topic: {}, late: false, recorded: true,
      }),
    ]);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await renderPage();
    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which is prime?')).toBeInTheDocument());

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]); // pick '5'
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByText('Submit Exam'));
    await waitFor(() =>
      expect(screen.getByText('mock exam unavailable — try again shortly')).toBeInTheDocument()
    );
    expect(alertSpy).not.toHaveBeenCalled();

    // The exam is still in progress — the question and the student's
    // selected answer were never discarded by the failed submit.
    expect(screen.getByText('Which is prime?')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');

    // Retry re-runs the same submit and succeeds.
    fireEvent.click(screen.getByText('Retry submit'));
    await waitFor(() => expect(screen.getByText('Take Another Mock')).toBeInTheDocument());

    const submitCalls = vi.mocked(authFetch).mock.calls.filter(([url]) => String(url).includes('/submit'));
    expect(submitCalls).toHaveLength(2);
    const retryBody = JSON.parse((submitCalls[1][1] as RequestInit).body as string);
    // The retry still carries the answer picked before the first (failed) submit.
    expect(retryBody.responses).toEqual([{ id: 'q-mcq-fail', selectedIndex: 1 }]);

    alertSpy.mockRestore();
  });
});

// ────────────────────────────────────────────────────────────────────
// C1 (topic-wise mocks) + C2 (exam-feel timing modes)
// ────────────────────────────────────────────────────────────────────

const TOPICS_RESPONSE = {
  topics: [
    { id: 'linear-algebra', name: 'Linear Algebra', weight: 0.15 },
    { id: 'calculus', name: 'Calculus', weight: 0.15 },
  ],
};

function mockAuthFetchWithTopics(authFetchMock: any, topics: unknown, rest: Response[]) {
  let i = 0;
  authFetchMock.mockImplementation(async (url: unknown) => {
    if (String(url).includes('/mock-exam/topics')) return jsonResponse(topics);
    const r = rest[Math.min(i, rest.length - 1)];
    i++;
    return r;
  });
}

describe('MockExamPage — C1 topic-wise mocks', () => {
  it('renders a chip per topic from the server, unselected by default (full syllabus)', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchWithTopics(vi.mocked(authFetch), TOPICS_RESPONSE, [jsonResponse(EXAM)]);
    await renderPage();

    await waitFor(() => expect(screen.getByText('Linear Algebra')).toBeInTheDocument());
    expect(screen.getByText('Calculus')).toBeInTheDocument();
    expect(screen.getByText(/full syllabus/)).toBeInTheDocument();
  });

  it('selecting a topic appends it to the ?topics= query string on start', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchWithTopics(vi.mocked(authFetch), TOPICS_RESPONSE, [jsonResponse(EXAM)]);
    await renderPage();

    await waitFor(() => expect(screen.getByText('Linear Algebra')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Linear Algebra'));
    expect(screen.getByText(/1 selected/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which of the following are prime?')).toBeInTheDocument());

    const genCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/mock-exam/') && !String(url).includes('/topics'));
    expect(genCall).toBeDefined();
    expect(String(genCall![0])).toContain('topics=linear-algebra');
  });
});

describe('MockExamPage — C2 exam-feel timing modes', () => {
  it('defaults to Standard and omits ?mode= from the start request', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchSequence(vi.mocked(authFetch), [jsonResponse(EXAM)]);
    await renderPage();

    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which of the following are prime?')).toBeInTheDocument());

    const genCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/mock-exam/') && !String(url).includes('/topics'));
    expect(String(genCall![0])).not.toContain('mode=');
  });

  it('selecting Rush sends ?mode=rush and the timer bar + results surface it', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchSequence(vi.mocked(authFetch), [
      jsonResponse({ ...EXAM, timing_mode: 'rush', time_limit_minutes: 126 }),
      jsonResponse({
        exam_id: 'exam-1', total: 1, correct: 1, wrong: 0, skipped: 0, ungraded: 0,
        marks: 2, max_marks: 2, accuracy: 1, by_topic: {}, late: false, timing_mode: 'rush', recorded: true,
      }),
    ]);
    await renderPage();

    fireEvent.click(screen.getByText('Rush'));
    fireEvent.click(screen.getByText('Start Mock Exam'));
    await waitFor(() => expect(screen.getByText('Which of the following are prime?')).toBeInTheDocument());

    const genCall = vi.mocked(authFetch).mock.calls.find(([url]) => String(url).includes('/mock-exam/') && !String(url).includes('/topics'));
    expect(String(genCall![0])).toContain('mode=rush');
    expect(screen.getByText(/Rush/)).toBeInTheDocument(); // timer-bar chip

    fireEvent.click(screen.getByText('Submit Exam'));
    await waitFor(() => expect(screen.getByText('You did this under rush timing.')).toBeInTheDocument());
  });
});

describe('MockExamPage — internals-looking messages fall back to a generic sentence', () => {
  it('never renders a raw exception string that starts with a bracketed module tag', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    mockAuthFetchSequence(vi.mocked(authFetch), [
      jsonResponse({ error: '[mock-exam-store] write failed: ECONNRESET' }, false),
    ]);

    await renderPage();
    fireEvent.click(screen.getByText('Start Mock Exam'));

    await waitFor(() =>
      expect(screen.getByText('Could not start your exam — try again shortly.')).toBeInTheDocument()
    );
    expect(screen.queryByText(/mock-exam-store/)).not.toBeInTheDocument();
  });
});
