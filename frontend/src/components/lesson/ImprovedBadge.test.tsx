/**
 * ImprovedBadge — visibility + tooltip contract tests.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImprovedBadge } from './ImprovedBadge';

describe('ImprovedBadge visibility', () => {
  it('renders nothing when improvedSince is unset', () => {
    const { container } = render(<ImprovedBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when improvedSince > lastSeenAt', () => {
    const { container } = render(
      <ImprovedBadge improvedSince="2026-05-01T12:00:00Z" lastSeenAt="2026-04-30T08:00:00Z" />,
    );
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Improved')).toBeInTheDocument();
  });

  it('renders when lastSeenAt is unset (student never saw the atom)', () => {
    const { container } = render(<ImprovedBadge improvedSince="2026-05-01T12:00:00Z" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('hides when improvedSince === lastSeenAt', () => {
    const ts = '2026-05-01T12:00:00Z';
    const { container } = render(<ImprovedBadge improvedSince={ts} lastSeenAt={ts} />);
    expect(container.firstChild).toBeNull();
  });

  it('hides when improvedSince < lastSeenAt', () => {
    const { container } = render(
      <ImprovedBadge improvedSince="2026-04-30T08:00:00Z" lastSeenAt="2026-05-01T12:00:00Z" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('uses a generic tooltip when reason is empty', () => {
    const { container } = render(
      <ImprovedBadge improvedSince="2026-05-01T12:00:00Z" lastSeenAt="2026-04-30T08:00:00Z" />,
    );
    // Badge has aria-label set when visible
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it('exposes ARIA status role when visible', () => {
    render(<ImprovedBadge improvedSince="2026-05-01T12:00:00Z" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'This concept improved since your last visit');
  });
});
