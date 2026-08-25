/**
 * ProblemStatementBlock — DPS render contract (T4).
 *
 * Covers: flag-off renders nothing, unmapped concept renders nothing
 * (honest reduced frame — never a broken block), and a mapped concept
 * renders pain point + exam intent + PYQ sentence + intent framing line.
 *
 * The zero-pyq_count "omit the PYQ sentence" case lives in
 * ProblemStatementBlock.zeroPyq.test.tsx — `vi.mock` calls are hoisted to
 * the top of their file by vitest, so a mocked `intent-slices.gen` module
 * can't share a file with tests that need the real generated data.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProblemStatementBlock } from './ProblemStatementBlock';
import { INTENT_SLICES } from '@/generated/intent-slices.gen';

describe('ProblemStatementBlock', () => {
  it('renders nothing when disabled, even for a mapped concept', () => {
    const { container } = render(<ProblemStatementBlock conceptId="eigenvalues" enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for an unmapped concept, even when enabled', () => {
    const { container } = render(<ProblemStatementBlock conceptId="not-a-real-concept" enabled />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the pain point, exam intent, PYQ count and intent framing line for a mapped concept', () => {
    const slice = INTENT_SLICES['eigenvalues'];
    expect(slice).toBeDefined(); // sanity: the fixture this test depends on actually exists
    render(<ProblemStatementBlock conceptId="eigenvalues" enabled />);
    expect(screen.getByTestId('problem-statement-block')).toBeInTheDocument();
    expect(screen.getByText(slice.pain_point)).toBeInTheDocument();
    expect(screen.getByText(slice.exam_intent)).toBeInTheDocument();
    const plural = slice.pyq_count === 1 ? '' : 's';
    expect(
      screen.getByText(`${slice.pyq_count} past-paper question${plural} mapped to this concept.`),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Most students come here to practise real questions — that's how this page opens."),
    ).toBeInTheDocument();
  });
});
