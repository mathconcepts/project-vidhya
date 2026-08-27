/**
 * src/exams/assessment-contract-loader.ts — resolve the marking contract
 * for a (exam, paper, year), plan W1.1.
 *
 * Lives beside `src/curriculum/exam-loader.ts` in spirit and copies its
 * shape deliberately: a short-lived (60s) in-process cache over a DB read,
 * with a compiled/YAML view underneath that answers correctly when the
 * database is absent. Same TTL, same "never crash the caller" posture.
 * Sitting in `src/exams/` (not `src/scoring/`) for the reason
 * `marking-constants.ts` documents — `src/scoring/` is an engine directory
 * that `scripts/fork-test-lint.mjs` polices for exam-name literals.
 *
 * ── Resolution order ─────────────────────────────────────────────────────
 *
 *   1. A database row for the key, IF it is present AND passes validation.
 *   2. Otherwise the compiled contract from `./marking-constants.ts`, with
 *      a `console.warn` naming why.
 *
 * ── Honesty (plan E6) ────────────────────────────────────────────────────
 *
 * The resolved contract carries a `version` and a `source`, and they tell
 * the truth about which branch ran:
 *
 *   DB row     → version `gate-2026`,          source `db`
 *   compiled   → version `gate-2026+compiled`, source `compiled`
 *
 * The `+compiled` suffix exists so that anything which stamps a contract
 * version onto a graded attempt records not just WHICH rules applied but
 * whether a row was actually read. A DB-less demo deploy grades correctly
 * and says so; it does not claim a row it never saw. (Persisting that
 * stamp at session creation is plan E7 — a separate follow-up. This module
 * only resolves; it stores nothing.)
 *
 * ── Refusals ─────────────────────────────────────────────────────────────
 *
 * `resolveAssessmentContract()` NEVER throws. It is on a read path that
 * grading depends on, and an exception there would turn a bad row into a
 * failed submission. Every failure mode — no DATABASE_URL, unreachable
 * database, missing table, no row, malformed `marking` — degrades to the
 * compiled contract with a warn line that names the key and the reason.
 *
 * An unregistered `strategy` id is the ONE thing this module does not
 * paper over, and it is not papered over here either: the loader returns
 * the id it read, and `resolveMarkingStrategy()` in
 * `src/scoring/marking-strategy.ts` refuses it by name. Guessing at an
 * algorithm nobody registered would grade a student under invented rules.
 */

import type pg from 'pg';
import { getSharedPool } from '../storage/pool';
import {
  COMPILED_ASSESSMENT_CONTRACT,
  COMPILED_CONTRACT_KEY,
  COMPILED_CONTRACT_VERSION,
  DB_CONTRACT_VERSION,
} from './marking-constants';

// ============================================================================
// Types
// ============================================================================

/** The (exam, paper, year) a contract answers for. */
export interface AssessmentContractKey {
  exam: string;
  paper: string;
  year: number;
}

/** One question type's marking, as read from the contract. */
export interface ResolvedMarkingEntry {
  /** Registered strategy id. NOT validated here — see the header. */
  strategy: string;
  params: Record<string, unknown>;
}

export interface ResolvedAssessmentContract extends AssessmentContractKey {
  /** `<exam>-<year>` from a DB row, `<exam>-<year>+compiled` otherwise. */
  version: string;
  source: 'db' | 'compiled';
  marking: Record<string, ResolvedMarkingEntry>;
  official_source_url: string | null;
  /** ISO date string, or null when the row never claimed verification. */
  verified_at: string | null;
  /**
   * Set only when `source === 'compiled'` and a DB read was attempted or
   * skipped: the human-readable reason the compiled fallback ran. Null on
   * the DB path. Surfaced so a caller can log or display it rather than
   * having to re-derive why.
   */
  fallback_reason: string | null;
}

interface ContractRow {
  exam: string;
  paper: string;
  year: number;
  marking: unknown;
  official_source_url: string | null;
  verified_at: Date | string | null;
}

// ============================================================================
// Cache — 60s TTL, matching exam-loader.ts
// ============================================================================

const CONTRACT_TTL_MS = 60_000;

const _cache = new Map<string, { contract: ResolvedAssessmentContract; expires_at: number }>();

function cacheKey(key: AssessmentContractKey): string {
  return `${key.exam}:${key.paper}:${key.year}`;
}

/** Test-only: drop every cached contract. */
export function __resetAssessmentContractCacheForTests(): void {
  _cache.clear();
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Is this a usable `marking` blob? Deliberately structural, not semantic:
 * it checks that every question type names a non-empty strategy string and
 * carries a params object. It does NOT check that the strategy is
 * registered (that refusal belongs to the registry, which can name the
 * known ids) and does NOT check the params against a strategy's schema
 * (that belongs to the strategy, which knows its own params).
 *
 * Returns null when valid, or the reason it is not.
 */
export function validateMarkingBlob(marking: unknown): string | null {
  if (marking === null || typeof marking !== 'object' || Array.isArray(marking)) {
    return 'marking is not a JSON object';
  }
  const kinds = Object.keys(marking as Record<string, unknown>);
  if (kinds.length === 0) return 'marking has no question types';

  for (const kind of kinds) {
    const entry = (marking as Record<string, unknown>)[kind];
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      return `marking.${kind} is not an object`;
    }
    const { strategy, params } = entry as { strategy?: unknown; params?: unknown };
    if (typeof strategy !== 'string' || strategy.trim() === '') {
      return `marking.${kind}.strategy is missing or not a non-empty string`;
    }
    if (params === null || typeof params !== 'object' || Array.isArray(params)) {
      return `marking.${kind}.params is missing or not a JSON object`;
    }
  }
  return null;
}

// ============================================================================
// Compiled fallback
// ============================================================================

/**
 * The compiled contract, shaped as a resolved one. Exported because
 * callers that have already decided not to touch the database (tests,
 * pure-function paths) should be able to get the same object without
 * awaiting a read that will fail.
 */
export function compiledAssessmentContract(reason: string | null = null): ResolvedAssessmentContract {
  const c = COMPILED_ASSESSMENT_CONTRACT;
  return {
    exam: c.exam,
    paper: c.paper,
    year: c.year,
    version: COMPILED_CONTRACT_VERSION,
    source: 'compiled',
    // Structural clone so a caller mutating the resolved contract cannot
    // corrupt the compiled constant for the rest of the process.
    marking: JSON.parse(JSON.stringify(c.marking)) as Record<string, ResolvedMarkingEntry>,
    official_source_url: c.official_source_url,
    verified_at: c.verified_at,
    fallback_reason: reason,
  };
}

/**
 * Is this key the one the compiled constant actually answers for? A
 * compiled fallback for SOME OTHER exam would be a fabrication — the
 * numbers would be this exam's, wearing another exam's name.
 */
function compiledCovers(key: AssessmentContractKey): boolean {
  return (
    key.exam === COMPILED_CONTRACT_KEY.exam &&
    key.paper === COMPILED_CONTRACT_KEY.paper &&
    key.year === COMPILED_CONTRACT_KEY.year
  );
}

// ============================================================================
// Resolution
// ============================================================================

function isoDate(v: Date | string | null): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

async function readRow(
  pool: pg.Pool,
  key: AssessmentContractKey,
): Promise<ContractRow | null> {
  const { rows } = await pool.query<ContractRow>(
    `SELECT exam, paper, year, marking, official_source_url, verified_at
       FROM assessment_contracts
      WHERE exam = $1 AND paper = $2 AND year = $3
      LIMIT 1`,
    [key.exam, key.paper, key.year],
  );
  return rows[0] ?? null;
}

/**
 * Resolve the marking contract for a key (defaults to the one the compiled
 * constant covers). Never throws — see the header.
 *
 * @param key         (exam, paper, year). Defaults to `COMPILED_CONTRACT_KEY`.
 * @param forceReload Skip the 60s cache for this call.
 */
export async function resolveAssessmentContract(
  key: AssessmentContractKey = { ...COMPILED_CONTRACT_KEY },
  forceReload = false,
): Promise<ResolvedAssessmentContract> {
  const ck = cacheKey(key);
  const now = Date.now();

  if (!forceReload) {
    const hit = _cache.get(ck);
    if (hit && hit.expires_at > now) return hit.contract;
  }

  const resolved = await resolveUncached(key);
  _cache.set(ck, { contract: resolved, expires_at: now + CONTRACT_TTL_MS });
  return resolved;
}

async function resolveUncached(key: AssessmentContractKey): Promise<ResolvedAssessmentContract> {
  const fallback = (reason: string): ResolvedAssessmentContract => {
    if (!compiledCovers(key)) {
      // No row, and the compiled constant is for a DIFFERENT exam. Handing
      // back this exam's numbers under that exam's name would be a
      // fabrication, so the contract comes back EMPTY: a caller sees no
      // marking for any question type and refuses, rather than grading a
      // JEE paper under this exam's rules.
      console.warn(
        `[assessment-contract] no contract for ${ck(key)} (${reason}); ` +
        `the compiled contract covers ${ck(COMPILED_CONTRACT_KEY)} only — returning an empty contract`,
      );
      return {
        ...key,
        version: `${key.exam}-${key.year}+compiled`,
        source: 'compiled',
        marking: {},
        official_source_url: null,
        verified_at: null,
        fallback_reason: `${reason}; no compiled contract for this key`,
      };
    }
    console.warn(`[assessment-contract] ${ck(key)}: ${reason}; using the compiled contract`);
    return compiledAssessmentContract(reason);
  };

  const pool = getSharedPool();
  if (!pool) return fallback('no DATABASE_URL');

  let row: ContractRow | null;
  try {
    row = await readRow(pool, key);
  } catch (err) {
    // Unreachable database, missing table on a pre-050 deploy, permissions
    // — all the same from here: grade from the compiled contract, say so.
    return fallback(`database read failed (${(err as Error)?.message ?? 'unknown error'})`);
  }

  if (!row) return fallback('no row for this key');

  const invalid = validateMarkingBlob(row.marking);
  if (invalid) return fallback(`row is malformed (${invalid})`);

  return {
    exam: row.exam,
    paper: row.paper,
    year: row.year,
    version:
      compiledCovers(key) ? DB_CONTRACT_VERSION : `${row.exam}-${row.year}`,
    source: 'db',
    marking: row.marking as Record<string, ResolvedMarkingEntry>,
    official_source_url: row.official_source_url ?? null,
    verified_at: isoDate(row.verified_at),
    fallback_reason: null,
  };
}

function ck(key: AssessmentContractKey): string {
  return `${key.exam}/${key.paper}/${key.year}`;
}
