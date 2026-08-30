/**
 * Simulation.test.tsx — narration/animation sync (bug #1, live QA:
 * "hook and animation needs to be in sync with each other - like an
 * explanation") plus the "resonance beats" extension (plan §W1,
 * 2026-08-30): per-stance beat text, an emphasize signal, a single trap
 * beat with a hold + persistent trap row, a ghost path revealed with the
 * trap, a segmented seekable beat bar, and a reduced-motion storyboard.
 *
 * RAF is mocked to a frozen no-op throughout this file (never invokes its
 * callback) so every test is a deterministic function of the state set at
 * render/interaction time — no fake timers, no flakiness, matching the
 * eng-review instruction to keep hold/beat-selection logic testable
 * without a clock. Interaction happens through `seekTo` (direct state
 * writes) and clicks, never by letting the tick loop actually run.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  Simulation,
  activeNarrationStep,
  activeBeatIndex,
  resolveBeatText,
  shouldHoldForTrap,
  beatSegmentFill,
  stripMarkdownForAria,
} from './Simulation';
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

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: reducedMotion,
      media: q,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

let rafId = 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rafSpy: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cancelSpy: any;

beforeEach(() => {
  mockMatchMedia(false);
  rafId = 0;
  // Frozen: returns an incrementing id but NEVER invokes the callback, so
  // `progress` never advances on its own — every test asserts a pure
  // function of the state produced by render + explicit interaction.
  rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {
    rafId += 1;
    return rafId;
  });
  cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
});

afterEach(() => {
  rafSpy.mockRestore();
  cancelSpy.mockRestore();
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

// ============================================================================
// Pure helpers (unit, no rendering, no timers)
// ============================================================================

describe('activeBeatIndex', () => {
  it('returns the index of the last beat whose at_progress <= progress', () => {
    const sorted: SimulationSpec['narration_steps'] = [
      { at_progress: 0, text: 'a' },
      { at_progress: 0.5, text: 'b' },
      { at_progress: 0.9, text: 'c' },
    ];
    expect(activeBeatIndex(sorted, 0)).toBe(0);
    expect(activeBeatIndex(sorted, 0.6)).toBe(1);
    expect(activeBeatIndex(sorted, 1)).toBe(2);
  });

  it('returns null for an empty/undefined list', () => {
    expect(activeBeatIndex(undefined, 0.5)).toBeNull();
    expect(activeBeatIndex([], 0.5)).toBeNull();
  });

  it('distinguishes beats with IDENTICAL text by index, not content', () => {
    // The whole point of keying AnimatePresence by index rather than text
    // (plan §W1 / eng review E2): two beats sharing a resolved string must
    // still resolve to two different positions.
    const sorted: SimulationSpec['narration_steps'] = [
      { at_progress: 0, text: 'Watch closely.' },
      { at_progress: 0.5, text: 'Watch closely.' },
    ];
    expect(activeBeatIndex(sorted, 0.1)).toBe(0);
    expect(activeBeatIndex(sorted, 0.6)).toBe(1);
    expect(activeBeatIndex(sorted, 0.1)).not.toBe(activeBeatIndex(sorted, 0.6));
  });
});

describe('resolveBeatText', () => {
  const step: NonNullable<SimulationSpec['narration_steps']>[number] = {
    at_progress: 0,
    text: 'Base sentence.',
    text_shaken: 'Shaken sentence.',
    text_assured: 'Assured sentence.',
  };

  it('returns base text when no stance is served', () => {
    expect(resolveBeatText(step, undefined)).toBe('Base sentence.');
  });

  it('returns the shaken override when servedStance is shaken', () => {
    expect(resolveBeatText(step, 'shaken')).toBe('Shaken sentence.');
  });

  it('returns the assured override when servedStance is assured', () => {
    expect(resolveBeatText(step, 'assured')).toBe('Assured sentence.');
  });

  it('falls back to base text when the matching override is missing', () => {
    const baseOnly = { at_progress: 0, text: 'Only base.' };
    expect(resolveBeatText(baseOnly, 'shaken')).toBe('Only base.');
    expect(resolveBeatText(baseOnly, 'assured')).toBe('Only base.');
  });
});

describe('shouldHoldForTrap', () => {
  const common = { trapAtProgress: 0.45, reducedMotion: false, alreadyHeld: false };

  it('holds when natural playback crosses the trap point', () => {
    expect(shouldHoldForTrap({ ...common, prevProgress: 0.44, nextProgress: 0.46, isSeek: false })).toBe(true);
  });

  it('does not hold when progress stays within the same beat (no crossing)', () => {
    expect(shouldHoldForTrap({ ...common, prevProgress: 0.1, nextProgress: 0.2, isSeek: false })).toBe(false);
  });

  it('does not hold on a seek, even landing exactly on the trap at_progress (boundary case)', () => {
    expect(shouldHoldForTrap({ ...common, prevProgress: 0.44, nextProgress: 0.45, isSeek: true })).toBe(false);
  });

  it('does not hold under reduced motion', () => {
    expect(shouldHoldForTrap({ ...common, prevProgress: 0.44, nextProgress: 0.46, isSeek: false, reducedMotion: true })).toBe(false);
  });

  it('does not hold a second time in the same mount', () => {
    expect(shouldHoldForTrap({ ...common, prevProgress: 0.44, nextProgress: 0.46, isSeek: false, alreadyHeld: true })).toBe(false);
  });

  it('does not hold when there is no trap beat', () => {
    expect(shouldHoldForTrap({ ...common, trapAtProgress: null, prevProgress: 0.44, nextProgress: 0.46, isSeek: false })).toBe(false);
  });

  it('boundary: a natural tick landing exactly ON the trap point counts as crossing it', () => {
    expect(shouldHoldForTrap({ ...common, prevProgress: 0.4, nextProgress: 0.45, isSeek: false })).toBe(true);
  });
});

describe('beatSegmentFill', () => {
  const sorted: SimulationSpec['narration_steps'] = [
    { at_progress: 0, text: 'a' },
    { at_progress: 0.5, text: 'b' },
  ];

  it('is 0 before the segment starts', () => {
    expect(beatSegmentFill(sorted, 0.5, 1)).toBe(0);
  });

  it('is 1 once progress passes the segment', () => {
    expect(beatSegmentFill(sorted, 1, 0)).toBe(1);
  });

  it('is proportional while the segment is active', () => {
    expect(beatSegmentFill(sorted, 0.25, 0)).toBeCloseTo(0.5);
  });

  it('clamps to [0,1]', () => {
    expect(beatSegmentFill(sorted, -1, 0)).toBe(0);
    expect(beatSegmentFill(sorted, 2, 1)).toBe(1);
  });
});

describe('stripMarkdownForAria', () => {
  it('strips bold, italics, inline math and code', () => {
    expect(stripMarkdownForAria('Watch $x$ **stretch** by *3* using `A`')).toBe('Watch x stretch by 3 using A');
  });

  it('leaves plain text untouched', () => {
    expect(stripMarkdownForAria('No markup here.')).toBe('No markup here.');
  });
});

// ============================================================================
// Component — no beats (unchanged behavior)
// ============================================================================

describe('Simulation — no beats', () => {
  it('starts paused with progress at the end (finished static trace) and shows the title as a heading', () => {
    render(<Simulation spec={BASE_SPEC} />);
    expect(screen.getByText('Watch the trace')).toBeInTheDocument();
    expect(screen.getByLabelText('Play simulation')).toBeInTheDocument();
    expect(screen.queryByLabelText('Pause simulation')).toBeNull();
  });

  it('falls back to the static caption when narration_steps is absent', () => {
    render(<Simulation spec={{ ...BASE_SPEC, caption: 'A static caption.' }} />);
    expect(screen.getByText('A static caption.')).toBeInTheDocument();
  });

  it('renders no caption/narration row when neither is present', () => {
    render(<Simulation spec={BASE_SPEC} />);
    expect(screen.queryByText(/./, { selector: 'p' })).toBeNull();
  });

  it('never shows the segmented beat bar when there are no beats', () => {
    render(<Simulation spec={BASE_SPEC} />);
    expect(screen.queryByRole('group', { name: 'Scene beats' })).toBeNull();
  });
});

// ============================================================================
// Component — resonance beats
// ============================================================================

const BEAT_SPEC: SimulationSpec = {
  ...BASE_SPEC,
  narration_steps: [
    { at_progress: 0, text: 'First beat.' },
    { at_progress: 0.5, text: 'Second beat.', emphasize: true },
    {
      at_progress: 0.8,
      text: 'Third beat.',
      trap: { text: 'Students read the 2 as scaling both axes.', avoid: 'Match each entry to its own axis.' },
    },
  ],
  ghost: { x_expr: '2*cos(t)', y_expr: '2*sin(t)' },
};

describe('Simulation — autoplay (design contract item 1)', () => {
  it('a scene WITH beats autoplays once on mount: playing, progress at 0, first beat showing', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    expect(screen.getByLabelText('Pause simulation')).toBeInTheDocument();
    expect(screen.queryByLabelText('Play simulation')).toBeNull();
    expect(screen.getByText('First beat.')).toBeInTheDocument();
    expect(screen.queryByText('Third beat.')).toBeNull();
  });

  it('a scene WITHOUT beats keeps the tap-to-play default (paused, finished trace)', () => {
    render(<Simulation spec={BASE_SPEC} />);
    expect(screen.getByLabelText('Play simulation')).toBeInTheDocument();
  });

  it('never autoplays under reduced motion, even with beats', () => {
    mockMatchMedia(true);
    render(<Simulation spec={BEAT_SPEC} />);
    expect(screen.queryByLabelText('Pause simulation')).toBeNull();
    expect(screen.queryByLabelText('Play simulation')).toBeNull(); // controls hidden in the storyboard entirely
  });
});

describe('Simulation — chrome hierarchy (design contract item 3)', () => {
  it('does not render spec.title as a visible heading when beats exist; it becomes the SVG aria-label instead', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    expect(screen.queryByText('Watch the trace')).toBeNull();
    expect(screen.getByLabelText('Watch the trace')).toBeInTheDocument(); // the <svg>
  });
});

describe('Simulation — beat caption + stance', () => {
  it('renders the active beat through the markdown pipeline (math/bold survive)', () => {
    const spec: SimulationSpec = {
      ...BASE_SPEC,
      narration_steps: [{ at_progress: 0, text: 'Watch $x$ **stretch**.' }],
    };
    render(<Simulation spec={spec} />);
    const caption = screen.getByText(/stretch/);
    expect(caption.closest('.vidhya-atom-body')).not.toBeNull();
    // KaTeX renders $x$ into its own markup rather than literal text.
    expect(screen.queryByText('$x$')).toBeNull();
  });

  it('per-stance text: shaken override wins when servedStance="shaken"', () => {
    const spec: SimulationSpec = {
      ...BASE_SPEC,
      narration_steps: [{ at_progress: 0, text: 'Base.', text_shaken: 'Shaken version.' }],
    };
    render(<Simulation spec={spec} servedStance="shaken" />);
    expect(screen.getByText('Shaken version.')).toBeInTheDocument();
    expect(screen.queryByText('Base.')).toBeNull();
  });

  it('falls back to base text when servedStance has no override for this beat', () => {
    const spec: SimulationSpec = {
      ...BASE_SPEC,
      narration_steps: [{ at_progress: 0, text: 'Base only.' }],
    };
    render(<Simulation spec={spec} servedStance="assured" />);
    expect(screen.getByText('Base only.')).toBeInTheDocument();
  });
});

describe('Simulation — seek (design contract item 10)', () => {
  it('seeking via the beat bar while playing keeps playing', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    expect(screen.getByLabelText('Pause simulation')).toBeInTheDocument(); // autoplay: playing
    const group = screen.getByRole('group', { name: 'Scene beats' });
    const thirdBeat = within(group).getByLabelText(/^Beat 3 of 3/);
    fireEvent.click(thirdBeat);
    expect(screen.getByText('Third beat.')).toBeInTheDocument();
    expect(screen.getByLabelText('Pause simulation')).toBeInTheDocument(); // still playing
  });

  it('seeking via the beat bar while paused stays paused', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    fireEvent.click(screen.getByLabelText('Pause simulation')); // pause first
    expect(screen.getByLabelText('Play simulation')).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Scene beats' });
    fireEvent.click(within(group).getByLabelText(/^Beat 2 of 3/));
    expect(screen.getByText('Second beat.')).toBeInTheDocument();
    expect(screen.getByLabelText('Play simulation')).toBeInTheDocument(); // still paused
  });

  it('ArrowRight/ArrowLeft on a beat segment steps to the neighboring beat', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    const group = screen.getByRole('group', { name: 'Scene beats' });
    const first = within(group).getByLabelText(/^Beat 1 of 3/);
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByText('Second beat.')).toBeInTheDocument();
  });
});

describe('Simulation — emphasize (design contract item 5)', () => {
  it('renders a heavier stroke only for the active emphasized beat, reverting once it passes', () => {
    const spec: SimulationSpec = {
      ...BASE_SPEC,
      narration_steps: [
        { at_progress: 0, text: 'Calm.' },
        { at_progress: 0.5, text: 'Emphasized.', emphasize: true },
        { at_progress: 0.9, text: 'Calm again.' },
      ],
    };
    const { container } = render(<Simulation spec={spec} />);
    // Autoplay starts at beat 0 (not emphasized) — no heavy stroke yet.
    expect(container.querySelector('path[stroke-width="3.5"]')).toBeNull();

    const group = screen.getByRole('group', { name: 'Scene beats' });
    fireEvent.click(within(group).getByLabelText(/^Beat 2 of 3/));
    expect(container.querySelector('path[stroke-width="3.5"]')).not.toBeNull();

    fireEvent.click(within(group).getByLabelText(/^Beat 3 of 3/));
    expect(container.querySelector('path[stroke-width="3.5"]')).toBeNull(); // reverted
  });
});

describe('Simulation — trap row + ghost (design contract items 6, 7, 8)', () => {
  it('trap row is absent before the trap beat is reached', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    expect(screen.queryByText('Where marks are lost')).toBeNull();
  });

  it('trap row appears once the trap beat is reached via seek, and persists after seeking away', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    const group = screen.getByRole('group', { name: 'Scene beats' });
    fireEvent.click(within(group).getByLabelText(/^Beat 3 of 3/));
    expect(screen.getByText('Where marks are lost')).toBeInTheDocument();
    expect(screen.getByText('Students read the 2 as scaling both axes.')).toBeInTheDocument();
    expect(screen.getByText('Avoid: Match each entry to its own axis.')).toBeInTheDocument();

    // Seek back to the first beat — the row must NOT disappear.
    fireEvent.click(within(group).getByLabelText(/^Beat 1 of 3/));
    expect(screen.getByText('Where marks are lost')).toBeInTheDocument();
  });

  it('reset clears the persisted trap row', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    const group = screen.getByRole('group', { name: 'Scene beats' });
    fireEvent.click(within(group).getByLabelText(/^Beat 3 of 3/));
    expect(screen.getByText('Where marks are lost')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Reset simulation'));
    expect(screen.queryByText('Where marks are lost')).toBeNull();
  });

  it('ghost path is absent from the SVG before the trap is reached, present after', () => {
    const { container } = render(<Simulation spec={BEAT_SPEC} />);
    expect(container.querySelector('path[stroke-dasharray]')).toBeNull();
    const group = screen.getByRole('group', { name: 'Scene beats' });
    fireEvent.click(within(group).getByLabelText(/^Beat 3 of 3/));
    expect(container.querySelector('path[stroke-dasharray]')).not.toBeNull();
  });

  it('omits the ghost (without failing the scene) when a ghost expr produces a non-finite sample', () => {
    const spec: SimulationSpec = {
      ...BEAT_SPEC,
      ghost: { x_expr: 'sqrt(-1*t - 1)', y_expr: 't' }, // sqrt of a negative → NaN, no throw
    };
    const { container } = render(<Simulation spec={spec} />);
    const group = screen.getByRole('group', { name: 'Scene beats' });
    fireEvent.click(within(group).getByLabelText(/^Beat 3 of 3/));
    expect(screen.getByText('Where marks are lost')).toBeInTheDocument(); // scene keeps working
    expect(container.querySelector('path[stroke-dasharray]')).toBeNull(); // ghost just isn't drawn
  });
});

describe('Simulation — beat bar visibility (design contract item 9)', () => {
  it('renders only when there is more than one beat', () => {
    const oneBeat: SimulationSpec = { ...BASE_SPEC, narration_steps: [{ at_progress: 0, text: 'Only one.' }] };
    render(<Simulation spec={oneBeat} />);
    expect(screen.queryByRole('group', { name: 'Scene beats' })).toBeNull();
    // Controls still render even with no bar.
    expect(screen.getByLabelText('Pause simulation')).toBeInTheDocument();
  });

  it('renders with more than one beat', () => {
    render(<Simulation spec={BEAT_SPEC} />);
    expect(screen.getByRole('group', { name: 'Scene beats' })).toBeInTheDocument();
  });

  it('segment aria-labels name the beat position and strip markdown from the text', () => {
    const spec: SimulationSpec = {
      ...BASE_SPEC,
      narration_steps: [
        { at_progress: 0, text: 'Watch **carefully**.' },
        { at_progress: 0.5, text: 'Second.' },
      ],
    };
    render(<Simulation spec={spec} />);
    expect(screen.getByLabelText('Beat 1 of 2: Watch carefully.')).toBeInTheDocument();
  });
});

describe('Simulation — reduced-motion storyboard (design contract item 11)', () => {
  it('lists every beat as static text, keeps the trap row inline, and names the ghost once', () => {
    mockMatchMedia(true);
    render(<Simulation spec={BEAT_SPEC} />);
    expect(screen.getByText('First beat.')).toBeInTheDocument();
    expect(screen.getByText('Second beat.')).toBeInTheDocument();
    expect(screen.getByText('Third beat.')).toBeInTheDocument();
    expect(screen.getByText('Where marks are lost')).toBeInTheDocument();
    expect(screen.getByText('The dashed grey path is the common wrong turn.')).toBeInTheDocument();
    expect(screen.getByText('Beat 1 of 3')).toBeInTheDocument();
  });

  it('omits the closing ghost line when the scene has no ghost', () => {
    mockMatchMedia(true);
    const { ghost, ...noGhost } = BEAT_SPEC;
    render(<Simulation spec={noGhost} />);
    expect(screen.queryByText('The dashed grey path is the common wrong turn.')).toBeNull();
  });
});

describe('Simulation — rAF cleanup on unmount', () => {
  it('cancels the animation frame when unmounted while playing', () => {
    const { unmount } = render(<Simulation spec={BEAT_SPEC} />); // autoplay => playing, rAF scheduled
    expect(rafSpy).toHaveBeenCalled();
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('never leaves an active loop for a spec without beats (nothing scheduled at mount)', () => {
    const callsBeforeMount = rafSpy.mock.calls.length;
    const { unmount } = render(<Simulation spec={BASE_SPEC} />); // paused by default
    expect(rafSpy.mock.calls.length).toBe(callsBeforeMount);
    unmount();
  });
});
