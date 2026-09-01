/**
 * ProblemStatementBlock — DPS render contract (T4).
 *
 * Covers: flag-off renders nothing, unmapped concept renders nothing
 * (honest reduced frame — never a broken block), and a mapped concept
 * renders exam intent + pain point + PYQ sentence + intent framing line.
 *
 * The ORDER case is not a layout test. The 2026-08-27 plan's P0 tone pass
 * (amendment D23) moved the exam intent above the pain point and retitled
 * the pain-point eyebrow, because all 26 Linear Algebra concepts share one
 * pain-point string and it was opening every page under "Where marks die on
 * this topic". Reordering is invisible in a diff of a JSX return, so the
 * decision is asserted here rather than left to be re-litigated.
 *
 * 2026-08-30 attention pass: items 2-4 moved behind a "Common slips and past
 * papers" expander (the four-paragraph block was eating 55% of a 390px first
 * screen). The order case below is unchanged and still authoritative — it
 * just expands first. A NEW case asserts the exam intent is readable WITHOUT
 * expanding, which is the half of the contract that the compression could
 * plausibly have broken and the reason it did not.
 *
 * The zero-pyq_count "omit the PYQ sentence" case lives in
 * ProblemStatementBlock.zeroPyq.test.tsx — `vi.mock` calls are hoisted to
 * the top of their file by vitest, so a mocked `intent-slices.gen` module
 * can't share a file with tests that need the real generated data.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('shows the exam intent without any expanding — it is the lead, not a detail', () => {
    const slice = INTENT_SLICES['eigenvalues'];
    expect(slice).toBeDefined();
    render(<ProblemStatementBlock conceptId="eigenvalues" enabled />);
    // Visible immediately: the one actionable, non-wounding fact.
    expect(screen.getByText('What GATE actually asks')).toBeInTheDocument();
    expect(screen.getByText(slice.exam_intent)).toBeInTheDocument();
    // Off the first screen until asked for: the pain point.
    expect(screen.queryByText(slice.pain_point)).toBeNull();
  });

  it('renders the exam intent, pain point, PYQ count and intent framing line for a mapped concept', async () => {
    const user = userEvent.setup();
    const slice = INTENT_SLICES['eigenvalues'];
    expect(slice).toBeDefined(); // sanity: the fixture this test depends on actually exists
    render(<ProblemStatementBlock conceptId="eigenvalues" enabled />);
    await user.click(screen.getByTestId('dps-more-trigger'));
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

  it('renders the exam intent BEFORE the pain point — the actionable fact ahead of the wound', async () => {
    const user = userEvent.setup();
    const slice = INTENT_SLICES['eigenvalues'];
    expect(slice).toBeDefined();
    render(<ProblemStatementBlock conceptId="eigenvalues" enabled />);
    await user.click(screen.getByTestId('dps-more-trigger'));

    const block = screen.getByTestId('problem-statement-block');
    const order = Array.from(block.querySelectorAll('p')).map((p) => p.textContent);
    expect(order.indexOf(slice.exam_intent)).toBeGreaterThanOrEqual(0);
    expect(order.indexOf(slice.exam_intent)).toBeLessThan(order.indexOf(slice.pain_point));
  });

  it('renders the framing line as plain text when no onSeeWhatsNext is given (backward compatible)', async () => {
    const user = userEvent.setup();
    render(<ProblemStatementBlock conceptId="eigenvalues" enabled />);
    await user.click(screen.getByTestId('dps-more-trigger'));
    expect(screen.queryByTestId('dps-see-whats-next')).toBeNull();
    expect(
      screen.getByText("Most students come here to practise real questions — that's how this page opens."),
    ).toBeInTheDocument();
  });

  it('turns the framing line into a real affordance that hands off to the rail when onSeeWhatsNext is given', async () => {
    // Bug (/investigate, 2026-09-01): "that's how this page opens" was a
    // description with nothing behind it — no link, no scroll, no action.
    // The line must be an actual tappable CTA wired to the caller's handler.
    const user = userEvent.setup();
    const onSeeWhatsNext = vi.fn();
    render(<ProblemStatementBlock conceptId="eigenvalues" enabled onSeeWhatsNext={onSeeWhatsNext} />);
    await user.click(screen.getByTestId('dps-more-trigger'));
    const cta = screen.getByTestId('dps-see-whats-next');
    expect(cta.tagName).toBe('BUTTON');
    expect(cta).toHaveTextContent("Most students come here to practise real questions — that's how this page opens.");
    await user.click(cta);
    expect(onSeeWhatsNext).toHaveBeenCalledTimes(1);
  });

  it('labels the pain point as common slips, not as marks dying', async () => {
    // The loss frame is what the tone pass removed; an eyebrow is the easiest
    // place for it to come back, because it reads as a heading rather than copy.
    const user = userEvent.setup();
    render(<ProblemStatementBlock conceptId="eigenvalues" enabled />);
    await user.click(screen.getByTestId('dps-more-trigger'));
    expect(screen.getByText('Common slips on this topic')).toBeInTheDocument();
    expect(screen.getByText('What GATE actually asks')).toBeInTheDocument();
    expect(screen.queryByText(/marks die/i)).toBeNull();
  });
});
