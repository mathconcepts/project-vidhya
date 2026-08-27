/**
 * Tests for AttemptSkipDrillPage — the W-UI "W3.2 attempt/skip drill"
 * contract: button parity (equal size, neither primary), green ONLY on a
 * right call, neutral words on a wrong one, and the server's refusal
 * sentences shown verbatim.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AttemptSkipDrillPage from './AttemptSkipDrillPage';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));

const ITEM = {
  object_id: 'item-1',
  concept_id: 'determinants',
  topic: 'linear-algebra',
  question_text: 'What is det(I)?',
  question_type: 'mcq' as const,
  marks: 2,
  options: ['0', '1', '2', '3'],
  marking: { marks_correct: 2, marks_wrong: -(2 / 3) },
  break_even_sentence:
    'Wrong costs you ⅔ of a mark here, so attempting pays whenever you\'d get better than 25 in 100 right.',
};

const DRILL = {
  concept_id: 'determinants',
  concept_label: 'Determinants',
  items: [ITEM, { ...ITEM, object_id: 'item-2' }],
};

function ok(payload: unknown) {
  return { ok: true, status: 200, json: async () => payload } as any;
}
function fail(status: number, error: string) {
  return { ok: false, status, json: async () => ({ error }) } as any;
}

function wrap(search = '?concept=determinants') {
  return render(
    <MemoryRouter initialEntries={[`/attempt-skip-drill${search}`]}>
      <AttemptSkipDrillPage />
    </MemoryRouter>,
  );
}

async function authFetchMock() {
  const { authFetch } = await import('@/lib/auth/client');
  return vi.mocked(authFetch);
}

beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { vi.resetAllMocks(); });

describe('AttemptSkipDrillPage', () => {
  it('says what is missing when opened without a concept, rather than picking one', async () => {
    const fetchMock = await authFetchMock();
    wrap('');
    expect(screen.getByTestId('drill-no-concept')).toHaveTextContent('needs a concept to draw from');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server\'s refusal verbatim when there are too few items', async () => {
    const fetchMock = await authFetchMock();
    fetchMock.mockResolvedValue(fail(422, "3 gradable items for 'determinants', need 5"));
    wrap();
    await waitFor(() => expect(screen.getByTestId('drill-load-error')).toBeTruthy());
    expect(screen.getByTestId('drill-load-error'))
      .toHaveTextContent("3 gradable items for 'determinants', need 5");
  });

  it('shows the DB-less honesty sentence verbatim', async () => {
    const fetchMock = await authFetchMock();
    fetchMock.mockResolvedValue(fail(503, 'building your baseline — the attempt/skip drill needs your practice history'));
    wrap();
    await waitFor(() => expect(screen.getByTestId('drill-load-error')).toBeTruthy());
    expect(screen.getByTestId('drill-load-error')).toHaveTextContent('building your baseline');
  });

  describe('button parity', () => {
    it('Attempt and Skip are the same size and neither is styled primary', async () => {
      const fetchMock = await authFetchMock();
      fetchMock.mockResolvedValue(ok(DRILL));
      wrap();
      await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());

      const attempt = screen.getByTestId('drill-attempt-button');
      const skip = screen.getByTestId('drill-skip-button');

      // Same class, same inline style, same 44px floor — one style object
      // behind both, so they cannot drift apart.
      expect(attempt.className).toBe(skip.className);
      expect(attempt.getAttribute('style')).toBe(skip.getAttribute('style'));
      expect(attempt.style.minHeight).toBe('44px');
      expect(attempt.style.flex).toBe('1 1 0%');

      // Neither carries the mastery accent that marks a primary action.
      expect(attempt.getAttribute('style')).not.toContain('--green');
      expect(skip.getAttribute('style')).not.toContain('--green');
    });

    it('surfaces the marking and the break-even sentence before the call', async () => {
      const fetchMock = await authFetchMock();
      fetchMock.mockResolvedValue(ok(DRILL));
      wrap();
      await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());
      expect(screen.getByTestId('drill-marking-chip')).toHaveTextContent('MCQ');
      expect(screen.getByTestId('drill-marking-chip')).toHaveTextContent('−⅔');
      expect(screen.getByText(/25 in 100 right/)).toBeTruthy();
    });
  });

  describe('the skip arm', () => {
    it('a correct skip gets the GREEN confirmation — the sanctioned use', async () => {
      const fetchMock = await authFetchMock();
      fetchMock
        .mockResolvedValueOnce(ok(DRILL))
        .mockResolvedValueOnce(ok({
          verdict: 'good_skip',
          reason: 'Right call. You get about 15 in 100 right on this concept, and below 25 in 100 a 2-mark MCQ loses marks on average.',
        }));
      wrap();
      await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());
      fireEvent.click(screen.getByTestId('drill-skip-button'));

      await waitFor(() => expect(screen.getByTestId('drill-outcome')).toBeTruthy());
      const headline = screen.getByTestId('drill-outcome-headline');
      expect(headline).toHaveTextContent('Good skip');
      expect(headline.getAttribute('style')).toContain('var(--green-ink)');
      expect(screen.getByTestId('drill-outcome-reason')).toHaveTextContent('Right call');
    });

    it('a wrong skip gets neutral tokens and words — no red anywhere', async () => {
      const fetchMock = await authFetchMock();
      fetchMock
        .mockResolvedValueOnce(ok(DRILL))
        .mockResolvedValueOnce(ok({
          verdict: 'should_have_attempted',
          reason: 'Worth attempting. You get about 73 in 100 right on this concept, so answering this 2-mark MCQ was worth about 1.28 marks on average — a blank is a guaranteed zero.',
        }));
      const { container } = wrap();
      await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());
      fireEvent.click(screen.getByTestId('drill-skip-button'));

      await waitFor(() => expect(screen.getByTestId('drill-outcome')).toBeTruthy());
      const headline = screen.getByTestId('drill-outcome-headline');
      expect(headline).toHaveTextContent('This one was worth a try');
      expect(headline.getAttribute('style')).toContain('var(--text-primary)');
      expect(headline.getAttribute('style')).not.toContain('--green');
      expect(container.innerHTML).not.toContain('--red');
      expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      // The reason is a 17px sentence, not a code.
      expect(screen.getByTestId('drill-outcome-reason').getAttribute('style'))
        .toContain('var(--text-body)');
    });

    it('an honestly-unknown verdict is neither green nor a judgement', async () => {
      const fetchMock = await authFetchMock();
      fetchMock
        .mockResolvedValueOnce(ok(DRILL))
        .mockResolvedValueOnce(ok({
          verdict: 'unknown',
          reason: 'You have not answered enough questions on this concept yet for us to say.',
        }));
      wrap();
      await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());
      fireEvent.click(screen.getByTestId('drill-skip-button'));
      await waitFor(() => expect(screen.getByTestId('drill-outcome')).toBeTruthy());
      const headline = screen.getByTestId('drill-outcome-headline');
      expect(headline).toHaveTextContent('Skipped');
      expect(headline.getAttribute('style')).not.toContain('--green');
    });
  });

  describe('the attempt arm', () => {
    it('grades through POST /api/practice/attempt and greens a correct answer', async () => {
      const fetchMock = await authFetchMock();
      fetchMock
        .mockResolvedValueOnce(ok(DRILL))
        .mockResolvedValueOnce(ok({ grade: { earned: 2, max: 2, correct: true, feedback: 'Correct.' }, recorded: true }));
      wrap();
      await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());

      fireEvent.click(screen.getByTestId('drill-attempt-button'));
      fireEvent.click(screen.getByText('1'));
      fireEvent.click(screen.getByTestId('drill-submit-button'));

      await waitFor(() => expect(screen.getByTestId('drill-outcome')).toBeTruthy());
      expect(fetchMock.mock.calls[1][0]).toBe('/api/practice/attempt');
      const body = JSON.parse((fetchMock.mock.calls[1][1] as any).body);
      expect(body.object_id).toBe('item-1');
      expect(body.response).toEqual({ selectedIndex: 1 });
      expect(typeof body.ts).toBe('number');
      expect(screen.getByTestId('drill-outcome-headline').getAttribute('style'))
        .toContain('var(--green-ink)');
    });

    it('a wrong answer names the cost and repeats the break-even, without red', async () => {
      const fetchMock = await authFetchMock();
      fetchMock
        .mockResolvedValueOnce(ok(DRILL))
        .mockResolvedValueOnce(ok({ grade: { earned: -(2 / 3), max: 2, correct: false, feedback: 'x' }, recorded: true }));
      const { container } = wrap();
      await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());

      fireEvent.click(screen.getByTestId('drill-attempt-button'));
      fireEvent.click(screen.getByText('0'));
      fireEvent.click(screen.getByTestId('drill-submit-button'));

      await waitFor(() => expect(screen.getByTestId('drill-outcome')).toBeTruthy());
      expect(screen.getByTestId('drill-outcome-headline')).toHaveTextContent('Not this time');
      expect(screen.getByTestId('drill-outcome-reason')).toHaveTextContent('⅔');
      expect(screen.getByTestId('drill-outcome-reason')).toHaveTextContent('25 in 100');
      expect(container.innerHTML).not.toContain('--red');
    });
  });

  it('advances through the five items and closes honestly on the last one', async () => {
    const fetchMock = await authFetchMock();
    fetchMock
      .mockResolvedValueOnce(ok(DRILL))
      .mockResolvedValue(ok({ verdict: 'good_skip', reason: 'Right call.' }));
    wrap();
    await waitFor(() => expect(screen.getByTestId('drill-item')).toBeTruthy());

    fireEvent.click(screen.getByTestId('drill-skip-button'));
    await waitFor(() => expect(screen.getByTestId('drill-next-button')).toBeTruthy());
    fireEvent.click(screen.getByTestId('drill-next-button'));

    expect(screen.getByText('Question 2 of 2')).toBeTruthy();
    fireEvent.click(screen.getByTestId('drill-skip-button'));
    await waitFor(() => expect(screen.getByTestId('drill-done')).toBeTruthy());
    expect(screen.queryByTestId('drill-next-button')).toBeNull();
  });
});
