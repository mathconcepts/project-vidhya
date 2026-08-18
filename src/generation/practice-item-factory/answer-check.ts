/**
 * src/generation/practice-item-factory/answer-check.ts — dual-model
 * answer-key check CONTRACT for non-numeric (mcq/msq) items (ENG-D4 item
 * 8, outside-voice amendment 4).
 *
 * `compareMathAtoms` (multi-llm-consensus.ts) is NOT reusable as a gate
 * here: it FAILS OPEN (`agreed: true`) for anything outside
 * worked_example/formal_definition, and disagreement never blocks by
 * design — the atom pipeline ships both versions and lets an admin pick.
 * A practice item has no admin-diff step; an unresolved disagreement here
 * must refuse the item outright.
 *
 * Two layers:
 *   - `checkAnswerAgreement` — PURE comparison of an already-obtained
 *     secondary answer against the item's primary answer key. Reuses
 *     `normaliseAnswer` from multi-llm-consensus.ts so this never drifts
 *     onto a second, slightly-different equality rule.
 *   - `runDualLegAnswerCheck` — the live two-leg orchestration wrapper.
 *     Takes an INJECTED `solveSecondary` callable so tests supply
 *     fixtures; production wiring (a follow-up, not part of this task)
 *     builds that callable from a model id resolved via
 *     `resolveDistinctSecondaryModel`, which reuses the orchestrator's
 *     existing `pickConsensusSecondary` / `consensusProvidersAreDistinct`
 *     provider-routing rather than re-deriving it.
 *
 * Fail-closed by construction: no second leg, a failed second leg, or a
 * disagreeing second leg all REFUSE the item. The atom path's
 * ship-anyway-on-single-leg fallback is explicitly not acceptable here.
 */

import { normaliseAnswer } from '../../content/concept-orchestrator/multi-llm-consensus';
import type { PracticeItemFormat } from './types';

export interface AnswerCheckResult {
  agreed: boolean;
  reason: string;
}

/** True iff `raw[i..]` starts with the word "and" at a token boundary (not inside a longer word). */
function isWordBoundaryAnd(raw: string, i: number): boolean {
  if (raw.slice(i, i + 3).toLowerCase() !== 'and') return false;
  const before = i === 0 ? ' ' : raw[i - 1];
  const after = raw[i + 3] ?? ' ';
  return /\s/.test(before) && /\s/.test(after);
}

/**
 * Split a free-text msq answer into its constituent answers on comma /
 * semicolon / the word "and" — but NOT inside parentheses or brackets.
 * Coordinate-pair answers like "(1, -3)" (exactly the format the shipped
 * orthogonality item uses) contain their own internal comma; a naive
 * `split(/,/)` shreds them into "(1" and "-3)". Depth-tracking avoids
 * that without requiring the model to use an unusual separator.
 */
function extractAnswerSet(raw: string): Set<string> {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  const flush = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) parts.push(trimmed);
    current = '';
  };

  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);

    if (depth === 0 && (ch === ',' || ch === ';')) {
      flush();
      i++;
      continue;
    }
    if (depth === 0 && isWordBoundaryAnd(raw, i)) {
      flush();
      i += 3;
      continue;
    }
    current += ch;
    i++;
  }
  flush();

  return new Set(parts.map(normaliseAnswer));
}

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Pure comparison. `primaryAnswer` is the item's already-derived answer
 * key — a single string for mcq/nat, an array of correct-answer strings
 * for msq. `secondaryRawAnswer` is the second leg's free-text answer.
 */
export function checkAnswerAgreement(
  format: PracticeItemFormat,
  primaryAnswer: string | string[],
  secondaryRawAnswer: string,
): AnswerCheckResult {
  if (format === 'msq') {
    const primarySet = new Set(
      (Array.isArray(primaryAnswer) ? primaryAnswer : [primaryAnswer]).map(normaliseAnswer),
    );
    const secondarySet = extractAnswerSet(secondaryRawAnswer);
    const agreed = setsEqual(primarySet, secondarySet);
    return {
      agreed,
      reason: agreed
        ? 'msq answer sets match'
        : `msq answer sets differ: primary={${[...primarySet].join(', ')}} secondary={${[...secondarySet].join(', ')}}`,
    };
  }

  const primary = Array.isArray(primaryAnswer) ? (primaryAnswer[0] ?? '') : primaryAnswer;
  const a = normaliseAnswer(primary);
  const b = normaliseAnswer(secondaryRawAnswer);
  const agreed = a === b;
  return {
    agreed,
    reason: agreed
      ? `answers match: ${primary}`
      : `answers differ: primary="${primary}" secondary="${secondaryRawAnswer}"`,
  };
}

/** Injectable so production wiring can point this at a real, distinct-provider model. */
export type SolveFn = (prompt: string) => Promise<string>;

export interface DualLegCheckResult {
  refused: boolean;
  reason: string;
  agreement?: AnswerCheckResult;
}

/**
 * Runs the two-leg check for one assembled item. Fail-closed: a missing
 * `solveSecondary` (no distinct second provider available), a thrown
 * second-leg call, or a disagreeing second leg all refuse.
 */
export async function runDualLegAnswerCheck(args: {
  format: PracticeItemFormat;
  primaryAnswer: string | string[];
  verificationPrompt: string;
  solveSecondary: SolveFn | null;
}): Promise<DualLegCheckResult> {
  if (!args.solveSecondary) {
    return {
      refused: true,
      reason: 'no second distinct-provider leg available — refusing rather than shipping unverified (fail-closed)',
    };
  }

  let secondaryRaw: string;
  try {
    secondaryRaw = await args.solveSecondary(args.verificationPrompt);
  } catch (err) {
    return { refused: true, reason: `secondary leg failed: ${(err as Error).message}` };
  }

  const agreement = checkAnswerAgreement(args.format, args.primaryAnswer, secondaryRaw);
  return { refused: !agreement.agreed, reason: agreement.reason, agreement };
}

/**
 * Resolves which model id the second leg should use, reusing the SAME
 * provider-routing machinery the atom pipeline uses rather than
 * re-deriving it. Dynamic import keeps this module's common (pure,
 * fixture-tested) path free of the heavier orchestrator's load-time cost
 * — this function is only called by the live wiring path.
 * Returns null when no distinct-provider secondary is available; callers
 * MUST treat that as "refuse the item" (see runDualLegAnswerCheck).
 */
export async function resolveDistinctSecondaryModel(primaryModelId: string): Promise<string | null> {
  const { pickConsensusSecondary, consensusProvidersAreDistinct } = await import(
    '../../content/concept-orchestrator/orchestrator'
  );
  const secondary = await pickConsensusSecondary(primaryModelId);
  if (!secondary) return null;
  const distinct = await consensusProvidersAreDistinct(primaryModelId, secondary);
  return distinct ? secondary : null;
}
