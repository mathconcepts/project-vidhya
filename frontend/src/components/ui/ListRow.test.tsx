/**
 * ListRow — T24 floor fix coverage. The primitive's title previously used
 * var(--text-callout) (16px), a single px under the student-reading floor
 * (17px, DESIGN-SYSTEM.md / CLAUDE.md). Title must clear the body floor and
 * the row must clear the 44px touch target so the frontier spine + knowledge
 * home rows can adopt it.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ListRow } from './ListRow';

describe('ListRow', () => {
  it('renders the title at the 17px body floor, not the former 16px callout size', () => {
    const { getByText } = render(<ListRow title="Determinants" />);
    expect(getByText('Determinants').style.fontSize).toBe('var(--text-body)');
  });

  it('renders the subtitle at the 15px supporting size, not 13px metadata', () => {
    const { getByText } = render(<ListRow title="Determinants" subtitle="after eigenvalues" />);
    expect(getByText('after eigenvalues').style.fontSize).toBe('var(--text-subhead)');
  });

  it('meets the 44px minimum touch target', () => {
    const { container } = render(<ListRow title="Determinants" onClick={() => {}} />);
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.minHeight).toBe('var(--touch-min)');
  });

  it('supports a flush canvas-row padding override for bare-canvas hairline rows', () => {
    const { container } = render(<ListRow title="Determinants" padding="0 2px" />);
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.padding).toBe('0px 2px');
  });

  it('dims the title when muted, without changing the size', () => {
    const { getByText } = render(<ListRow title="Diagonalization" muted />);
    const title = getByText('Diagonalization');
    expect(title.style.color).toBe('var(--text-secondary)');
    expect(title.style.fontSize).toBe('var(--text-body)');
  });

  it('carries a distinct accessible name when provided', () => {
    const { container } = render(
      <ListRow title="Diagonalization" onClick={() => {}} ariaLabel="Diagonalization, after eigenvalues" />,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row).toHaveAttribute('aria-label', 'Diagonalization, after eigenvalues');
  });
});
