/**
 * Tests for ReadinessDelta (/investigate, 2026-09-08 — "competency moving
 * to the right"): renders the before/after skill readiness, in green on
 * an improving delta and plain secondary text on a flat/declining one,
 * and renders nothing at all when there is no real delta to show.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadinessDelta } from './ReadinessDelta';

describe('ReadinessDelta', () => {
  it('renders the skill label and before/after percentages', () => {
    render(<ReadinessDelta delta={{ skill_id: 'eigenvalues', before_pct: 50, after_pct: 52 }} />);
    expect(screen.getByText('eigenvalues')).toBeInTheDocument();
    expect(screen.getByText(/50% → 52%/)).toBeInTheDocument();
  });

  it('replaces hyphens in a multi-word skill id with spaces, like the app\'s other skill-label rows', () => {
    render(<ReadinessDelta delta={{ skill_id: 'null-space-column-space', before_pct: 40, after_pct: 45 }} />);
    expect(screen.getByText('null space column space')).toBeInTheDocument();
  });

  it('renders in --green-ink with an up-trend icon on an improving delta', () => {
    const { container } = render(
      <ReadinessDelta delta={{ skill_id: 'trace', before_pct: 50, after_pct: 60 }} />,
    );
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p!.style.color).toBe('var(--green-ink)');
    // lucide's TrendingUp icon renders an <svg>.
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders in --text-secondary with no trend icon on a flat delta', () => {
    const { container } = render(
      <ReadinessDelta delta={{ skill_id: 'trace', before_pct: 50, after_pct: 50 }} />,
    );
    const p = container.querySelector('p');
    expect(p!.style.color).toBe('var(--text-secondary)');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders in --text-secondary with no trend icon on a declining delta — never red, never a scolding', () => {
    const { container } = render(
      <ReadinessDelta delta={{ skill_id: 'trace', before_pct: 60, after_pct: 55 }} />,
    );
    const p = container.querySelector('p');
    expect(p!.style.color).toBe('var(--text-secondary)');
    expect(p!.style.color).not.toBe('var(--red)');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders nothing when delta is null (DB-less deploy or dedup) — never fabricated', () => {
    const { container } = render(<ReadinessDelta delta={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when delta is undefined (an older response shape, or an untouched field)', () => {
    const { container } = render(<ReadinessDelta delta={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('carries aria-live="polite" so a screen reader announces the delta as it resolves', () => {
    render(<ReadinessDelta delta={{ skill_id: 'trace', before_pct: 50, after_pct: 60 }} />);
    const p = screen.getByText(/50% → 60%/).closest('p');
    expect(p).toHaveAttribute('aria-live', 'polite');
  });
});
