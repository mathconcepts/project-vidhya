/**
 * Unit tests for the interactive-spec parser + safe formula evaluator.
 *
 * These pin the parser's tolerance (markdown fence handling, version
 * gate, kind validation) and the evaluator's safety (no Function(),
 * no eval, no global-name leakage) so future refactors can't quietly
 * widen the surface that authored content can touch.
 */

import { describe, it, expect } from 'vitest';
import { parseInteractiveSpec, evalFormula, INTERACTIVE_SPEC_VERSION, __testing } from './types';

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
