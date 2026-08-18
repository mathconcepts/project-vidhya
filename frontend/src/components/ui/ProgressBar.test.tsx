/**
 * ProgressBar — T24 extension coverage. The fill transition must route
 * through the design system's single sanctioned curve (`--ease-standard`,
 * never `--ease-out`), and the primitive must support the focused-work
 * strip's register: a 3px track, green fill, and mono tabular-figures
 * trailing value — so FocusedWorkStrip's hand-rolled markup can retire in
 * favor of this one component (no fifth progress bar).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

/** Structure is always outer(fontFamily wrapper) > [labelRow?] > track > fill. */
function fillEl(container: HTMLElement): HTMLElement {
  const outer = container.firstElementChild as HTMLElement;
  const track = outer.lastElementChild as HTMLElement;
  return track.firstElementChild as HTMLElement;
}
function trackEl(container: HTMLElement): HTMLElement {
  const outer = container.firstElementChild as HTMLElement;
  return outer.lastElementChild as HTMLElement;
}

describe('ProgressBar', () => {
  it('animates the fill through the single sanctioned ease curve', () => {
    const { container } = render(<ProgressBar value={50} />);
    const fill = fillEl(container);
    expect(fill.style.transition).toContain('var(--ease-standard)');
    expect(fill.style.transition).not.toContain('var(--ease-out)');
  });

  it('skips the transition when disableTransition is set', () => {
    const { container } = render(<ProgressBar value={50} disableTransition />);
    const fill = fillEl(container);
    expect(fill.style.transition).toBe('none');
  });

  it('supports the focused-work strip register: 3px track, mono trailing figures, supporting-size label', () => {
    const { container, getByText } = render(
      <ProgressBar
        value={64}
        tone="mastery"
        height={3}
        label="Focused work"
        trailing="64 / 100 min"
        labelRegister="supporting"
        monoTrailing
      />,
    );
    const track = trackEl(container);
    expect(track.style.height).toBe('3px');

    const labelRow = getByText('Focused work').parentElement as HTMLElement;
    expect(labelRow.style.fontSize).toBe('var(--text-subhead)');

    const trailingEl = getByText('64 / 100 min');
    expect(trailingEl.style.fontFamily).toBe('var(--font-mono)');
  });

  it('defaults to the metadata register (footnote) and no mono font when not requested', () => {
    const { getByText } = render(<ProgressBar value={30} label="Coverage" trailing="30%" />);
    const labelRow = getByText('Coverage').parentElement as HTMLElement;
    expect(labelRow.style.fontSize).toBe('var(--text-footnote)');
    expect(getByText('30%').style.fontFamily).toBe('');
  });
});
