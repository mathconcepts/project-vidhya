/**
 * src/scoring/marking-strategy.ts — the MarkingStrategy seam (plan D11).
 *
 * Premise 7 of the content-readiness plan makes a claim: adding an exam
 * whose marking is the same arithmetic on different numbers is a new
 * `assessment_contracts` row and ZERO code, and adding an exam whose
 * marking needs arithmetic no existing strategy can express is ONE new
 * registered strategy — never a fork of the scorer.
 *
 * That claim is only true if a contributor can find the hook and a test
 * that tells them they got it right. This module is the hook:
 *
 *   - `MarkingStrategy` — the interface. One method: grade one structured
 *     response against one structured item, under params supplied by the
 *     contract.
 *   - `registerMarkingStrategy` / `resolveMarkingStrategy` — the registry.
 *   - `runMarkingStrategyContract` (in `./marking-strategy-contract.ts`) —
 *     the conformance test every implementation must pass, mirroring the
 *     four contracts in EXTENDING.md.
 *
 * ── What a strategy is, and what params are ──────────────────────────────
 *
 * The strategy id names the ALGORITHM. The params name the NUMBERS it runs
 * on. `assessment_contracts.marking` pairs them per question type:
 *
 *   {"mcq": {"strategy": "gate_2026", "params": {...}}, ...}
 *
 * The split is what makes "a new exam is a row" possible. It is also what
 * bounds it honestly: an exam whose marking depends on WHICH correct
 * options were selected (a partial-marking matrix) cannot be expressed by
 * changing numbers, because the built-in strategy's MSQ branch has no
 * concept of a partially-correct selection to score. That is one new
 * registered strategy, and the paper exercise proving the schema survives
 * it is at
 * docs/designs/2026-08-27-assessment-contract-jee-advanced-check.md.
 *
 * ── Refusals are by name (plan D8) ───────────────────────────────────────
 *
 * `resolveMarkingStrategy` returns `undefined` for an id nobody registered,
 * and `unknownMarkingStrategyMessage` builds the refusal a caller should
 * surface:
 *
 *   marking_strategy 'jee_adv_2027' is not registered; known: gate_2026
 *
 * It names the id that failed AND what would have worked. It never falls
 * back to "whatever the scorer does by default" — an unregistered strategy
 * means the contract describes rules this build cannot apply, and grading a
 * student under invented rules is worse than refusing.
 *
 * ── The built-in strategy is a wrapper, not a reimplementation ───────────
 *
 * `gate_2026` delegates to `GateDeterministicScorer` — the exact class that
 * already grades every practice attempt, quiz item and mock question. The
 * arithmetic is not restated here, so the strategy path and the direct path
 * cannot drift; a parity block in `__tests__/deterministic-scorer.test.ts`
 * runs the full marking matrix through both and asserts byte-identical
 * grades. What this module adds is where the NUMBERS come from: params
 * from a contract row, rather than compiled defaults.
 */

import type { GradeResult } from '../core/interfaces';
import type { MarkingScheme } from '../exams/types';
import {
  GateDeterministicScorer,
  // The scorer's epsilon and the contract's `tolerance_epsilon` are the
  // same number by construction (both come from
  // src/exams/marking-constants.ts). Comparing against the scorer's export
  // rather than re-reading the constant is what proves it at runtime.
  NAT_EPSILON as NAT_EPSILON_IN_USE,
  type GateItem,
  type GateResponse,
} from './deterministic-scorer';

// ============================================================================
// The interface
// ============================================================================

/**
 * A structured item to be marked. A superset of the fields the built-in
 * strategy's three question kinds need; a future strategy declares its own
 * required fields in its docs and refuses an item missing them by name.
 */
export interface MarkingStrategyItem {
  id: string;
  /** Question kind, e.g. 'mcq' | 'msq' | 'nat'. Not a closed union: a new
   *  strategy may introduce kinds this build has never seen. */
  kind: string;
  /** The item's maximum marks. */
  marks: number;
  answerIndex?: number;
  options?: unknown[];
  answerIndices?: number[];
  answerRange?: [number, number];
}

/** A structured student response, matching the item's `kind`. */
export interface MarkingStrategyResponse {
  kind: string;
  skipped?: boolean;
  selectedIndex?: number;
  selectedIndices?: number[];
  value?: number;
}

/**
 * Params for one question type, straight out of
 * `assessment_contracts.marking.<kind>.params`. Deliberately untyped at
 * this seam: each strategy owns its own params shape and validates it.
 */
export type MarkingStrategyParams = Record<string, unknown>;

export interface MarkingStrategy {
  /** Registry id. Matches `assessment_contracts.marking.<kind>.strategy`. */
  readonly id: string;
  /** One line: what arithmetic this strategy applies. */
  readonly description: string;
  /** Question kinds this strategy can grade. */
  readonly supportedKinds: readonly string[];
  /**
   * Grade one response. THROWS (never returns a fabricated zero) on a
   * malformed item, a kind it does not support, or params describing rules
   * it cannot apply — the caller routes that to a refusal, not to a mark.
   */
  grade(
    item: MarkingStrategyItem,
    response: MarkingStrategyResponse,
    params?: MarkingStrategyParams,
  ): Promise<GradeResult>;
}

// ============================================================================
// Registry
// ============================================================================

const _registry = new Map<string, MarkingStrategy>();

/**
 * Register a strategy. Throws on a duplicate id — two strategies claiming
 * the same id means one of them silently never runs, and which one wins
 * would depend on import order.
 */
export function registerMarkingStrategy(strategy: MarkingStrategy): void {
  if (!strategy.id || strategy.id.trim() === '') {
    throw new Error('registerMarkingStrategy: a strategy must declare a non-empty id');
  }
  const existing = _registry.get(strategy.id);
  if (existing && existing !== strategy) {
    throw new Error(
      `registerMarkingStrategy: id '${strategy.id}' is already registered; ` +
      `ids must be unique (registered: ${listMarkingStrategyIds().join(', ')})`,
    );
  }
  _registry.set(strategy.id, strategy);
}

/** Resolve a strategy by id, or `undefined` when nobody registered it. */
export function resolveMarkingStrategy(id: string): MarkingStrategy | undefined {
  return _registry.get(id);
}

/** Every registered id, sorted — the "known:" list in a refusal message. */
export function listMarkingStrategyIds(): string[] {
  return [..._registry.keys()].sort();
}

/**
 * The refusal a caller surfaces when `resolveMarkingStrategy` returns
 * undefined. Names the id that failed and the ids that would not have
 * (plan D8: every refusal names the thing, the actual, and the required).
 */
export function unknownMarkingStrategyMessage(id: string): string {
  return `marking_strategy '${id}' is not registered; known: ${listMarkingStrategyIds().join(', ')}`;
}

/** Test-only: drop everything and re-register the built-ins. */
export function __resetMarkingStrategyRegistryForTests(): void {
  _registry.clear();
  registerBuiltInMarkingStrategies();
}

// ============================================================================
// Built-in strategy — negative marking by mark value, exact-set MSQ,
// tolerance-band numeric answers.
// ============================================================================

const _scorer = new GateDeterministicScorer();

const SUPPORTED_KINDS = ['mcq', 'msq', 'nat'] as const;

function numberAt(params: MarkingStrategyParams | undefined, key: string): number | undefined {
  const v = params?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/**
 * Translate contract params into the `MarkingScheme` override the existing
 * scorer already understands. This is the ONLY thing the strategy layer
 * does that the direct path does not — the arithmetic downstream is
 * literally the same method call.
 *
 * When params say exactly what the compiled defaults say, the translated
 * override produces the identical number, which is why the parity test
 * passes on `toEqual` rather than an approximation.
 */
function schemeFromParams(
  item: MarkingStrategyItem,
  params: MarkingStrategyParams | undefined,
): MarkingScheme | undefined {
  if (!params) return undefined;

  if (item.kind === 'mcq') {
    const byMarks = params.marks_wrong_by_marks;
    if (byMarks && typeof byMarks === 'object' && !Array.isArray(byMarks)) {
      const declared = (byMarks as Record<string, unknown>)[String(item.marks)];
      if (typeof declared === 'number' && Number.isFinite(declared)) {
        // Contract stores SIGNED marks_wrong; MarkingScheme carries a
        // positive magnitude the scorer negates. See the sign-convention
        // note in src/exams/marking-constants.ts.
        return { negative_marks_per_wrong: Math.abs(declared) };
      }
    }
    const divisor = numberAt(params, 'marks_wrong_fallback_divisor');
    if (divisor !== undefined && divisor !== 0) {
      return { negative_marks_per_wrong: item.marks / divisor };
    }
    return undefined;
  }

  if (item.kind === 'msq') {
    const marksWrong = numberAt(params, 'marks_wrong');
    if (marksWrong !== undefined && marksWrong !== 0) {
      throw new Error(
        `marking strategy 'gate_2026' cannot apply MSQ negative marking ` +
        `(params.marks_wrong = ${marksWrong}, required: 0); it grades MSQ full-or-nothing ` +
        `with no penalty. An exam that penalises a wrong MSQ needs its own registered strategy.`,
      );
    }
    // partial_credit: true is a REFUSAL downstream, deliberately — the
    // scorer throws rather than grading full-or-nothing under a scheme
    // that claims partial credit. Passed through unchanged.
    return params.partial_credit === true ? { partial_credit: true } : undefined;
  }

  // Numeric answers. The accepted band lives on the ITEM (answerRange);
  // the only param is the boundary tolerance, which this strategy applies
  // from the compiled contract. A contract asking for a different
  // tolerance is describing arithmetic this strategy does not implement,
  // so it is refused by name rather than graded on the compiled value.
  const epsilon = numberAt(params, 'tolerance_epsilon');
  if (epsilon !== undefined && epsilon !== NAT_EPSILON_IN_USE) {
    throw new Error(
      `marking strategy 'gate_2026' applies a fixed numeric tolerance of ${NAT_EPSILON_IN_USE} ` +
      `(params.tolerance_epsilon = ${epsilon}); a contract needing a different tolerance ` +
      `needs its own registered strategy.`,
    );
  }
  const marksWrong = numberAt(params, 'marks_wrong');
  if (marksWrong !== undefined && marksWrong !== 0) {
    throw new Error(
      `marking strategy 'gate_2026' cannot apply negative marking to a numeric answer ` +
      `(params.marks_wrong = ${marksWrong}, required: 0). An exam that penalises a wrong ` +
      `numeric answer needs its own registered strategy.`,
    );
  }
  return undefined;
}

export const deterministicMarkingStrategy: MarkingStrategy = {
  id: 'gate_2026',
  description:
    'MCQ: negative marking scaled by the item mark value. MSQ: full marks on an exact ' +
    'set match, otherwise zero, never negative. Numeric: full marks inside the accepted ' +
    'tolerance band, otherwise zero, never negative.',
  supportedKinds: SUPPORTED_KINDS,

  async grade(item, response, params) {
    if (!SUPPORTED_KINDS.includes(item.kind as (typeof SUPPORTED_KINDS)[number])) {
      throw new Error(
        `marking strategy 'gate_2026' does not grade question kind '${item.kind}'; ` +
        `supported: ${SUPPORTED_KINDS.join(', ')}`,
      );
    }
    const scheme = schemeFromParams(item, params);
    return _scorer.grade(item as GateItem, response as GateResponse, scheme);
  },
};

/** Register every strategy this build ships with. Idempotent. */
export function registerBuiltInMarkingStrategies(): void {
  registerMarkingStrategy(deterministicMarkingStrategy);
}

registerBuiltInMarkingStrategies();
