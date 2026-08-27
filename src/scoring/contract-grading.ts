/**
 * src/scoring/contract-grading.ts — grade under a PINNED contract snapshot
 * (plan E7), or exactly as before when there is no snapshot.
 *
 * ── The problem this closes ──────────────────────────────────────────────
 *
 * `assessment_contracts` (migration 050) exists so a marking scheme can be
 * corrected without a deploy, and so an attempt scored last year stays
 * scored under last year's rules. Both of those become false the moment
 * grading RESOLVES the contract at submit time: a student starts a mock
 * exam under one scheme, an operator corrects the row eight minutes later,
 * and the paper they were halfway through is graded under rules that did
 * not exist when they read the instructions. Idempotent replays make it
 * worse — the "same" submission would grade differently depending on when
 * the retry landed.
 *
 * So the contract is resolved ONCE, at session creation, and snapshotted
 * onto the row (`contract_version` + `contract_params`, migration 052).
 * Grading reads the snapshot. This module is the reader.
 *
 * ── Legacy rows grade byte-identically ───────────────────────────────────
 *
 * `makeContractGrader(null)` — which is what every row created before
 * migration 052 produces — returns a grader that calls
 * `GateDeterministicScorer.grade(item, response)` with NO scheme override:
 * the exact call the quiz and mock paths made before this module existed.
 * Not "equivalent numbers"; the same call. That is what makes "legacy rows
 * are untouched" a fact rather than a hope.
 *
 * ── Refusals name the thing (plan D8) ────────────────────────────────────
 *
 * A snapshot that describes rules this build cannot apply is a refusal,
 * never a quiet fallback to compiled defaults:
 *
 *   - unregistered strategy →
 *     "marking_strategy 'jee_adv_2027' is not registered; known: gate_2026"
 *   - no entry for the kind →
 *     "assessment contract 'gate-2026' has no marking for question kind
 *      'msq'; it defines: mcq, nat"
 *
 * Both throw. Every caller already treats a grading throw as a refusal it
 * must surface (quiz and mock both revert their submission claim and
 * return an error), so the student sees "we could not grade this" instead
 * of a mark computed under rules nobody chose.
 */

import type { GradeResult } from '../core/interfaces';
import type { ResolvedAssessmentContract } from '../exams/assessment-contract-loader';
import {
  makeDeterministicScorer,
  type GateItem,
  type GateResponse,
} from './deterministic-scorer';
import {
  resolveMarkingStrategy,
  unknownMarkingStrategyMessage,
  type MarkingStrategyParams,
} from './marking-strategy';

/**
 * The persisted shape of `mock_exams.contract_params` /
 * `quiz_sessions.contract_params`, paired with the row's
 * `contract_version`. Deliberately structural rather than an import of
 * `ResolvedAssessmentContract`: this is read back out of JSONB written
 * possibly months ago, so it is validated on the way in, not trusted.
 */
export interface ContractSnapshot {
  version: string;
  marking: Record<string, { strategy: string; params?: MarkingStrategyParams }>;
}

/**
 * Parse a persisted snapshot. Returns null when the row carries none (a
 * legacy pre-052 row) or when what it carries is not usable — a
 * half-written blob grades as legacy rather than throwing, because a row
 * whose snapshot is unreadable is exactly a row with no snapshot.
 */
export function parseContractSnapshot(
  version: unknown,
  params: unknown,
): ContractSnapshot | null {
  if (typeof version !== 'string' || version.trim() === '') return null;
  if (params === null || params === undefined) return null;

  const raw = typeof params === 'string' ? safeParse(params) : params;
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const marking = (raw as { marking?: unknown }).marking;
  if (marking === null || typeof marking !== 'object' || Array.isArray(marking)) return null;

  const out: ContractSnapshot['marking'] = {};
  for (const [kind, entry] of Object.entries(marking as Record<string, unknown>)) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const { strategy, params: p } = entry as { strategy?: unknown; params?: unknown };
    if (typeof strategy !== 'string' || strategy.trim() === '') continue;
    out[kind] = {
      strategy,
      params: p !== null && typeof p === 'object' && !Array.isArray(p)
        ? (p as MarkingStrategyParams)
        : undefined,
    };
  }
  if (Object.keys(out).length === 0) return null;

  return { version, marking: out };
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export type ContractGrader = (item: GateItem, response: GateResponse) => Promise<GradeResult>;

/**
 * Build the grader for one session.
 *
 * `null` → the pre-E7 path, unchanged: the shared deterministic scorer
 * with no scheme override. Anything else → the registered strategy named
 * by the snapshot for that question kind, running on the snapshot's params.
 */
export function makeContractGrader(snapshot: ContractSnapshot | null): ContractGrader {
  if (!snapshot) {
    const scorer = makeDeterministicScorer();
    return (item, response) => scorer.grade(item, response);
  }

  return async (item, response) => {
    const entry = snapshot.marking[item.kind];
    if (!entry) {
      const known = Object.keys(snapshot.marking).sort().join(', ') || '(none)';
      throw new Error(
        `assessment contract '${snapshot.version}' has no marking for question kind ` +
        `'${item.kind}'; it defines: ${known}`,
      );
    }
    const strategy = resolveMarkingStrategy(entry.strategy);
    if (!strategy) throw new Error(unknownMarkingStrategyMessage(entry.strategy));
    return strategy.grade(item, response, entry.params);
  };
}

// ============================================================================
// Version resolution — the E7 creation-time helper
// ============================================================================

/**
 * The shape persisted to `mock_exams.contract_params` /
 * `quiz_sessions.contract_params` (migration 052) alongside
 * `contract_version`. Matches exactly what `parseContractSnapshot` reads
 * back out — the round trip is: resolve once at creation
 * (`snapshotForCreation`), persist both columns verbatim, read them back at
 * grade time (`parseContractSnapshot`), grade from the snapshot
 * (`makeContractGrader`). No step re-resolves the contract.
 */
export interface ContractCreationSnapshot {
  version: string;
  params: { marking: ContractSnapshot['marking'] };
}

/**
 * Turn a freshly-`resolveAssessmentContract()`-ed contract into the pair a
 * caller persists at session creation. Pure and synchronous — resolution
 * (the DB read / compiled fallback) already happened in the loader; this
 * only reshapes the result into the persisted column shape, dropping
 * fields the snapshot doesn't need (`official_source_url`, `verified_at`,
 * `source`, `fallback_reason` all describe PROVENANCE of the row the
 * contract came from, not the marking rules themselves — `contract_version`
 * alone is the provenance stamp a graded attempt needs).
 */
export function snapshotForCreation(
  resolved: ResolvedAssessmentContract,
): ContractCreationSnapshot {
  const marking: ContractSnapshot['marking'] = {};
  for (const [kind, entry] of Object.entries(resolved.marking)) {
    marking[kind] = { strategy: entry.strategy, params: entry.params as MarkingStrategyParams };
  }
  return { version: resolved.version, params: { marking } };
}
