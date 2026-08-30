/**
 * ProblemStatementBlock — zero-pyq_count honesty (T4).
 *
 * Isolated in its own file because `vi.mock('@/generated/intent-slices.gen')`
 * is hoisted to the top of the module by vitest and would otherwise stub
 * the real generated data out from under ProblemStatementBlock.test.tsx's
 * other cases.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/generated/intent-slices.gen', () => ({
  INTENT_SLICES: {
    'zero-pyq-concept': {
      concept_id: 'zero-pyq-concept',
      dominant_intent: 'concept_clarification',
      pain_point: 'Students confuse the definition under time pressure.',
      exam_intent: 'Apply the property without re-deriving it.',
      subtopics: ['A property nobody has PYQ history for yet'],
      pyq_count: 0,
      inventory_total: 45,
      stage_order: ['formalism', 'worked_example', 'pyq_anchor'],
    },
  },
}));

describe('ProblemStatementBlock — pyq_count = 0', () => {
  it('omits the PYQ sentence entirely — never a zero or fabricated count', async () => {
    const user = userEvent.setup();
    const { ProblemStatementBlock } = await import('./ProblemStatementBlock');
    render(<ProblemStatementBlock conceptId="zero-pyq-concept" enabled />);
    expect(screen.getByTestId('problem-statement-block')).toBeInTheDocument();
    // Items 2-4 sit behind the "Common slips and past papers" expander since
    // the 2026-08-30 attention pass — open it before asserting on them.
    await user.click(screen.getByTestId('dps-more-trigger'));
    expect(screen.queryByText(/past-paper question/)).toBeNull();
    // The exam intent + pain point + framing line still render — only the
    // PYQ sentence is conditionally omitted.
    expect(screen.getByText('Apply the property without re-deriving it.')).toBeInTheDocument();
    expect(screen.getByText('Students confuse the definition under time pressure.')).toBeInTheDocument();
    expect(
      screen.getByText("Most students come here to look up the exact property, fast — that's how this page opens."),
    ).toBeInTheDocument();
  });
});
