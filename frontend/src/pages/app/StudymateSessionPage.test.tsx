/**
 * StudymateSessionPage — regression coverage for two /investigate
 * (2026-09-02) findings:
 *
 *  1. "solution refers to an option letter while the question is not mcq":
 *     pyq_questions is 100% MCQ-format but this page always rendered a
 *     free-text box, so the student had no options to compare "Expected: B"
 *     against. Fixed by rendering an option picker whenever the problem
 *     carries an `options` map.
 *  2. "generating insights is not loading": the poll loop silently vanished
 *     after 6 failed attempts with no fallback state. Fixed by surfacing an
 *     honest "no insight available" message instead of nothing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const MCQ_PROBLEM = {
  problem_id: 'p-1',
  concept_id: 'complex-integration',
  topic: 'complex-variables',
  difficulty: 0.25,
  question: 'The value of the integral is:',
  expected_answer: 'B',
  options: { A: '0', B: '2*pi*i', C: 'pi', D: 'pi*i' },
  source: 'official_pyq',
};

const SESSION = {
  id: 'sm-1',
  session_id: 'anon-1',
  exam_id: 'gate-ma',
  session_type: 'daily',
  state: 'IN_PROGRESS',
  problem_count: 1,
  current_index: 0,
  problems: [MCQ_PROBLEM],
  frustration_mode: false,
};

function mockFetchRouting(handlers: Record<string, () => any>) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (url.includes(pattern)) {
        return { ok: true, json: async () => handler() } as Response;
      }
    }
    return { ok: true, json: async () => ({}) } as Response;
  }));
}

async function renderPage() {
  const Page = (await import('./StudymateSessionPage')).default;
  return render(
    <MemoryRouter initialEntries={['/studymate']}>
      <Page />
    </MemoryRouter>,
  );
}

describe('StudymateSessionPage — MCQ option rendering', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('renders option buttons instead of a free-text box when the problem carries options', async () => {
    mockFetchRouting({
      '/api/studymate/sessions/resume': () => SESSION,
    });
    await renderPage();

    await waitFor(() => expect(screen.getByText('The value of the integral is:')).toBeInTheDocument());
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(4);
    expect(screen.queryByPlaceholderText('Your answer…')).toBeNull();
  });

  it('shows the option text (not just the bare letter) in the "Expected" line on a wrong answer', async () => {
    mockFetchRouting({
      '/api/studymate/sessions/resume': () => SESSION,
      '/api/studymate/sessions/sm-1/answer': () => ({ ok: true }),
    });
    await renderPage();

    await waitFor(() => expect(screen.getByText('The value of the integral is:')).toBeInTheDocument());
    // Pick the wrong option (A), then submit.
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit Answer'));

    await waitFor(() => expect(screen.getByText('Not quite')).toBeInTheDocument());
    expect(screen.getByText(/2\*pi\*i/)).toBeInTheDocument();
  });
});

describe('StudymateSessionPage — insight-unavailable fallback', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('shows a fallback message instead of silently vanishing once polling exhausts', async () => {
    // /resume never carries gap_text — the poll loop exhausts every time.
    mockFetchRouting({
      '/api/studymate/sessions/resume': () => SESSION,
      '/api/studymate/sessions/sm-1/answer': () => ({ ok: true }),
    });
    await renderPage();

    await waitFor(() => expect(screen.getByText('The value of the integral is:')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]); // wrong option
    fireEvent.click(screen.getByText('Submit Answer'));

    await waitFor(() => expect(screen.getByText('Not quite')).toBeInTheDocument());
    expect(screen.getByText('Generating insight…')).toBeInTheDocument();

    // Poll cadence: 1000ms initial delay + up to 6 * 1500ms retries.
    await vi.advanceTimersByTimeAsync(1000 + 6 * 1500 + 100);

    expect(screen.queryByText('Generating insight…')).toBeNull();
    expect(screen.getByText(/No extra insight available/)).toBeInTheDocument();
  });
});
