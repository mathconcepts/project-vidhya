/**
 * TimerPrimitive — T14/T22 (DR-3) coverage: light vs exam register, the
 * orange low-time transition (light only — exam stays red, never orange),
 * mono tabular digits, and the aria-live announcement firing ONLY at a
 * register-state transition (never every render/tick).
 *
 * The component owns no interval itself — the caller ticks
 * `remainingSeconds` on its own clock — so transitions are exercised via
 * `rerender` with a new prop value, exactly how a real caller would drive it.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TimerPrimitive } from './TimerPrimitive';

function liveRegionText(container: HTMLElement): string {
  return container.querySelector('[aria-live="polite"]')!.textContent ?? '';
}

describe('TimerPrimitive', () => {
  it('renders mono tabular digits formatted as MM:SS', () => {
    const { container, getByText } = render(
      <TimerPrimitive totalSeconds={600} remainingSeconds={125} register="light" />,
    );
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.style.fontFamily).toBe('var(--font-mono)');
    expect(chip.style.fontVariantNumeric).toBe('tabular-nums');
    expect(getByText('02:05')).toBeInTheDocument();
  });

  it('light register swaps to the orange tint/ink pair below 20% remaining, never red', () => {
    const { container, rerender } = render(
      <TimerPrimitive totalSeconds={600} remainingSeconds={200} register="light" />, // 33% — normal
    );
    let chip = container.firstElementChild as HTMLElement;
    expect(chip.style.background).toBe('var(--surface-fill)');

    rerender(<TimerPrimitive totalSeconds={600} remainingSeconds={100} register="light" />); // 16.6% — low
    chip = container.firstElementChild as HTMLElement;
    expect(chip.style.background).toBe('var(--orange-tint)');
    expect(chip.style.color).toBe('var(--orange-ink)');
    expect(chip.style.background).not.toContain('255,59,48'); // never the exam red
  });

  it('exam register stays grey above the 600s threshold and turns red below it', () => {
    const { container, rerender } = render(
      <TimerPrimitive totalSeconds={3600} remainingSeconds={700} register="exam" />,
    );
    let chip = container.firstElementChild as HTMLElement;
    expect(chip.style.background).toBe('var(--surface-fill)');

    rerender(<TimerPrimitive totalSeconds={3600} remainingSeconds={500} register="exam" />);
    chip = container.firstElementChild as HTMLElement;
    expect(chip.style.background).toBe('rgba(255, 59, 48, 0.1)');
    expect(chip.style.color).toBe('var(--red)');
  });

  it('announces the register transition exactly once with register-specific wording, not on every subsequent low tick', () => {
    const { container, rerender } = render(
      <TimerPrimitive totalSeconds={600} remainingSeconds={200} register="light" />,
    );
    expect(liveRegionText(container)).toBe('');

    rerender(<TimerPrimitive totalSeconds={600} remainingSeconds={100} register="light" />); // crosses into low
    expect(liveRegionText(container)).toBe('Under 20% of the time remaining.');

    rerender(<TimerPrimitive totalSeconds={600} remainingSeconds={99} register="light" />); // still low — no re-announce needed, but text persists
    rerender(<TimerPrimitive totalSeconds={600} remainingSeconds={98} register="light" />);
    expect(liveRegionText(container)).toBe('Under 20% of the time remaining.');

    const exam = render(<TimerPrimitive totalSeconds={3600} remainingSeconds={700} register="exam" />);
    exam.rerender(<TimerPrimitive totalSeconds={3600} remainingSeconds={500} register="exam" />);
    expect(liveRegionText(exam.container)).toBe('Less than 10 minutes remaining.');
  });
});
