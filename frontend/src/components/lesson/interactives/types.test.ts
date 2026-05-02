/**
 * Unit tests for the interactive-spec parser + safe formula evaluator.
 *
 * These pin the parser's tolerance (markdown fence handling, version
 * gate, kind validation) and the evaluator's safety (no Function(),
 * no eval, no global-name leakage) so future refactors can't quietly
 * widen the surface that authored content can touch.
 */

import { describe, it, expect } from 'vitest';
import { parseInteractiveSpec, evalFormula, INTERACTIVE_SPEC_VERSION } from './types';

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
