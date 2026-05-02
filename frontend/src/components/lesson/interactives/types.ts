/**
 * frontend/src/components/lesson/interactives/types.ts
 *
 * Shared schema for the three interactive widget kinds. Authors embed
 * a fenced ` ```interactive-spec\n{...}\n``` ` JSON block in the atom
 * body — mirrors the `gif-scene` pattern (§4.15) so authors only learn
 * one extension shape.
 *
 * Capability gate (eng-review D5): when an atom's exam_pack has
 * `interactives_enabled = false`, the unit orchestrator skips generating
 * atoms of kinds `interactive-*`. This keeps custom operator packs in
 * a text+GIF-only lane until they explicitly opt in.
 *
 * Versioning (eng-review risk note): the schema is versioned via the
 * top-level `v` field. v1 widgets stay forward-compatible; renderer
 * picks the version. Old units never re-rendered with a new schema
 * unless explicitly migrated. Same discipline as `lift_v1`.
 */

export const INTERACTIVE_SPEC_VERSION = 1 as const;

export type InteractiveKind = 'manipulable' | 'simulation' | 'guided_walkthrough';

/**
 * Slider-driven derived value. Operator drags the input → live formula
 * evaluation updates the displayed output. Useful for "what's the
 * eigenvalue of [[a, 0], [0, 2]] as a varies?" style explorations.
 */
export interface ManipulableSpec {
  v: typeof INTERACTIVE_SPEC_VERSION;
  kind: 'manipulable';
  /** Display title above the widget. Concise. */
  title: string;
  /** One slider per controllable parameter. */
  inputs: Array<{
    id: string;             // referenced inside `formula`
    label: string;
    min: number;
    max: number;
    step?: number;          // default 0.1
    initial?: number;       // default = min
  }>;
  /**
   * Output rows. Each `formula` is a safe arithmetic expression over
   * the input ids using +, -, *, /, ^, parentheses, and the funcs:
   * sin, cos, tan, sqrt, abs, log, exp, min, max, pow.
   */
  outputs: Array<{
    label: string;
    formula: string;
    digits?: number;        // default 3
  }>;
  /** Optional caption shown beneath the widget. Stripped of HTML. */
  caption?: string;
}

/**
 * Parameterized animation. Plays/pauses on a single button. The
 * underlying parametric (x(t), y(t)) traces over a line on a small SVG
 * canvas. Useful for "watch eigenvector direction stay invariant".
 */
export interface SimulationSpec {
  v: typeof INTERACTIVE_SPEC_VERSION;
  kind: 'simulation';
  title: string;
  /** Parametric expressions in t ∈ [t_min, t_max]. */
  x_expr: string;
  y_expr: string;
  t_min: number;
  t_max: number;
  /** Total duration of one play, in seconds. Default 4. */
  duration_sec?: number;
  /** Display range. Default auto-fit from sampled points. */
  view_box?: { x_min: number; x_max: number; y_min: number; y_max: number };
  caption?: string;
}

/**
 * Multi-step solver. Operator clicks "Reveal step" to advance through
 * the worked steps. Each step shows a question + its hint + (after a
 * second click) the answer line. No grading — purely revelation paced.
 */
export interface GuidedWalkthroughSpec {
  v: typeof INTERACTIVE_SPEC_VERSION;
  kind: 'guided_walkthrough';
  title: string;
  steps: Array<{
    prompt: string;          // shown immediately
    hint?: string;           // shown on first click
    answer: string;          // shown on second click
    /** Optional LaTeX-flavored equation block; renderer keeps it monospace. */
    eqn?: string;
  }>;
  caption?: string;
}

export type InteractiveSpec =
  | ManipulableSpec
  | SimulationSpec
  | GuidedWalkthroughSpec;

// ============================================================================
// Parser — extracts the spec from an atom body, with strict shape checks.
// ============================================================================

const FENCE_RE = /```interactive-spec\s*([\s\S]*?)```/m;

export interface ParseSuccess {
  ok: true;
  spec: InteractiveSpec;
  /** Body with the spec block stripped — caller renders this as the prose. */
  body_without_spec: string;
}
export interface ParseFailure {
  ok: false;
  reason: string;
}

export function parseInteractiveSpec(body: string): ParseSuccess | ParseFailure {
  if (typeof body !== 'string' || body.length === 0) {
    return { ok: false, reason: 'empty body' };
  }
  const match = body.match(FENCE_RE);
  if (!match) return { ok: false, reason: 'no interactive-spec block' };
  const json = match[1].trim();
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, reason: `JSON.parse: ${(e as Error).message}` };
  }
  const validation = validateSpec(parsed);
  if (!validation.ok) return validation;
  return {
    ok: true,
    spec: validation.spec,
    body_without_spec: body.replace(FENCE_RE, '').trim(),
  };
}

function validateSpec(raw: any): ParseSuccess | ParseFailure {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'spec must be an object' };
  }
  if (raw.v !== INTERACTIVE_SPEC_VERSION) {
    return { ok: false, reason: `unsupported spec version: ${raw.v}` };
  }
  const kind = raw.kind;
  if (kind === 'manipulable') return validateManipulable(raw);
  if (kind === 'simulation') return validateSimulation(raw);
  if (kind === 'guided_walkthrough') return validateGuided(raw);
  return { ok: false, reason: `unknown interactive kind: ${kind}` };
}

function validateManipulable(raw: any): ParseSuccess | ParseFailure {
  if (typeof raw.title !== 'string') return { ok: false, reason: 'manipulable.title required' };
  if (!Array.isArray(raw.inputs) || raw.inputs.length === 0) {
    return { ok: false, reason: 'manipulable.inputs[] required' };
  }
  for (let i = 0; i < raw.inputs.length; i++) {
    const inp = raw.inputs[i];
    if (!inp || typeof inp.id !== 'string' || !inp.id) {
      return { ok: false, reason: `manipulable.inputs[${i}].id required` };
    }
    if (typeof inp.min !== 'number' || typeof inp.max !== 'number' || inp.max <= inp.min) {
      return { ok: false, reason: `manipulable.inputs[${i}].min/max invalid` };
    }
  }
  if (!Array.isArray(raw.outputs) || raw.outputs.length === 0) {
    return { ok: false, reason: 'manipulable.outputs[] required' };
  }
  return { ok: true, spec: raw as ManipulableSpec, body_without_spec: '' };
}

function validateSimulation(raw: any): ParseSuccess | ParseFailure {
  if (typeof raw.title !== 'string') return { ok: false, reason: 'simulation.title required' };
  if (typeof raw.x_expr !== 'string' || typeof raw.y_expr !== 'string') {
    return { ok: false, reason: 'simulation.x_expr / y_expr required' };
  }
  if (typeof raw.t_min !== 'number' || typeof raw.t_max !== 'number' || raw.t_max <= raw.t_min) {
    return { ok: false, reason: 'simulation.t_min/t_max invalid' };
  }
  return { ok: true, spec: raw as SimulationSpec, body_without_spec: '' };
}

function validateGuided(raw: any): ParseSuccess | ParseFailure {
  if (typeof raw.title !== 'string') return { ok: false, reason: 'guided_walkthrough.title required' };
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    return { ok: false, reason: 'guided_walkthrough.steps[] required' };
  }
  for (let i = 0; i < raw.steps.length; i++) {
    const s = raw.steps[i];
    if (!s || typeof s.prompt !== 'string' || typeof s.answer !== 'string') {
      return { ok: false, reason: `guided_walkthrough.steps[${i}] missing prompt or answer` };
    }
  }
  return { ok: true, spec: raw as GuidedWalkthroughSpec, body_without_spec: '' };
}

// ============================================================================
// Safe formula evaluator (Manipulable outputs)
// ============================================================================
//
// Tiny recursive-descent expression parser. Supports:
//   - +, -, *, /, ^ (precedence: ^, * /, + -)
//   - Parentheses
//   - Unary minus
//   - Identifiers (input ids), evaluated against `vars`
//   - Function calls: sin, cos, tan, sqrt, abs, log, exp, min, max, pow
//
// Uses no Function() or eval(). Invalid input → throws; caller should
// catch and render a fallback. Exported for tests.

export function evalFormula(expr: string, vars: Record<string, number>): number {
  if (typeof expr !== 'string' || expr.length === 0) throw new Error('empty formula');
  const parser = new Parser(expr, vars);
  const v = parser.parseExpression();
  parser.expectEnd();
  return v;
}

const FUNCS: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log,
  exp: Math.exp,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
};

class Parser {
  private i = 0;
  constructor(private src: string, private vars: Record<string, number>) {}

  parseExpression(): number {
    let v = this.parseTerm();
    while (true) {
      this.skipWs();
      const c = this.src[this.i];
      if (c === '+') { this.i++; v += this.parseTerm(); continue; }
      if (c === '-') { this.i++; v -= this.parseTerm(); continue; }
      break;
    }
    return v;
  }

  private parseTerm(): number {
    let v = this.parsePower();
    while (true) {
      this.skipWs();
      const c = this.src[this.i];
      if (c === '*') { this.i++; v *= this.parsePower(); continue; }
      if (c === '/') { this.i++; v /= this.parsePower(); continue; }
      break;
    }
    return v;
  }

  private parsePower(): number {
    const base = this.parseUnary();
    this.skipWs();
    if (this.src[this.i] === '^') {
      this.i++;
      // Right-associative: recurse into parsePower so 2^3^2 = 2^(3^2)
      const exp = this.parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  private parseUnary(): number {
    this.skipWs();
    if (this.src[this.i] === '-') { this.i++; return -this.parseUnary(); }
    if (this.src[this.i] === '+') { this.i++; return this.parseUnary(); }
    return this.parseAtom();
  }

  private parseAtom(): number {
    this.skipWs();
    const c = this.src[this.i];
    if (c === '(') {
      this.i++;
      const v = this.parseExpression();
      this.skipWs();
      if (this.src[this.i] !== ')') throw new Error('expected )');
      this.i++;
      return v;
    }
    if (/[0-9.]/.test(c)) {
      const m = /^[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?/.exec(this.src.slice(this.i));
      if (!m) throw new Error('invalid number');
      this.i += m[0].length;
      return parseFloat(m[0]);
    }
    if (/[a-zA-Z_]/.test(c)) {
      const m = /^[a-zA-Z_][a-zA-Z_0-9]*/.exec(this.src.slice(this.i));
      if (!m) throw new Error('invalid identifier');
      this.i += m[0].length;
      const name = m[0];
      this.skipWs();
      if (this.src[this.i] === '(') {
        // Function call
        this.i++;
        const args: number[] = [];
        this.skipWs();
        if (this.src[this.i] !== ')') {
          args.push(this.parseExpression());
          this.skipWs();
          while (this.src[this.i] === ',') {
            this.i++;
            args.push(this.parseExpression());
            this.skipWs();
          }
        }
        if (this.src[this.i] !== ')') throw new Error('expected )');
        this.i++;
        const fn = FUNCS[name];
        if (!fn) throw new Error(`unknown function: ${name}`);
        return fn(...args);
      }
      // Variable lookup
      if (!(name in this.vars)) throw new Error(`unknown variable: ${name}`);
      return this.vars[name];
    }
    throw new Error(`unexpected character: ${c}`);
  }

  expectEnd(): void {
    this.skipWs();
    if (this.i !== this.src.length) throw new Error(`trailing: ${this.src.slice(this.i)}`);
  }

  private skipWs(): void {
    while (this.i < this.src.length && /\s/.test(this.src[this.i])) this.i++;
  }
}

// Exported for tests
export const __testing = { validateSpec, FUNCS };
