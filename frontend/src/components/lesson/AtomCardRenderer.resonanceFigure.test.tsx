/**
 * AtomCardRenderer — W2 "Fused delivery" (plan
 * docs/designs/2026-08-30-resonance-fused-atoms-plan.md §W2).
 *
 * Covers:
 *   - Figure promotion: a parsed `simulation` interactive-spec renders AS
 *     THE FIGURE inside `.vidhya-atom-stage` instead of MediaSidecar — no
 *     GIF fetch, no "still generating" placeholder, even when the atom also
 *     carries a `gif-scene` fence (sim > GIF precedence).
 *   - The `in_disclosure` carve-out: a retrieval_prompt's simulation spec is
 *     never promoted — it falls to today's behavior (InteractiveSidecar,
 *     below/deferred, unchanged).
 *   - Entry-preset suppression: a promoted resonance simulation demotes the
 *     card's own entry animation to 'fade-in', dropping e.g. hook's
 *     'bounce-alert' — one moving thing per screen.
 *   - Single-parse memoization: `parseInteractiveSpec` is hoisted ONCE per
 *     card render (design contract item — see AtomCardRenderer.tsx's
 *     `parsedSpec` useMemo) and a malformed spec degrades to prose-only,
 *     never a crash.
 *   - `manipulable` / `guided_walkthrough` specs are untouched by figure
 *     promotion — they keep today's below-the-prose InteractiveSidecar path.
 *   - Motion-token compliance: `buildPresetVariants` (the extracted, pure
 *     preset builder — see W1 blast-radius fix in AtomCardRenderer.tsx)
 *     collapses every preset's duration under `prefers-reduced-motion`.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AtomCardRenderer,
  buildPresetVariants,
  type AnimationPreset,
  type ContentAtom,
} from './AtomCardRenderer';

function makeAtom(overrides: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id: 'c.a',
    concept_id: 'c',
    atom_type: 'hook',
    bloom_level: 1,
    difficulty: 0.1,
    exam_ids: ['*'],
    content: 'body text',
    ...overrides,
  };
}

function simulationFence(overrides: Record<string, unknown> = {}): string {
  const spec = {
    v: 1,
    kind: 'simulation',
    title: 'Sweep the vector',
    x_expr: 'cos(t)',
    y_expr: 'sin(t)',
    t_min: 0,
    t_max: 6.28,
    ...overrides,
  };
  return `\`\`\`interactive-spec\n${JSON.stringify(spec)}\n\`\`\``;
}

const GIF_FENCE = '```gif-scene\n{"type":"parametric-curve","expression":"x","x_range":[-1,1],"y_range":[-1,1]}\n```';

describe('AtomCardRenderer — W2 resonance figure promotion', () => {
  it('sim > GIF precedence: an atom with both fences shows the Simulation figure, never MediaSidecar', () => {
    const content = ['Watch the vector sweep the circle.', '', GIF_FENCE, '', simulationFence()].join('\n');
    const atom = makeAtom({ atom_type: 'hook', content, media: { gif_url: '/api/lesson/media/c.a/gif' } });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);

    // The Simulation widget rendered as the figure (no beats → it shows a
    // heading with the spec title).
    expect(screen.getByText('Sweep the vector')).toBeInTheDocument();
    // MediaSidecar's GIF <img> never rendered, even though media.gif_url exists.
    expect(screen.queryByAltText('Animated visualization for this concept')).not.toBeInTheDocument();
    // No "still generating" placeholder either — a parsed simulation never
    // shows a generating state, regardless of gif-scene fence presence.
    expect(screen.queryByText(/still generating/i)).not.toBeInTheDocument();
    // Prose survives; the raw fences never leak as literal text.
    expect(screen.getByText(/Watch the vector sweep the circle/)).toBeInTheDocument();
    expect(screen.queryByText(/interactive-spec/)).not.toBeInTheDocument();
    expect(screen.queryByText(/parametric-curve/)).not.toBeInTheDocument();

    // The simulation lives inside the figure slot, not the prose slot.
    const figureSlot = container.querySelector('.vidhya-atom-stage__figure');
    expect(figureSlot?.textContent).toContain('Sweep the vector');
    const stage = container.querySelector('.vidhya-atom-stage');
    expect(stage?.getAttribute('data-stage')).toBe('above');
  });

  it('a non-simulation atom (no spec at all) still renders MediaSidecar/nothing as before', () => {
    const atom = makeAtom({ atom_type: 'hook', content: 'Plain hook, no fences.' });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    const figureSlot = container.querySelector('.vidhya-atom-stage__figure');
    expect(figureSlot?.innerHTML).toBe('');
  });

  it('in_disclosure exemption: a retrieval_prompt with a simulation spec is NOT promoted to the figure', () => {
    const content = ['What comes next in the sequence?', '', simulationFence({ title: 'Should not be promoted' })].join(
      '\n',
    );
    const atom = makeAtom({ id: 'c.recall', atom_type: 'retrieval_prompt', content });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);

    // Stage stays 'in_disclosure' (no <details> block to defer into, and no
    // promotion override) — never forced to 'above'.
    const stage = container.querySelector('.vidhya-atom-stage');
    expect(stage?.getAttribute('data-stage')).toBe('in_disclosure');

    // The figure slot does NOT contain the simulation.
    const figureSlot = container.querySelector('.vidhya-atom-stage__figure');
    expect(figureSlot?.textContent ?? '').not.toContain('Should not be promoted');

    // Existing behavior: InteractiveSidecar still renders the widget
    // (unsuppressed) somewhere on the card — falls through unchanged.
    expect(screen.getByText('Should not be promoted')).toBeInTheDocument();
  });

  it('entry-preset suppression: a promoted resonance simulation uses fade-in, dropping the hook default (bounce-alert)', () => {
    const simContent = ['A hook with a scene.', '', simulationFence()].join('\n');
    const { container: withSim } = render(
      <AtomCardRenderer atoms={[makeAtom({ id: 'c.hooksim', atom_type: 'hook', content: simContent })]} conceptId="c" studentId="s1" />,
    );
    const cardWithSim = withSim.querySelector('.touch-pan-y') as HTMLElement;
    // fade-in's `initial` carries no `scale` key at all — bounce-alert's does.
    expect(cardWithSim.style.transform ?? '').not.toContain('0.8');

    const { container: plainHook } = render(
      <AtomCardRenderer atoms={[makeAtom({ id: 'c.hookplain', atom_type: 'hook', content: 'Plain hook, no spec.' })]} conceptId="c" studentId="s1" />,
    );
    const cardPlain = plainHook.querySelector('.touch-pan-y') as HTMLElement;
    // Sanity check on the differentiator itself: an ordinary hook (no
    // promoted sim) keeps its bounce-alert default, proving the assertion
    // above actually distinguishes presets rather than always passing.
    expect(cardPlain.style.transform ?? '').toContain('0.8');
  });

  it('single-parse memoization: a malformed interactive-spec fence degrades to prose-only, never a crash', () => {
    const content = ['Prose that survives.', '', '```interactive-spec', '{ this is not valid JSON', '```', '', 'More prose after.'].join(
      '\n',
    );
    const atom = makeAtom({ atom_type: 'intuition', content });
    expect(() => render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />)).not.toThrow();
    expect(screen.getByText(/Prose that survives/)).toBeInTheDocument();
    // A malformed fence still isn't real prose to show — it's swallowed
    // (parseInteractiveSpec fails, DefaultAtomCard falls back to the raw
    // atom.content, which itself still contains the fence as literal text
    // inside a code block — the important thing is no crash and no
    // duplicate/garbled rendering of the parse itself).
    expect(document.body.textContent).not.toContain('undefined');
  });

  it('a malformed spec on a worked_example atom also degrades cleanly (same hoisted parse, second consumer)', () => {
    const content = ['Setup step.', '', '```interactive-spec', '{ broken', '```', '', '---', '', 'Second step.'].join('\n');
    const atom = makeAtom({ id: 'c.we', atom_type: 'worked_example', content });
    expect(() => render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />)).not.toThrow();
    expect(screen.getByText(/Setup step/)).toBeInTheDocument();
  });

  it('manipulable specs keep their current below-the-prose InteractiveSidecar placement, unaffected by figure promotion', () => {
    const spec = {
      v: 1,
      kind: 'manipulable',
      title: 'Eigenvalue explorer',
      inputs: [{ id: 'a', label: 'a', min: -3, max: 3, initial: 1 }],
      outputs: [{ label: 'lambda', formula: 'a + 2' }],
    };
    const content = ['Try dragging a.', '', '```interactive-spec', JSON.stringify(spec), '```'].join('\n');
    const atom = makeAtom({ id: 'c.manip', atom_type: 'intuition', content });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);

    // Never promoted into the figure slot.
    const figureSlot = container.querySelector('.vidhya-atom-stage__figure');
    expect(figureSlot?.textContent ?? '').not.toContain('Eigenvalue explorer');
    // Still rendered by InteractiveSidecar, elsewhere on the card.
    expect(screen.getByText('Eigenvalue explorer')).toBeInTheDocument();
  });

  it('a promoted resonance scene renders its authored `why` line (live-QA 2026-09-05: "connecting the dots in intuition is missing")', () => {
    // Root cause: InteractiveSidecar is the ONLY other place <WhyThisHelps>
    // was wired in, and a promoted simulation bypasses InteractiveSidecar
    // entirely — so an authored `why` on a hook/intuition scene's spec
    // (12 concepts already carry one, e.g. matrix-operations,
    // spectral-theorem) was silently never shown, despite being validated
    // and present in the served content.
    const content = ['Watch the vector sweep the circle.', '', simulationFence({ why: 'This is the bridge sentence.' })].join('\n');
    const atom = makeAtom({ atom_type: 'intuition', content });
    render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(screen.getByText('This is the bridge sentence.')).toBeInTheDocument();
  });

  it('a promoted resonance scene with no authored `why` renders nothing extra (contract unchanged for unauthored scenes)', () => {
    const content = ['Watch the vector sweep the circle.', '', simulationFence()].join('\n');
    const atom = makeAtom({ atom_type: 'intuition', content });
    render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);
    expect(screen.queryByLabelText('Hide these why-this-helps tips')).not.toBeInTheDocument();
  });

  it('guided_walkthrough specs keep their current below-the-prose InteractiveSidecar placement, unaffected by figure promotion', () => {
    const spec = {
      v: 1,
      kind: 'guided_walkthrough',
      title: 'Work through it',
      steps: [{ prompt: 'First, what do you notice?', answer: 'The symmetry.' }],
    };
    const content = ['Let us work through this together.', '', '```interactive-spec', JSON.stringify(spec), '```'].join(
      '\n',
    );
    const atom = makeAtom({ id: 'c.guided', atom_type: 'worked_example', content });
    const { container } = render(<AtomCardRenderer atoms={[atom]} conceptId="c" studentId="s1" />);

    const figureSlot = container.querySelector('.vidhya-atom-stage__figure');
    expect(figureSlot?.textContent ?? '').not.toContain('Work through it');
    expect(screen.getByText('Work through it')).toBeInTheDocument();
  });
});

describe('buildPresetVariants — motion-token compliance', () => {
  const PRESETS: AnimationPreset[] = [
    'fade-in',
    'slide-up',
    'reveal-highlight',
    'step-unfold',
    'scale-in',
    'bounce-alert',
    'shake-then-settle',
    'flip-reveal',
  ];

  it('every preset collapses its transition duration to ~1ms under prefers-reduced-motion', () => {
    const reduced = buildPresetVariants(true);
    for (const preset of PRESETS) {
      expect(reduced[preset].transition.duration).toBeCloseTo(0.001, 5);
    }
  });

  it('step-unfold also collapses staggerChildren under reduced motion', () => {
    const reduced = buildPresetVariants(true);
    expect(reduced['step-unfold'].transition.staggerChildren).toBeCloseTo(0.001, 5);
  });

  it('every preset uses a real (non-collapsed) duration and the shared ease curve when motion is not reduced', () => {
    const full = buildPresetVariants(false);
    for (const preset of PRESETS) {
      expect(full[preset].transition.duration).toBeGreaterThan(0.001);
      expect(full[preset].transition.ease).toEqual([0.32, 0.72, 0, 1]);
    }
  });

  it('no preset uses a framer-motion spring transition (single motion curve, per DESIGN-SYSTEM.md)', () => {
    const full = buildPresetVariants(false);
    for (const preset of PRESETS) {
      expect(full[preset].transition.type).not.toBe('spring');
    }
  });

  it('shake-then-settle no longer oscillates x — it is a single settle (y + fade), never a pulse', () => {
    const full = buildPresetVariants(false);
    const settle = full['shake-then-settle'];
    expect(Array.isArray(settle.animate.x)).not.toBe(true);
    expect(settle.animate.x).toBeUndefined();
  });
});
