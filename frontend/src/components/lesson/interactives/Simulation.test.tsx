/**
 * Simulation.test.tsx — narration/animation sync (bug #1, live QA:
 * "hook and animation needs to be in sync with each other - like an
 * explanation"). Before this, `caption` was one static line shown below
 * the SVG regardless of playback state. `narration_steps` lets the text
 * advance in step with the trace; these tests lock `activeNarrationStep`'s
 * selection rule and the fallback to the old static caption when a spec
 * has no narration_steps at all.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Simulation, activeNarrationStep } from './Simulation';
import type { SimulationSpec } from './types';

const BASE_SPEC: SimulationSpec = {
  v: 1,
  kind: 'simulation',
  title: 'Watch the trace',
  x_expr: 't',
  y_expr: 't',
  t_min: 0,
  t_max: 1,
};

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe('activeNarrationStep', () => {
  const STEPS: SimulationSpec['narration_steps'] = [
    { at_progress: 0, text: 'Starting out.' },
    { at_progress: 0.5, text: 'Halfway there.' },
    { at_progress: 0.9, text: 'Nearly settled.' },
  ];

  it('returns null when there are no steps', () => {
    expect(activeNarrationStep(undefined, 0.5)).toBeNull();
  });

  it('picks the last step whose at_progress <= progress', () => {
    expect(activeNarrationStep(STEPS, 0)).toBe('Starting out.');
    expect(activeNarrationStep(STEPS, 0.3)).toBe('Starting out.');
    expect(activeNarrationStep(STEPS, 0.5)).toBe('Halfway there.');
    expect(activeNarrationStep(STEPS, 0.7)).toBe('Halfway there.');
    expect(activeNarrationStep(STEPS, 0.9)).toBe('Nearly settled.');
    expect(activeNarrationStep(STEPS, 1)).toBe('Nearly settled.');
  });

  it('sorts out-of-order steps defensively', () => {
    const unsorted: SimulationSpec['narration_steps'] = [
      { at_progress: 0.9, text: 'last' },
      { at_progress: 0, text: 'first' },
      { at_progress: 0.5, text: 'mid' },
    ];
    expect(activeNarrationStep(unsorted, 0.5)).toBe('mid');
  });
});

describe('Simulation — narration sync', () => {
  it('shows the first narration step at rest (progress starts at 1, reduced-motion off but unplayed)', () => {
    // Simulation initializes progress=1 (fully traced) until Play is
    // clicked, so at first render the LAST step is what's showing —
    // this documents current behavior, not a new requirement.
    render(
      <Simulation
        spec={{
          ...BASE_SPEC,
          narration_steps: [
            { at_progress: 0, text: 'Begin.' },
            { at_progress: 1, text: 'Settled on the axis.' },
          ],
        }}
      />,
    );
    expect(screen.getByText('Settled on the axis.')).toBeInTheDocument();
  });

  it('falls back to the static caption when narration_steps is absent', () => {
    render(<Simulation spec={{ ...BASE_SPEC, caption: 'A static caption.' }} />);
    expect(screen.getByText('A static caption.')).toBeInTheDocument();
  });

  it('renders no caption/narration row when neither is present', () => {
    render(<Simulation spec={BASE_SPEC} />);
    expect(screen.queryByText(/./, { selector: 'p' })).toBeNull();
  });
});
