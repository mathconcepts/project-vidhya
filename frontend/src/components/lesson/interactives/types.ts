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
  /**
   * Text beats synced to playback progress (bug #1, live QA: "hook and
   * animation needs to be in sync with each other - like an explanation").
   * Before this, `caption` was the only text field — a single static
   * sentence shown once below the SVG regardless of what the trace was
   * doing at that moment, so the animation read as inert relative to the
   * prose above it. `at_progress` (0..1, same domain as the play head)
   * marks when each beat becomes active; the renderer shows the LAST beat
   * whose `at_progress` is <= the current progress, so the narration
   * advances in step with the trace instead of sitting there as one
   * unchanging line. Optional and additive — `caption` alone still works
   * exactly as before for a widget with nothing to say mid-animation.
   * Sorted ascending by `at_progress`; the first entry should be 0 so
   * something is always showing.
   */
  narration_steps?: Array<{ at_progress: number; text: string }>;
}

/**
 * One question in a branching walkthrough. `options[].next` names either
 * another node id or a leaf id — the validator refuses anything else.
 */
export interface BranchNode {
  id: string;
  question: string;
  options: Array<{ label: string; next: string }>;
}

/**
 * A terminal method choice. `best: true` marks a sanctioned route; every
 * other leaf is a walkable dead end whose `reason` is the lesson — the
 * student is told why the route they picked is the wrong one, in a
 * sentence, never a code.
 */
export interface BranchLeaf {
  id: string;
  method: string;
  reason: string;
  best?: boolean;
}

/**
 * Branching extension of `guided_walkthrough` (plan W2.5, amendment D1;
 * literal pinned in D3). Additive and `v: 1`-compatible: a renderer that
 * predates it ignores `branches` and still renders `steps`, which is why
 * `steps` stays REQUIRED on a branching spec. The steps are the
 * degradation path, not decoration.
 *
 * Self-check only (amendment E5): the spec ships to the browser inside a
 * fenced block, so the leaf the student reaches is client-visible. The
 * widget therefore feeds NOTHING into StudentModel and carries the
 * SmartPracticePage honesty label. Measuring method selection is the job
 * of a server-graded item whose options are methods.
 */
export interface BranchesSpec {
  v: typeof INTERACTIVE_SPEC_VERSION;
  /** The first entry is the root; every other node must be reachable from it. */
  nodes: BranchNode[];
  leaves: BranchLeaf[];
}

/**
 * Multi-step solver. Operator clicks "Reveal step" to advance through
 * the worked steps. Each step shows a question + its hint + (after a
 * second click) the answer line. No grading — purely revelation paced.
 *
 * With an optional `branches` tree the same spec renders as the W2.5
 * method-selection wizard instead (one question per view, walkable dead
 * ends, graded at the leaf only — and only as a self-check).
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
  branches?: BranchesSpec;
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
  if (raw.narration_steps !== undefined) {
    if (!Array.isArray(raw.narration_steps) || raw.narration_steps.length === 0) {
      return { ok: false, reason: 'simulation.narration_steps must be a non-empty array when present' };
    }
    for (let i = 0; i < raw.narration_steps.length; i++) {
      const step = raw.narration_steps[i];
      if (
        !step ||
        typeof step.at_progress !== 'number' ||
        step.at_progress < 0 ||
        step.at_progress > 1 ||
        typeof step.text !== 'string' ||
        !step.text
      ) {
        return { ok: false, reason: `simulation.narration_steps[${i}] invalid — needs at_progress in [0,1] and non-empty text` };
      }
    }
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
  if (raw.branches !== undefined) {
    const branchFailure = validateBranches(raw.branches);
    if (branchFailure) return branchFailure;
  }
  return { ok: true, spec: raw as GuidedWalkthroughSpec, body_without_spec: '' };
}

/**
 * Validate the optional `branches` tree. Returns a ParseFailure on the
 * first problem, or null when the tree is sound.
 *
 * Every rule here exists because breaking it produces a widget that looks
 * fine to the author and traps or misleads a student:
 *   - a dangling `next` renders a choice button that goes nowhere
 *   - an orphan node is content nobody can reach
 *   - a cycle lets a student walk forever without meeting a leaf
 *   - an empty reason means a dead end that never says why — the dead end
 *     IS the lesson, so a silent one is a bug, not a style problem
 *   - no `best` leaf means the tree teaches no sanctioned route
 *
 * Messages name the offending id, mirroring the repo's refusal precedent
 * ("names the missing column").
 */
function validateBranches(raw: any): ParseFailure | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'branches must be an object' };
  }
  if (raw.v !== INTERACTIVE_SPEC_VERSION) {
    return { ok: false, reason: `unsupported branches version: ${raw.v}` };
  }
  if (!Array.isArray(raw.nodes) || raw.nodes.length === 0) {
    return { ok: false, reason: 'branches.nodes[] required' };
  }
  if (!Array.isArray(raw.leaves) || raw.leaves.length === 0) {
    return { ok: false, reason: 'branches.leaves[] required' };
  }

  const nodeIds = new Set<string>();
  const leafIds = new Set<string>();
  const seen = new Map<string, string>();  // id -> where it was first declared

  for (let i = 0; i < raw.nodes.length; i++) {
    const n = raw.nodes[i];
    if (!n || typeof n.id !== 'string' || n.id.trim() === '') {
      return { ok: false, reason: `branches.nodes[${i}].id required` };
    }
    if (seen.has(n.id)) {
      return { ok: false, reason: `branches: duplicate id "${n.id}" (already declared as ${seen.get(n.id)})` };
    }
    seen.set(n.id, `nodes[${i}]`);
    nodeIds.add(n.id);
    if (typeof n.question !== 'string' || n.question.trim() === '') {
      return { ok: false, reason: `branches.nodes[${i}] "${n.id}" needs a question` };
    }
    if (!Array.isArray(n.options) || n.options.length < 2) {
      return { ok: false, reason: `branches node "${n.id}" needs at least 2 options (a decision with one route is not a decision)` };
    }
    for (let j = 0; j < n.options.length; j++) {
      const o = n.options[j];
      if (!o || typeof o.label !== 'string' || o.label.trim() === '') {
        return { ok: false, reason: `branches node "${n.id}" options[${j}] needs a label` };
      }
      if (typeof o.next !== 'string' || o.next.trim() === '') {
        return { ok: false, reason: `branches node "${n.id}" options[${j}] "${o.label}" needs next` };
      }
    }
  }

  for (let i = 0; i < raw.leaves.length; i++) {
    const l = raw.leaves[i];
    if (!l || typeof l.id !== 'string' || l.id.trim() === '') {
      return { ok: false, reason: `branches.leaves[${i}].id required` };
    }
    if (seen.has(l.id)) {
      return { ok: false, reason: `branches: duplicate id "${l.id}" (already declared as ${seen.get(l.id)})` };
    }
    seen.set(l.id, `leaves[${i}]`);
    leafIds.add(l.id);
    if (typeof l.method !== 'string' || l.method.trim() === '') {
      return { ok: false, reason: `branches leaf "${l.id}" needs a method` };
    }
    if (typeof l.reason !== 'string' || l.reason.trim() === '') {
      return { ok: false, reason: `branches leaf "${l.id}" needs a reason sentence (the dead end is the lesson)` };
    }
    if (l.best !== undefined && typeof l.best !== 'boolean') {
      return { ok: false, reason: `branches leaf "${l.id}" best must be a boolean` };
    }
  }

  if (!raw.leaves.some((l: any) => l.best === true)) {
    return { ok: false, reason: 'branches: no leaf is marked best:true — the tree teaches no sanctioned route' };
  }

  // Dangling targets.
  for (const n of raw.nodes) {
    for (const o of n.options) {
      if (!nodeIds.has(o.next) && !leafIds.has(o.next)) {
        return {
          ok: false,
          reason: `branches node "${n.id}" option "${o.label}" points at "${o.next}", which is neither a node nor a leaf id`,
        };
      }
    }
  }

  // Reachability + acyclicity, in one depth-first walk from the root.
  const byId = new Map<string, BranchNode>(raw.nodes.map((n: BranchNode) => [n.id, n]));
  const rootId: string = raw.nodes[0].id;
  const reached = new Set<string>();
  const onPath: string[] = [];

  function walk(id: string): ParseFailure | null {
    if (onPath.includes(id)) {
      return { ok: false, reason: `branches: cycle ${[...onPath, id].join(' → ')}` };
    }
    if (reached.has(id)) return null;
    reached.add(id);
    const node = byId.get(id);
    if (!node) return null;         // leaf: terminal by construction
    onPath.push(id);
    for (const o of node.options) {
      const failure = walk(o.next);
      if (failure) return failure;
    }
    onPath.pop();
    return null;
  }

  const cycle = walk(rootId);
  if (cycle) return cycle;

  for (const id of [...nodeIds, ...leafIds]) {
    if (!reached.has(id)) {
      return { ok: false, reason: `branches: "${id}" is unreachable from the root node "${rootId}"` };
    }
  }

  return null;
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
export const __testing = { validateSpec, validateBranches, FUNCS };
