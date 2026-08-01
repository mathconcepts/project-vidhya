/**
 * ReceiptBorder tests — the "receipt aesthetic" trust marker.
 *
 * Only one behavior actually matters here and it's the one the design
 * review flagged as easy to violate elsewhere: the bordered/✓ surface must
 * be strictly gated on `receipt.verified`, never on the mere presence of a
 * receipt prop or on the caller's intent. No receipt object (or
 * verified: false) → no border, by construction.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReceiptBorder } from './ReceiptBorder';

describe('ReceiptBorder', () => {
  it('renders no border/checkmark when receipt is null', () => {
    render(
      <ReceiptBorder receipt={null}>
        <span>Estimate</span>
      </ReceiptBorder>,
    );
    expect(screen.getByText('Estimate')).toBeInTheDocument();
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('renders no border/checkmark when receipt is undefined', () => {
    render(
      <ReceiptBorder receipt={undefined}>
        <span>Estimate</span>
      </ReceiptBorder>,
    );
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('renders no border/checkmark when receipt.verified is false', () => {
    render(
      <ReceiptBorder receipt={{ verified: false, source: 'not_actually_checked' }}>
        <span>Estimate</span>
      </ReceiptBorder>,
    );
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('renders the border + checkmark only when receipt.verified is true', () => {
    render(
      <ReceiptBorder receipt={{ verified: true, source: 'cas_verifier' }}>
        <span>Verified answer</span>
      </ReceiptBorder>,
    );
    expect(screen.getByText('Verified answer')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('reads border color from the DESIGN-SYSTEM CSS custom properties, not a hardcoded class', () => {
    const { container } = render(
      <ReceiptBorder receipt={{ verified: true }}>
        <span>Verified answer</span>
      </ReceiptBorder>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    // Regression guard for the design-review finding: hardcoded emerald
    // Tailwind classes silently drift from DESIGN-SYSTEM.md's token if
    // that token is ever re-themed. Asserting the inline style references
    // the CSS var (rather than a literal color) keeps the two in sync.
    expect(wrapper.getAttribute('style')).toContain('--receipt-line');
  });
});
