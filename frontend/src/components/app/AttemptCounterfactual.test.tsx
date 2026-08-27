/**
 * Tests for AttemptCounterfactual — the W-UI "W3.2 counterfactual"
 * contract, asserted rather than trusted: beat order, the item cap, no
 * receipt border, the success state's real copy, the attempt-more
 * inversion, and the headline-only degradation.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AttemptCounterfactual, type CounterfactualReportView } from './AttemptCounterfactual';

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function decision(id: string, cost: number, over: Partial<CounterfactualReportView['top_decisions'][number]> = {}) {
  return {
    object_id: id,
    question_kind: 'mcq' as const,
    marks: 2,
    topic: 'eigenvalues',
    concept_id: 'determinants',
    decision: 'attempted_wrong' as const,
    cost_marks: cost,
    marks_wrong: -(2 / 3),
    accuracy: null,
    topic_attempts: null,
    label: `You answered a 2-mark question on eigenvalues and it went wrong. (${id})`,
    detail: 'A wrong MCQ here is minus ⅔ of a mark; leaving it blank would have cost you nothing.',
    ...over,
  };
}

function report(over: Partial<CounterfactualReportView> = {}): CounterfactualReportView {
  return {
    available: true,
    state: 'decisions',
    reason: null,
    earned: 24,
    max_available: 65,
    graded_questions: 20,
    attempted: 18,
    skipped: 2,
    marks_close_to: 26,
    recoverable_marks: 2,
    top_decisions: [decision('q1', 0.67), decision('q2', 0.67), decision('q3', 0.66)],
    remainder_count: 0,
    remainder_marks: 0,
    break_even: [{
      question_kind: 'mcq', marks: 2, marks_wrong: -(2 / 3), break_even_p: 0.25,
      sentence: 'On a 2-mark MCQ a wrong answer is minus ⅔ of a mark, so it pays to answer whenever you\'d get better than 25 in 100 right.',
    }],
    drill_concept_id: 'determinants',
    beats: {
      earned: 'You scored 24 of 65 marks.',
      competence: 'You were already good for 26 marks on this paper.',
      gap: 'The 2 marks between that and your score came from attempt-or-skip calls, not from anything you still need to learn.',
      action: 'Practise the attempt-or-skip call',
    },
    ...over,
  };
}

describe('AttemptCounterfactual', () => {
  it('renders nothing at all without a report — an older server is not an error state', () => {
    const { container } = wrap(<AttemptCounterfactual report={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the four beats in contract order', () => {
    const { container } = wrap(<AttemptCounterfactual report={report()} />);
    const order = [...container.querySelectorAll('[data-testid^="cf-"]')]
      .map((el) => el.getAttribute('data-testid'))
      .filter((id) => id === 'cf-beat-earned' || id === 'cf-beat-competence'
        || id === 'cf-beat-gap' || id === 'cf-drill-cta');
    expect(order).toEqual(['cf-beat-earned', 'cf-beat-competence', 'cf-beat-gap', 'cf-drill-cta']);
  });

  it('places every beat sentence exactly as the server phrased it', () => {
    wrap(<AttemptCounterfactual report={report()} />);
    expect(screen.getByTestId('cf-beat-earned')).toHaveTextContent('You scored 24 of 65 marks.');
    expect(screen.getByTestId('cf-beat-competence')).toHaveTextContent('already good for 26 marks');
    expect(screen.getByTestId('cf-beat-gap')).toHaveTextContent('attempt-or-skip calls');
  });

  it('renders exactly ONE action, and it is a full-width 44px control', () => {
    wrap(<AttemptCounterfactual report={report()} />);
    const cta = screen.getByTestId('cf-drill-cta');
    expect(cta).toHaveTextContent('Practise the attempt-or-skip call');
    expect(cta).toHaveAttribute('href', '/attempt-skip-drill?concept=determinants');
    expect(cta.style.width).toBe('100%');
    expect(cta.style.minHeight).toBe('44px');
    // "exactly ONE action" — no second link or button in the section.
    const section = screen.getByTestId('attempt-counterfactual');
    expect(section.querySelectorAll('a, button')).toHaveLength(1);
  });

  it('never renders a receipt border — recoverable marks are analysis, not a receipt', () => {
    const { container } = wrap(<AttemptCounterfactual report={report()} />);
    expect(container.querySelector('[data-receipt]')).toBeNull();
    expect(container.querySelector('.receipt-border')).toBeNull();
    expect(container.innerHTML).not.toContain('--receipt-mark');
  });

  it('uses no accent colour — an attempt review is neither mastery nor AI', () => {
    const { container } = wrap(<AttemptCounterfactual report={report()} />);
    expect(container.innerHTML).not.toContain('--green');
    expect(container.innerHTML).not.toContain('--indigo');
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('holds the 17px floor: labels are body text, supporting lines are 15px, nothing is 13px', () => {
    const { container } = wrap(<AttemptCounterfactual report={report()} />);
    expect(container.innerHTML).not.toContain('--text-footnote');
    expect(container.innerHTML).not.toContain('--text-caption)');
    const rows = screen.getAllByTestId('cf-decision-row');
    expect(within(rows[0]).getByText(/You answered a 2-mark question/).getAttribute('style'))
      .toContain('var(--text-body)');
  });

  describe('the item cap', () => {
    it('renders at most three decision rows — the server caps, the component does not re-slice', () => {
      wrap(<AttemptCounterfactual report={report()} />);
      expect(screen.getAllByTestId('cf-decision-row')).toHaveLength(3);
    });

    it('collapses everything beyond the cap into one line', () => {
      wrap(<AttemptCounterfactual report={report({ remainder_count: 4, remainder_marks: 1.33 })} />);
      const line = screen.getByTestId('cf-remainder');
      expect(line).toHaveTextContent('4 more calls');
      expect(line).toHaveTextContent('1.33');
      // Still three rows, not seven — no shame ledger.
      expect(screen.getAllByTestId('cf-decision-row')).toHaveLength(3);
    });
  });

  describe('the success state', () => {
    const clean = report({
      state: 'clean',
      recoverable_marks: 0,
      marks_close_to: 24,
      top_decisions: [],
      beats: {
        earned: 'You scored 24 of 65 marks.',
        competence: 'You extracted everything you knew — every attempt-or-skip call on this paper was the right one.',
        gap: null,
        action: 'Keep the call sharp — 5-question drill',
      },
    });

    it('gets real copy, not a blank section', () => {
      wrap(<AttemptCounterfactual report={clean} />);
      expect(screen.getByTestId('cf-beat-competence'))
        .toHaveTextContent('You extracted everything you knew');
    });

    it('carries no loss language, because beat 3 does not render at all', () => {
      wrap(<AttemptCounterfactual report={clean} />);
      expect(screen.queryByTestId('cf-beat-gap')).toBeNull();
      expect(screen.queryAllByTestId('cf-decision-row')).toHaveLength(0);
      expect(screen.getByTestId('attempt-counterfactual').textContent).not.toMatch(/cost|lost|left on the table/i);
    });
  });

  describe('the mostly-skipped inversion', () => {
    it('coaches attempt-more instead of praising the skips', () => {
      wrap(<AttemptCounterfactual report={report({
        state: 'attempt_more',
        attempted: 12,
        skipped: 28,
        top_decisions: [],
        recoverable_marks: 0,
        beats: {
          earned: 'You scored 24 of 65 marks.',
          competence: 'You answered 12 of 40 questions and banked 24 marks doing it.',
          gap: 'You left 28 questions blank. A blank is a guaranteed zero, and on this paper most of them were worth a shot.',
          action: 'Practise the attempt-or-skip call',
        },
      })} />);
      expect(screen.getByTestId('cf-beat-gap')).toHaveTextContent('guaranteed zero');
      expect(screen.getByTestId('attempt-counterfactual').textContent).not.toContain('extracted everything');
    });
  });

  describe('the headline-only degradation', () => {
    const legacy = report({
      available: false,
      state: 'unavailable',
      reason: 'this mock was graded before per-question analysis existed, so it carries no per-question breakdown to review',
      top_decisions: [],
      break_even: [],
      beats: { earned: '', competence: null, gap: null, action: null },
    });

    it('shows the server\'s reason and nothing else — never a fabricated breakdown', () => {
      wrap(<AttemptCounterfactual report={legacy} />);
      expect(screen.getByTestId('attempt-counterfactual'))
        .toHaveTextContent('graded before per-question analysis existed');
      expect(screen.queryByTestId('cf-decision-row')).toBeNull();
      expect(screen.queryByTestId('cf-beat-competence')).toBeNull();
      expect(screen.queryByTestId('cf-drill-cta')).toBeNull();
      expect(screen.queryByTestId('cf-break-even')).toBeNull();
    });
  });

  describe('an unmapped paper', () => {
    it('replaces the CTA with an honest sentence rather than a dead button', () => {
      wrap(<AttemptCounterfactual report={report({ drill_concept_id: null })} />);
      expect(screen.queryByTestId('cf-drill-cta')).toBeNull();
      expect(screen.getByTestId('cf-drill-unavailable'))
        .toHaveTextContent("aren't mapped to a concept yet");
    });
  });

  it('renders the break-even line as the server\'s sentence, never as a probability', () => {
    wrap(<AttemptCounterfactual report={report()} />);
    const line = screen.getByTestId('cf-break-even');
    expect(line).toHaveTextContent('25 in 100');
    expect(line.textContent).not.toMatch(/0\.25|EV|expected value/);
  });
});
