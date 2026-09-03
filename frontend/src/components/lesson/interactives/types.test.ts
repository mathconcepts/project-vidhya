/**
 * Unit tests for the interactive-spec parser + safe formula evaluator.
 *
 * These pin the parser's tolerance (markdown fence handling, version
 * gate, kind validation) and the evaluator's safety (no Function(),
 * no eval, no global-name leakage) so future refactors can't quietly
 * widen the surface that authored content can touch.
 */

import { describe, it, expect } from 'vitest';
import {
  parseInteractiveSpec,
  stripAllInteractiveSpecFences,
  evalFormula,
  INTERACTIVE_SPEC_VERSION,
  MAX_SIMULATION_BEATS,
  MAX_BEAT_TEXT_CHARS,
  MAX_GHOST_EXPR_CHARS,
  MAX_WHY_CHARS,
  __testing,
} from './types';
import type { SimulationSpec } from './types';

describe('parseInteractiveSpec', () => {
  it('returns no-block reason on empty body', () => {
    const r = parseInteractiveSpec('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('empty body');
  });

  it('returns no-block reason when body has no fence', () => {
    const r = parseInteractiveSpec('# Eigenvalues\n\nLorem ipsum, no spec here.');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('no interactive-spec block');
  });

  it('parses a valid manipulable spec and strips the block from body', () => {
    const body = [
      '# Diagonal eigenvalue',
      '',
      'Drag a to see how the eigenvalue changes.',
      '',
      '```interactive-spec',
      JSON.stringify({
        v: INTERACTIVE_SPEC_VERSION,
        kind: 'manipulable',
        title: 'Eigenvalue of [[a,0],[0,2]]',
        inputs: [{ id: 'a', label: 'a', min: -3, max: 3, initial: 1 }],
        outputs: [{ label: 'λ_max', formula: 'max(a, 2)' }],
      }),
      '```',
      '',
      'After the spec.',
    ].join('\n');
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.spec.kind).toBe('manipulable');
      expect(r.body_without_spec).toContain('Drag a to see');
      expect(r.body_without_spec).toContain('After the spec');
      expect(r.body_without_spec).not.toContain('interactive-spec');
    }
  });

  it('strips a SECOND interactive-spec fence too, even though only the first parses into a widget', () => {
    // Regression (live QA, 2026-09-01): eigenvalues.intuition.shaken authored
    // a stray second ```interactive-spec``` fence. Only the first fence is
    // ever rendered as a widget (one widget slot per atom card), but before
    // this fix `body_without_spec` only stripped the FIRST fence — so the
    // second fence's raw JSON fell through to MarkdownAtomRenderer and
    // rendered as a literal code block instead of vanishing.
    const first = JSON.stringify({
      v: INTERACTIVE_SPEC_VERSION,
      kind: 'manipulable',
      title: 'First widget',
      inputs: [{ id: 'a', label: 'a', min: -3, max: 3, initial: 1 }],
      outputs: [{ label: 'y', formula: 'a' }],
    });
    const second = JSON.stringify({
      v: INTERACTIVE_SPEC_VERSION,
      kind: 'guided_walkthrough',
      title: 'Second widget',
      steps: [{ prompt: 'p', answer: 'a' }],
    });
    const body = [
      'Prose before.',
      '',
      '```interactive-spec',
      first,
      '```',
      '',
      '```interactive-spec',
      second,
      '```',
      '',
      'Prose after.',
    ].join('\n');
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.spec.kind).toBe('manipulable'); // first fence still wins the parse
      expect(r.body_without_spec).toContain('Prose before');
      expect(r.body_without_spec).toContain('Prose after');
      expect(r.body_without_spec).not.toContain('interactive-spec');
      expect(r.body_without_spec).not.toContain('Second widget');
    }
  });

  it('rejects a spec with a different version', () => {
    const body = '```interactive-spec\n{"v":99,"kind":"manipulable","title":"x","inputs":[{"id":"a","min":0,"max":1}],"outputs":[{"label":"y","formula":"a"}]}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('unsupported spec version');
  });

  it('rejects a spec with unknown kind', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"glow-stick","title":"x"}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('unknown interactive kind');
  });

  it('rejects manipulable with empty inputs[]', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"manipulable","title":"x","inputs":[],"outputs":[{"label":"y","formula":"1"}]}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('inputs[] required');
  });

  it('rejects simulation with t_max <= t_min', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"simulation","title":"x","x_expr":"t","y_expr":"t","t_min":1,"t_max":1}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('t_min/t_max invalid');
  });

  it('accepts simulation with valid narration_steps', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"simulation","title":"x","x_expr":"t","y_expr":"t","t_min":0,"t_max":1,"narration_steps":[{"at_progress":0,"text":"Starts here."},{"at_progress":0.6,"text":"Settles here."}]}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(true);
  });

  it('rejects simulation narration_steps with an out-of-range at_progress', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"simulation","title":"x","x_expr":"t","y_expr":"t","t_min":0,"t_max":1,"narration_steps":[{"at_progress":1.5,"text":"bad"}]}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('narration_steps[0] invalid');
  });

  it('rejects simulation narration_steps with empty text', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"simulation","title":"x","x_expr":"t","y_expr":"t","t_min":0,"t_max":1,"narration_steps":[{"at_progress":0,"text":""}]}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
  });

  it('rejects simulation narration_steps as an empty array', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"simulation","title":"x","x_expr":"t","y_expr":"t","t_min":0,"t_max":1,"narration_steps":[]}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('non-empty array');
  });

  // ==========================================================================
  // Resonance beats (plan §W1, 2026-08-30): narration_steps additions —
  // per-stance text, emphasize, a single trap beat, and a top-level ghost.
  // Every rule here is additive: a v1 spec written before this extension
  // (plain `{ at_progress, text }` entries, no ghost) must keep validating
  // unchanged — the last test in this section pins that.
  // ==========================================================================

  function simSpec(overrides: Partial<SimulationSpec> = {}): SimulationSpec {
    return {
      v: INTERACTIVE_SPEC_VERSION,
      kind: 'simulation',
      title: 'x',
      x_expr: 't',
      y_expr: 't',
      t_min: 0,
      t_max: 1,
      ...overrides,
    };
  }

  it('rejects more than MAX_SIMULATION_BEATS narration_steps', () => {
    const steps = Array.from({ length: MAX_SIMULATION_BEATS + 1 }, (_, i) => ({
      at_progress: i / (MAX_SIMULATION_BEATS + 1),
      text: `beat ${i}`,
    }));
    const r = __testing.validateSpec(simSpec({ narration_steps: steps }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain(`at most ${MAX_SIMULATION_BEATS} allowed`);
  });

  it('accepts exactly MAX_SIMULATION_BEATS narration_steps', () => {
    const steps = Array.from({ length: MAX_SIMULATION_BEATS }, (_, i) => ({
      at_progress: i / MAX_SIMULATION_BEATS,
      text: `beat ${i}`,
    }));
    const r = __testing.validateSpec(simSpec({ narration_steps: steps }));
    expect(r.ok).toBe(true);
  });

  it('rejects a second beat carrying trap — at most one is allowed', () => {
    const r = __testing.validateSpec(
      simSpec({
        narration_steps: [
          { at_progress: 0, text: 'a', trap: { text: 'x', avoid: 'y' } },
          { at_progress: 0.5, text: 'b', trap: { text: 'x2', avoid: 'y2' } },
        ],
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('more than one beat carries trap');
  });

  it('accepts exactly one trap beat, with non-empty text and avoid', () => {
    const r = __testing.validateSpec(
      simSpec({
        narration_steps: [
          { at_progress: 0, text: 'a' },
          { at_progress: 0.5, text: 'b', trap: { text: 'Students slip here.', avoid: 'Do this instead.' } },
        ],
      }),
    );
    expect(r.ok).toBe(true);
  });

  it('rejects a trap with an empty avoid line', () => {
    const r = __testing.validateSpec(
      simSpec({ narration_steps: [{ at_progress: 0, text: 'a', trap: { text: 'x', avoid: '   ' } }] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('trap.avoid');
  });

  it('rejects a non-object trap (string/array shapes an LLM could emit)', () => {
    for (const bad of ['careful here', ['x', 'y'], 42, null]) {
      const r = __testing.validateSpec(
        simSpec({ narration_steps: [{ at_progress: 0, text: 'a', trap: bad as never }] }),
      );
      expect(r.ok).toBe(false);
    }
  });

  it('rejects a non-object ghost (string/array shapes an LLM could emit)', () => {
    for (const bad of ['2*cos(t)', ['2*cos(t)', '2*sin(t)'], 7]) {
      const r = __testing.validateSpec(simSpec({ ghost: bad as never }));
      expect(r.ok).toBe(false);
    }
  });

  it('rejects a trap text over MAX_BEAT_TEXT_CHARS', () => {
    const r = __testing.validateSpec(
      simSpec({
        narration_steps: [{ at_progress: 0, text: 'a', trap: { text: 'x'.repeat(MAX_BEAT_TEXT_CHARS + 1), avoid: 'y' } }],
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('trap.text');
  });

  it('rejects a beat text over MAX_BEAT_TEXT_CHARS', () => {
    const r = __testing.validateSpec(simSpec({ narration_steps: [{ at_progress: 0, text: 'x'.repeat(MAX_BEAT_TEXT_CHARS + 1) }] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('.text exceeds');
  });

  it('rejects text_shaken/text_assured over MAX_BEAT_TEXT_CHARS or empty', () => {
    const tooLong = __testing.validateSpec(
      simSpec({ narration_steps: [{ at_progress: 0, text: 'a', text_shaken: 'x'.repeat(MAX_BEAT_TEXT_CHARS + 1) }] }),
    );
    expect(tooLong.ok).toBe(false);
    const empty = __testing.validateSpec(simSpec({ narration_steps: [{ at_progress: 0, text: 'a', text_assured: '' }] }));
    expect(empty.ok).toBe(false);
  });

  it('accepts per-stance overrides within the length cap', () => {
    const r = __testing.validateSpec(
      simSpec({
        narration_steps: [{ at_progress: 0, text: 'Base.', text_shaken: 'Concrete numbers first.', text_assured: 'The distinction that costs marks.' }],
      }),
    );
    expect(r.ok).toBe(true);
  });

  it('rejects a non-boolean emphasize', () => {
    const r = __testing.validateSpec(simSpec({ narration_steps: [{ at_progress: 0, text: 'a', emphasize: 'yes' as any }] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('emphasize must be a boolean');
  });

  it('accepts a ghost whose exprs compile through the safe evaluator', () => {
    const r = __testing.validateSpec(simSpec({ ghost: { x_expr: '2*cos(t)', y_expr: '2*sin(t)' } }));
    expect(r.ok).toBe(true);
  });

  it('rejects a ghost expr that fails to compile (unknown identifier)', () => {
    const r = __testing.validateSpec(simSpec({ ghost: { x_expr: 'banana(t)', y_expr: 't' } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('failed to compile');
  });

  it('rejects a ghost expr over MAX_GHOST_EXPR_CHARS', () => {
    const r = __testing.validateSpec(simSpec({ ghost: { x_expr: 't+'.repeat(MAX_GHOST_EXPR_CHARS), y_expr: 't' } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('simulation.ghost.x_expr');
  });

  it('rejects a ghost missing y_expr', () => {
    const r = __testing.validateSpec(simSpec({ ghost: { x_expr: 't' } as any }));
    expect(r.ok).toBe(false);
  });

  it('a v1 spec written before this extension (no stance/emphasize/trap/ghost) still validates unchanged', () => {
    const body =
      '```interactive-spec\n' +
      JSON.stringify(
        simSpec({
          narration_steps: [
            { at_progress: 0, text: 'Starts here.' },
            { at_progress: 0.6, text: 'Settles here.' },
          ],
        }),
      ) +
      '\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(true);
    if (r.ok && r.spec.kind === 'simulation') {
      expect(r.spec.narration_steps).toHaveLength(2);
      expect(r.spec.ghost).toBeUndefined();
    }
  });

  it('rejects guided_walkthrough with empty steps', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"guided_walkthrough","title":"x","steps":[]}\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('steps[] required');
  });

  it('rejects malformed JSON inside the fence', () => {
    const body = '```interactive-spec\n{"v":1,"kind":"manipulable","title":\n```';
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/JSON\.parse/);
  });
});

describe('stripAllInteractiveSpecFences', () => {
  // Regression (red-team finding, /ship 2026-09-01): parseInteractiveSpec's
  // own fence-stripping only ever ran on the SUCCESS path (inside the
  // `ok: true` return). A caller doing `parsed.ok ? parsed.body_without_spec
  // : atom.content` therefore fell back to the fully-unstripped raw body
  // whenever the FIRST fence failed to parse — leaking even a well-formed
  // SECOND fence to the student as raw JSON, the exact bug class this file
  // exists to prevent. Callers must use this function directly instead of
  // gating on parse success.

  it('strips a fence whose own JSON is malformed', () => {
    const body = ['Prose before.', '', '```interactive-spec', '{ this is not valid JSON', '```', '', 'Prose after.'].join('\n');
    const stripped = stripAllInteractiveSpecFences(body);
    expect(stripped).toContain('Prose before');
    expect(stripped).toContain('Prose after');
    expect(stripped).not.toContain('interactive-spec');
    expect(stripped).not.toContain('not valid JSON');
  });

  it('strips a well-formed SECOND fence even when the FIRST fence is malformed', () => {
    const validSecond = JSON.stringify({
      v: INTERACTIVE_SPEC_VERSION,
      kind: 'guided_walkthrough',
      title: 'Second (valid) widget',
      steps: [{ prompt: 'p', answer: 'a' }],
    });
    const body = [
      'Prose before.',
      '',
      '```interactive-spec',
      '{ broken json',
      '```',
      '',
      '```interactive-spec',
      validSecond,
      '```',
      '',
      'Prose after.',
    ].join('\n');
    // parseInteractiveSpec itself still fails — the FIRST fence is what it
    // tries to parse, and it's broken — but that must never be a reason to
    // skip stripping. This is the exact call shape a caller falling back
    // to raw atom.content on ParseFailure would get wrong.
    expect(parseInteractiveSpec(body).ok).toBe(false);
    const stripped = stripAllInteractiveSpecFences(body);
    expect(stripped).toContain('Prose before');
    expect(stripped).toContain('Prose after');
    expect(stripped).not.toContain('interactive-spec');
    expect(stripped).not.toContain('Second (valid) widget');
  });

  it('handles a body with no fence at all (no-op)', () => {
    expect(stripAllInteractiveSpecFences('Just plain prose.')).toBe('Just plain prose.');
  });
});

describe('evalFormula', () => {
  it('handles arithmetic precedence (* before +)', () => {
    expect(evalFormula('1 + 2 * 3', {})).toBe(7);
  });

  it('handles parentheses', () => {
    expect(evalFormula('(1 + 2) * 3', {})).toBe(9);
  });

  it('handles unary minus', () => {
    expect(evalFormula('-3 + 5', {})).toBe(2);
    expect(evalFormula('-(2 * 3)', {})).toBe(-6);
  });

  it('handles ^ as power, right-associative', () => {
    // 2^3^2 = 2^(3^2) = 2^9 = 512
    expect(evalFormula('2^3^2', {})).toBe(512);
  });

  it('looks up variables', () => {
    expect(evalFormula('a + b * 2', { a: 1, b: 3 })).toBe(7);
  });

  it('calls allowed functions', () => {
    expect(evalFormula('sqrt(9)', {})).toBe(3);
    expect(evalFormula('max(a, b, 5)', { a: 1, b: 3 })).toBe(5);
    expect(evalFormula('abs(-7)', {})).toBe(7);
    expect(evalFormula('pow(2, 10)', {})).toBe(1024);
  });

  it('throws on unknown function', () => {
    expect(() => evalFormula('eval(1)', {})).toThrow(/unknown function/);
    expect(() => evalFormula('Function("a")', {})).toThrow();
  });

  it('throws on unknown variable', () => {
    expect(() => evalFormula('x + 1', {})).toThrow(/unknown variable/);
  });

  it('throws on trailing junk', () => {
    expect(() => evalFormula('1 + 2 banana', {})).toThrow(/trailing/);
  });

  it('throws on empty', () => {
    expect(() => evalFormula('', {})).toThrow();
  });

  it('does NOT execute via Function() or eval()', () => {
    // The hardening test: an attacker authoring content can't reach
    // global window/process via the formula sandbox. Plain identifiers
    // resolve only against `vars`; function calls only resolve against
    // the FUNCS allow-list. Anything else throws.
    expect(() => evalFormula('window', {})).toThrow();
    expect(() => evalFormula('process.env.JWT_SECRET', {})).toThrow();
    expect(() => evalFormula('this', {})).toThrow();
  });

  it('handles trig functions in radians', () => {
    expect(evalFormula('sin(0)', {})).toBe(0);
    expect(evalFormula('cos(0)', {})).toBe(1);
  });
});

// ============================================================================
// Branching guided_walkthrough (plan W2.5 / amendment D3)
// ============================================================================
//
// The tree is content, and every rule below exists because breaking it
// produces a widget that looks fine to its author and traps or misleads a
// student. Each case asserts the precise message too — a validator that
// says "invalid spec" sends an author back to guesswork.

function branchingSpec(branches: unknown) {
  return {
    v: INTERACTIVE_SPEC_VERSION,
    kind: 'guided_walkthrough',
    title: 'Green, Stokes or Gauss?',
    // steps stays REQUIRED on a branching spec: it is the v:1 degradation
    // path for a renderer that ignores `branches` (amendment D1).
    steps: [{ prompt: 'What is the boundary?', answer: 'A curve or a surface.' }],
    branches,
  };
}

const SOUND_TREE = {
  v: INTERACTIVE_SPEC_VERSION,
  nodes: [
    {
      id: 'n1',
      question: 'Is the region closed?',
      options: [
        { label: 'Yes', next: 'n2' },
        { label: 'No', next: 'leaf_stokes' },
      ],
    },
    {
      id: 'n2',
      question: 'Curve or surface?',
      options: [
        { label: 'Curve', next: 'leaf_green' },
        { label: 'Surface', next: 'leaf_gauss' },
      ],
    },
  ],
  leaves: [
    {
      id: 'leaf_stokes',
      method: "Stokes' theorem",
      reason: 'An open surface with an oriented boundary wants Stokes.',
      best: true,
    },
    {
      id: 'leaf_green',
      method: "Green's theorem",
      reason: 'A flat closed curve bounds a region, so Green applies.',
      best: true,
    },
    {
      id: 'leaf_gauss',
      method: 'The divergence theorem',
      reason: 'A closed surface bounds a solid, so the flux becomes a triple integral.',
      best: false,
    },
  ],
};

function reasonFor(branches: unknown): string {
  const r = __testing.validateSpec(branchingSpec(branches));
  expect(r.ok).toBe(false);
  return r.ok ? '' : r.reason;
}

describe('guided_walkthrough branches — accepted', () => {
  it('accepts a sound tree', () => {
    const r = __testing.validateSpec(branchingSpec(SOUND_TREE));
    expect(r.ok).toBe(true);
  });

  it('parses a branching spec out of an atom body', () => {
    const body = ['prose', '', '```interactive-spec', JSON.stringify(branchingSpec(SOUND_TREE)), '```'].join('\n');
    const r = parseInteractiveSpec(body);
    expect(r.ok).toBe(true);
    if (r.ok && r.spec.kind === 'guided_walkthrough') {
      expect(r.spec.branches?.nodes).toHaveLength(2);
      expect(r.spec.steps).toHaveLength(1);
    }
  });

  it('still accepts a guided_walkthrough with no branches at all (additive, v:1-compatible)', () => {
    const r = __testing.validateSpec({
      v: INTERACTIVE_SPEC_VERSION,
      kind: 'guided_walkthrough',
      title: 'Linear',
      steps: [{ prompt: 'p', answer: 'a' }],
    });
    expect(r.ok).toBe(true);
  });

  it('accepts several best leaves — a tree may sanction more than one route', () => {
    const r = __testing.validateSpec(branchingSpec(SOUND_TREE));
    expect(r.ok).toBe(true);
    expect(SOUND_TREE.leaves.filter((l) => l.best).length).toBeGreaterThan(1);
  });

  it('accepts a diamond — two routes converging on one node is not a cycle', () => {
    const r = __testing.validateSpec(
      branchingSpec({
        v: INTERACTIVE_SPEC_VERSION,
        nodes: [
          {
            id: 'n1',
            question: 'Which way?',
            options: [
              { label: 'Left', next: 'n2' },
              { label: 'Right', next: 'n3' },
            ],
          },
          {
            id: 'n2',
            question: 'Then?',
            options: [
              { label: 'On', next: 'n4' },
              { label: 'Stop', next: 'leaf_a' },
            ],
          },
          {
            id: 'n3',
            question: 'Then?',
            options: [
              { label: 'On', next: 'n4' },
              { label: 'Stop', next: 'leaf_a' },
            ],
          },
          {
            id: 'n4',
            question: 'Last call?',
            options: [
              { label: 'A', next: 'leaf_a' },
              { label: 'B', next: 'leaf_b' },
            ],
          },
        ],
        leaves: [
          { id: 'leaf_a', method: 'A', reason: 'The first route is the sanctioned one.', best: true },
          { id: 'leaf_b', method: 'B', reason: 'This route works but costs more algebra.', best: false },
        ],
      }),
    );
    expect(r.ok).toBe(true);
  });
});

describe('guided_walkthrough branches — refused, by name', () => {
  it('refuses a cycle and names the loop', () => {
    const reason = reasonFor({
      v: INTERACTIVE_SPEC_VERSION,
      nodes: [
        {
          id: 'n1',
          question: 'Closed?',
          options: [
            { label: 'Yes', next: 'n2' },
            { label: 'No', next: 'leaf_ok' },
          ],
        },
        {
          id: 'n2',
          question: 'Sure?',
          options: [
            { label: 'Back', next: 'n1' },
            { label: 'On', next: 'leaf_ok' },
          ],
        },
      ],
      leaves: [{ id: 'leaf_ok', method: 'Stokes', reason: 'The boundary is oriented.', best: true }],
    });
    expect(reason).toContain('cycle');
    expect(reason).toContain('n1 → n2 → n1');
  });

  it('refuses an orphan node and names it and the root', () => {
    const reason = reasonFor({
      v: INTERACTIVE_SPEC_VERSION,
      nodes: [
        {
          id: 'n1',
          question: 'Closed?',
          options: [
            { label: 'Yes', next: 'leaf_ok' },
            { label: 'No', next: 'leaf_ok' },
          ],
        },
        {
          id: 'n_orphan',
          question: 'Nobody can get here',
          options: [
            { label: 'A', next: 'leaf_ok' },
            { label: 'B', next: 'leaf_ok' },
          ],
        },
      ],
      leaves: [{ id: 'leaf_ok', method: 'Stokes', reason: 'The boundary is oriented.', best: true }],
    });
    expect(reason).toBe('branches: "n_orphan" is unreachable from the root node "n1"');
  });

  it('refuses an orphan leaf too — content nobody can reach', () => {
    const reason = reasonFor({
      v: INTERACTIVE_SPEC_VERSION,
      nodes: [
        {
          id: 'n1',
          question: 'Closed?',
          options: [
            { label: 'Yes', next: 'leaf_ok' },
            { label: 'No', next: 'leaf_ok' },
          ],
        },
      ],
      leaves: [
        { id: 'leaf_ok', method: 'Stokes', reason: 'The boundary is oriented.', best: true },
        { id: 'leaf_lost', method: 'Green', reason: 'Nothing points at this leaf.', best: false },
      ],
    });
    expect(reason).toBe('branches: "leaf_lost" is unreachable from the root node "n1"');
  });

  it('refuses a dangling next and names the option and the missing id', () => {
    const reason = reasonFor({
      v: INTERACTIVE_SPEC_VERSION,
      nodes: [
        {
          id: 'n1',
          question: 'Closed?',
          options: [
            { label: 'Yes', next: 'leaf_ok' },
            { label: 'No', next: 'leaf_typo' },
          ],
        },
      ],
      leaves: [{ id: 'leaf_ok', method: 'Stokes', reason: 'The boundary is oriented.', best: true }],
    });
    expect(reason).toBe(
      'branches node "n1" option "No" points at "leaf_typo", which is neither a node nor a leaf id',
    );
  });

  it('refuses an empty reason and says why a dead end must speak', () => {
    const reason = reasonFor({
      ...SOUND_TREE,
      leaves: SOUND_TREE.leaves.map((l) => (l.id === 'leaf_gauss' ? { ...l, reason: '   ' } : l)),
    });
    expect(reason).toBe('branches leaf "leaf_gauss" needs a reason sentence (the dead end is the lesson)');
  });

  it('refuses a tree with no best leaf', () => {
    const reason = reasonFor({
      ...SOUND_TREE,
      leaves: SOUND_TREE.leaves.map((l) => ({ ...l, best: false })),
    });
    expect(reason).toContain('no leaf is marked best:true');
  });

  it('refuses a duplicate id across nodes and leaves', () => {
    const reason = reasonFor({
      v: INTERACTIVE_SPEC_VERSION,
      nodes: [
        {
          id: 'n1',
          question: 'Closed?',
          options: [
            { label: 'Yes', next: 'leaf_ok' },
            { label: 'No', next: 'leaf_ok' },
          ],
        },
      ],
      leaves: [
        { id: 'leaf_ok', method: 'Stokes', reason: 'The boundary is oriented.', best: true },
        { id: 'n1', method: 'Green', reason: 'This id collides with a node.', best: false },
      ],
    });
    expect(reason).toBe('branches: duplicate id "n1" (already declared as nodes[0])');
  });

  it('refuses a one-option node — a decision with one route is not a decision', () => {
    const reason = reasonFor({
      v: INTERACTIVE_SPEC_VERSION,
      nodes: [{ id: 'n1', question: 'Closed?', options: [{ label: 'Yes', next: 'leaf_ok' }] }],
      leaves: [{ id: 'leaf_ok', method: 'Stokes', reason: 'The boundary is oriented.', best: true }],
    });
    expect(reason).toContain('branches node "n1" needs at least 2 options');
  });

  it('refuses a leaf with no method', () => {
    const reason = reasonFor({
      ...SOUND_TREE,
      leaves: SOUND_TREE.leaves.map((l) => (l.id === 'leaf_green' ? { ...l, method: '' } : l)),
    });
    expect(reason).toBe('branches leaf "leaf_green" needs a method');
  });

  it('refuses a node with no question', () => {
    const reason = reasonFor({
      ...SOUND_TREE,
      nodes: SOUND_TREE.nodes.map((n) => (n.id === 'n2' ? { ...n, question: '' } : n)),
    });
    expect(reason).toBe('branches.nodes[1] "n2" needs a question');
  });

  it('refuses an unsupported branches version rather than guessing', () => {
    expect(reasonFor({ ...SOUND_TREE, v: 2 })).toBe('unsupported branches version: 2');
  });

  it('refuses empty nodes / leaves', () => {
    expect(reasonFor({ v: INTERACTIVE_SPEC_VERSION, nodes: [], leaves: SOUND_TREE.leaves })).toBe(
      'branches.nodes[] required',
    );
    expect(reasonFor({ v: INTERACTIVE_SPEC_VERSION, nodes: SOUND_TREE.nodes, leaves: [] })).toBe(
      'branches.leaves[] required',
    );
  });
});

// ============================================================================
// linear_map mode (wow-pass, 2026-08-30)
// ============================================================================

describe('validateSimulation — linear_map mode', () => {
  const LM_BASE = {
    v: INTERACTIVE_SPEC_VERSION,
    kind: 'simulation',
    title: 'Sixteen arrows',
    linear_map: {
      matrix: [[2, 1], [1, 2]],
      num_vectors: 16,
      eigen: [
        { dir: [0.70710678, 0.70710678], value: 3 },
        { dir: [0.70710678, -0.70710678], value: 1 },
      ],
      ghost_matrix: [[2, 0], [0, 2]],
    },
  };

  function parse(spec: unknown) {
    return parseInteractiveSpec('```interactive-spec\n' + JSON.stringify(spec) + '\n```');
  }

  it('accepts a linear_map spec without x_expr/y_expr/t_min/t_max', () => {
    const result = parse(LM_BASE);
    expect(result.ok).toBe(true);
  });

  it('still requires x_expr/y_expr when linear_map is absent', () => {
    const result = parse({ v: INTERACTIVE_SPEC_VERSION, kind: 'simulation', title: 'no figure' });
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('x_expr');
  });

  it('REFUSES a claimed eigenpair that is not an eigenpair of the matrix', () => {
    const bad = {
      ...LM_BASE,
      linear_map: { ...LM_BASE.linear_map, eigen: [{ dir: [1, 0], value: 3 }] },
    };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('not an eigenpair');
  });

  it('refuses a zero eigen direction', () => {
    const bad = {
      ...LM_BASE,
      linear_map: { ...LM_BASE.linear_map, eigen: [{ dir: [0, 0], value: 3 }] },
    };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('nonzero');
  });

  it('refuses a malformed matrix and a malformed ghost_matrix by name', () => {
    for (const field of ['matrix', 'ghost_matrix'] as const) {
      const bad = {
        ...LM_BASE,
        linear_map: { ...LM_BASE.linear_map, [field]: [[1, 2], [3]] },
      };
      const result = parse(bad);
      expect(result.ok).toBe(false);
      expect((result as { reason: string }).reason).toContain(field);
    }
  });

  it('refuses non-finite and oversized matrix entries', () => {
    for (const entry of [Number.NaN, Number.POSITIVE_INFINITY, 101]) {
      const bad = {
        ...LM_BASE,
        linear_map: { ...LM_BASE.linear_map, matrix: [[entry, 0], [0, 1]], eigen: undefined },
      };
      const result = parse(bad);
      expect(result.ok).toBe(false);
    }
  });

  it('bounds num_vectors to [8, 24] integers', () => {
    for (const n of [4, 25, 12.5]) {
      const bad = { ...LM_BASE, linear_map: { ...LM_BASE.linear_map, num_vectors: n } };
      const result = parse(bad);
      expect(result.ok).toBe(false);
      expect((result as { reason: string }).reason).toContain('num_vectors');
    }
  });

  it('refuses combining linear_map with the expression ghost', () => {
    const bad = { ...LM_BASE, ghost: { x_expr: 'cos(t)', y_expr: 'sin(t)' } };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('mutually exclusive');
  });

  it('refuses more than two eigenpairs (a 2×2 matrix has at most two independent directions)', () => {
    const bad = {
      ...LM_BASE,
      linear_map: {
        ...LM_BASE.linear_map,
        eigen: [
          { dir: [0.70710678, 0.70710678], value: 3 },
          { dir: [0.70710678, -0.70710678], value: 1 },
          { dir: [-0.70710678, -0.70710678], value: 3 },
        ],
      },
    };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('1–2 eigenpairs');
  });

  // ==========================================================================
  // unit_square / area_label (determinants-as-area-multiplier extension)
  // ==========================================================================

  it('accepts unit_square and area_label as booleans', () => {
    const ok = {
      ...LM_BASE,
      linear_map: { ...LM_BASE.linear_map, unit_square: true, area_label: true },
    };
    expect(parse(ok).ok).toBe(true);

    const okFalse = {
      ...LM_BASE,
      linear_map: { ...LM_BASE.linear_map, unit_square: false, area_label: false },
    };
    expect(parse(okFalse).ok).toBe(true);

    const okSquareOnly = {
      ...LM_BASE,
      linear_map: { ...LM_BASE.linear_map, unit_square: true },
    };
    expect(parse(okSquareOnly).ok).toBe(true);
  });

  it('rejects a non-boolean unit_square', () => {
    const bad = { ...LM_BASE, linear_map: { ...LM_BASE.linear_map, unit_square: 'yes' } };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('unit_square must be a boolean');
  });

  it('rejects a non-boolean area_label', () => {
    const bad = {
      ...LM_BASE,
      linear_map: { ...LM_BASE.linear_map, unit_square: true, area_label: 'yes' },
    };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('area_label must be a boolean');
  });

  it('refuses area_label:true without unit_square:true, by name', () => {
    const bad = { ...LM_BASE, linear_map: { ...LM_BASE.linear_map, area_label: true } };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('area_label requires unit_square: true');
  });

  it('refuses area_label:true with unit_square explicitly false', () => {
    const bad = {
      ...LM_BASE,
      linear_map: { ...LM_BASE.linear_map, unit_square: false, area_label: true },
    };
    const result = parse(bad);
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toContain('area_label requires unit_square: true');
  });
});

// ============================================================================
// `why` framing field (live-QA finding, 2026-09-03: "the interactive — why
// it's used is not clear"). Shared across all three kinds, so tested once
// via validateSpec directly rather than duplicated per-kind.
// ============================================================================

describe('why framing field', () => {
  const manipulableBase = {
    v: INTERACTIVE_SPEC_VERSION,
    kind: 'manipulable',
    title: 'x',
    inputs: [{ id: 'a', label: 'a', min: 0, max: 1 }],
    outputs: [{ label: 'y', formula: 'a' }],
  };

  it('is optional — a spec with no why still validates', () => {
    const r = __testing.validateSpec(manipulableBase);
    expect(r.ok).toBe(true);
  });

  it('accepts a real why sentence', () => {
    const r = __testing.validateSpec({ ...manipulableBase, why: 'Drag this to see the pattern before we name it.' });
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.spec as { why?: string }).why).toBe('Drag this to see the pattern before we name it.');
  });

  it('rejects an empty why string', () => {
    const r = __testing.validateSpec({ ...manipulableBase, why: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('why must be a non-empty string');
  });

  it('rejects a why longer than MAX_WHY_CHARS', () => {
    const r = __testing.validateSpec({ ...manipulableBase, why: 'x'.repeat(MAX_WHY_CHARS + 1) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain(`at most ${MAX_WHY_CHARS} characters`);
  });

  it('rejects a non-string why', () => {
    const r = __testing.validateSpec({ ...manipulableBase, why: 42 as unknown as string });
    expect(r.ok).toBe(false);
  });

  it('applies identically on a simulation spec', () => {
    const spec = {
      v: INTERACTIVE_SPEC_VERSION,
      kind: 'simulation',
      title: 'x',
      x_expr: 't',
      y_expr: 't',
      t_min: 0,
      t_max: 1,
      why: 'Watch what multiplying by this matrix actually does to the whole plane.',
    };
    const r = __testing.validateSpec(spec);
    expect(r.ok).toBe(true);
  });

  it('applies identically on a guided_walkthrough spec', () => {
    const spec = {
      v: INTERACTIVE_SPEC_VERSION,
      kind: 'guided_walkthrough',
      title: 'x',
      why: 'Try it yourself before moving on — reading is not the same as doing.',
      steps: [{ prompt: 'p', answer: 'a' }],
    };
    const r = __testing.validateSpec(spec);
    expect(r.ok).toBe(true);
  });
});
