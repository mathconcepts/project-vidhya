/**
 * ConceptMathViz — smoke tests + the "why" framing gap (live-QA finding,
 * 2026-09-03: "why linear map is there? not just explanation, even
 * exploration must be ELI5"). Full coverage of all 53 CONCEPT_VIZ entries
 * is out of scope here — this pins the dispatcher behavior and the one
 * entry (matrix-operations) audited so far.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConceptMathViz } from './ConceptMathViz';

describe('ConceptMathViz', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing for an unknown concept_id (no empty box)', () => {
    const { container } = render(<ConceptMathViz conceptId="not-a-real-concept" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the matrix-operations entry with its why-framing and an honest simplification note', () => {
    render(<ConceptMathViz conceptId="matrix-operations" />);
    expect(screen.getByText('The simplest possible matrix: just one number')).toBeInTheDocument();
    expect(screen.getByText(/A 2×2 matrix acts on the whole plane/)).toBeInTheDocument();
    expect(screen.getByText('Hide these tips')).toBeInTheDocument();
  });

  it('the Wolfram Alpha link is a real deep-link built from the entry\'s query', () => {
    render(<ConceptMathViz conceptId="matrix-operations" />);
    const link = screen.getByText('Explore deeper on Wolfram Alpha').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('wolframalpha.com'));
    expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent('matrix multiplication linear map')));
  });

  it('an entry with no why field renders with no framing line or hide-tips control', () => {
    render(<ConceptMathViz conceptId="limits" />);
    expect(screen.queryByText('Hide these tips')).not.toBeInTheDocument();
  });

  it('"Hide these tips" removes the why line and is shared with InteractiveSidecar\'s preference', async () => {
    const user = userEvent.setup();
    render(<ConceptMathViz conceptId="matrix-operations" />);
    await user.click(screen.getByText('Hide these tips'));
    expect(screen.queryByText(/A 2×2 matrix acts on the whole plane/)).not.toBeInTheDocument();
    expect(localStorage.getItem('vidhya.eli_framing')).toBe('0');
  });
});
