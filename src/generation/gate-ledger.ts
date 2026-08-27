/**
 * src/generation/gate-ledger.ts — W1.3, the quality-gate ledger's read/write
 * layer over migration 055's `content_gate_ledger`.
 *
 * Three responsibilities, deliberately separated:
 *
 *   1. `evaluateAutomatedGates()` — a PURE function from an assembled item
 *      plus its verification evidence to the four mechanical gate verdicts
 *      plus the `mathematics` gate opened as 'pending'. No DB, no clock, no
 *      network: the same input always produces the same verdicts, which is
 *      what makes the ledger auditable rather than anecdotal.
 *   2. `recordGates()` / `decideGate()` — the writers, on the shared pool.
 *   3. `gatesSatisfiedItemIds()` — the ENFORCEMENT read used at the two
 *      seams where a generated item becomes real (promotion + DB serving).
 *
 * ── The one rule that is not negotiable ──────────────────────────────────
 *
 * The `mathematics` gate is NEVER auto-passed. `evaluateAutomatedGates`
 * emits it as 'pending' with the verification cascade's result written into
 * `reason` as EVIDENCE, and nothing in this module can move it: `decideGate`
 * is the only path to 'passed'/'failed' on that gate and it requires an
 * operator id. That is the plan's `automatic_release_forbidden_for` rule
 * for answer keys, expressed as a code path rather than a convention.
 *
 * ── Scope (plan E8) ──────────────────────────────────────────────────────
 *
 * Everything here is scoped to items carrying `generation_run_id`
 * provenance. Callers pass only such ids into `gatesSatisfiedItemIds`; the
 * file-catalog read path never calls into this module at all, so the 505
 * committed items and the PYQ bank are untouched and the DB-less demo (no
 * pool, no ledger, no generated-item serving) is unchanged.
 *
 * ── Failure posture ──────────────────────────────────────────────────────
 *
 * Writes are best-effort: a ledger write failing must not lose a generated
 * item that the pipeline otherwise verified. Reads fail CLOSED: if we
 * cannot establish that an item's five gates passed, the item is not
 * servable and not promotable. Fail-closed applies only to provenance-
 * carrying ids, which is exactly why the caller — not this module — decides
 * which ids are in scope.
 */

import crypto from 'crypto';
import type pg from 'pg';
import { getSharedPool } from '../storage/pool';
import { CONCEPT_MAP } from '../constants/concept-graph';
import { EVIDENCE_LEVELS, type AuthoredItem } from '../scoring/learning-object-catalog-file';

// ============================================================================
// Locked vocabulary
// ============================================================================

/**
 * The five named gates, in the order an operator reads them. Closed set —
 * migration 055's CHECK constraint holds the same list, and adding a sixth
 * gate is a migration plus a change here, never one or the other.
 */
export const CONTENT_GATES = [
  'scope',
  'mathematics',
  'assessment_contract',
  'misconception_coverage',
  'provenance',
] as const;
export type ContentGate = (typeof CONTENT_GATES)[number];

export const GATE_STATUSES = ['pending', 'passed', 'failed', 'waived'] as const;
export type GateStatus = (typeof GATE_STATUSES)[number];

/** The two statuses that let an item through the promotion / serving check. */
const SATISFIED: ReadonlySet<GateStatus> = new Set<GateStatus>(['passed', 'waived']);

/**
 * The gates a human must decide. Everything else is a mechanical property
 * of the row and is written by the pipeline. Kept as a set (not a single
 * constant) because marking rules and canonical definitions join answer
 * keys under the same plan rule if they ever get their own gate.
 */
export const OPERATOR_DECIDED_GATES: ReadonlySet<ContentGate> = new Set<ContentGate>(['mathematics']);

export interface GateVerdict {
  gate: ContentGate;
  status: GateStatus;
  /** D8 precision: names the thing, the actual, and the required. */
  reason: string;
}

export interface GateLedgerRow {
  id: string;
  generation_run_id: string;
  item_id: string | null;
  gate: ContentGate;
  status: GateStatus;
  reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

// ============================================================================
// 1. Automated gate evaluation (pure)
// ============================================================================

/** The verification cascade's result for one item, as evidence — not as a verdict. */
export interface VerificationEvidence {
  /** Did the cascade agree with the authored key? */
  agreed: boolean;
  /** 'wolfram_verified' | 'dual_model_consensus' | whatever the path was. */
  method?: string;
  /** The cascade's own words (batch-dispatch's `reason`). */
  detail?: string;
}

export interface AutomatedGateInput {
  item: AuthoredItem;
  verification: VerificationEvidence;
  /** The run's `require_failure_tags` setting — off means mcq tags are advisory. */
  requireFailureTags: boolean;
  /** The assessment-contract id the run graded against, when one was resolved. */
  contractVersion?: string | null;
}

const NEEDS_ANSWER_FIELD: Record<string, keyof AuthoredItem> = {
  mcq: 'answer_index',
  msq: 'answer_indices',
  nat: 'answer_range',
};

/**
 * The four mechanical gates plus `mathematics` opened as 'pending'.
 *
 * Pure. Every reason string names the identifier and the number, per plan
 * D8 — "item pi-eigenvalues-3f2a: 2 of 3 distractors missing failure_tag",
 * never "not enough tags".
 */
export function evaluateAutomatedGates(input: AutomatedGateInput): GateVerdict[] {
  const { item, verification, requireFailureTags, contractVersion } = input;
  const id = item.id;
  const out: GateVerdict[] = [];

  // ── scope ──────────────────────────────────────────────────────────────
  const concept = CONCEPT_MAP.get(item.concept_id);
  if (!concept) {
    out.push({
      gate: 'scope',
      status: 'failed',
      reason: `item ${id}: concept_id '${item.concept_id}' is not in the concept graph (${CONCEPT_MAP.size} known concepts) — cannot place this item in the syllabus`,
    });
  } else if (item.topic && item.topic !== concept.topic) {
    out.push({
      gate: 'scope',
      status: 'failed',
      reason: `item ${id}: topic '${item.topic}' does not match concept '${item.concept_id}' whose topic is '${concept.topic}'`,
    });
  } else {
    out.push({
      gate: 'scope',
      status: 'passed',
      reason: `item ${id}: concept '${item.concept_id}' resolves in the concept graph under topic '${concept.topic}'`,
    });
  }

  // ── mathematics ────────────────────────────────────────────────────────
  // NEVER auto-passed. The cascade's agreement is evidence written into
  // `reason`; the verdict is an operator's to make (plan
  // automatic_release_forbidden_for: answer keys).
  const evidence = verification.agreed
    ? `verification cascade AGREED via ${verification.method ?? 'unknown method'}${verification.detail ? ` (${verification.detail})` : ''}`
    : `verification cascade DID NOT agree via ${verification.method ?? 'unknown method'}${verification.detail ? ` (${verification.detail})` : ''}`;
  out.push({
    gate: 'mathematics',
    status: 'pending',
    reason: `item ${id}: answer key awaiting operator approval — ${evidence}. Evidence is not a verdict; decide at /admin/review-queue.`,
  });

  // ── assessment_contract ────────────────────────────────────────────────
  const kind = item.question_type;
  const answerField = kind ? NEEDS_ANSWER_FIELD[kind] : undefined;
  const missing: string[] = [];
  if (!kind || !answerField) missing.push(`question_type (got ${kind === undefined ? 'undefined' : `'${kind}'`}, need one of mcq/msq/nat)`);
  if (typeof item.marks !== 'number' || !(item.marks > 0)) missing.push(`marks (got ${String(item.marks)}, need a positive number)`);
  if (answerField && item[answerField] == null) missing.push(`${String(answerField)} (required for question_type '${kind}')`);
  if (!contractVersion) missing.push('contract_version (no assessment_contract row resolved for this run)');
  out.push(
    missing.length === 0
      ? {
          gate: 'assessment_contract',
          status: 'passed',
          reason: `item ${id}: gradable as '${kind}' for ${item.marks} marks under contract '${contractVersion}'`,
        }
      : {
          gate: 'assessment_contract',
          status: 'failed',
          reason: `item ${id}: not gradable — missing ${missing.length} of 4 required marking facts: ${missing.join('; ')}`,
        },
  );

  // ── misconception_coverage ─────────────────────────────────────────────
  if (kind !== 'mcq') {
    out.push({
      gate: 'misconception_coverage',
      status: 'passed',
      reason: `item ${id}: not applicable — question_type '${kind ?? 'unset'}' has no distractor list to hypothesise about`,
    });
  } else {
    const options = item.options ?? [];
    const tags = item.distractor_failure_tags ?? {};
    const untagged = options
      .map((_, i) => i)
      .filter((i) => i !== item.answer_index && !(i in tags));
    const distractorCount = Math.max(0, options.length - 1);
    if (untagged.length === 0 && distractorCount > 0) {
      out.push({
        gate: 'misconception_coverage',
        status: 'passed',
        reason: `item ${id}: all ${distractorCount} distractors name a failure hypothesis`,
      });
    } else if (requireFailureTags) {
      out.push({
        gate: 'misconception_coverage',
        status: 'failed',
        reason: `item ${id}: ${untagged.length} of ${distractorCount} distractors missing failure_tag (untagged option indices: ${untagged.join(', ') || 'none'}) and this run set require_failure_tags`,
      });
    } else {
      // Off by default, per PracticeItemSpec.require_failure_tags. The gate
      // was not ENFORCED for this run, and 'waived' says exactly that —
      // with the untagged count in `reason` so the waiver is legible rather
      // than a silent pass. Deliberately not 'pending': pending is a queue
      // an operator must drain, and there is no surface (and no plan) for
      // draining a gate the run never asked to enforce. Turning
      // require_failure_tags on — which wave-1 runs do — is what makes this
      // a real verdict.
      out.push({
        gate: 'misconception_coverage',
        status: 'waived',
        reason: `item ${id}: ${untagged.length} of ${distractorCount} distractors missing failure_tag (untagged option indices: ${untagged.join(', ') || 'none'}); this run did not set require_failure_tags, so the gate was not enforced`,
      });
    }
  }

  // ── provenance ─────────────────────────────────────────────────────────
  const provenanceMissing: string[] = [];
  if (!item.generation_run_id) provenanceMissing.push('generation_run_id (the run that produced this item)');
  const level = item.evidence_level;
  if (!level) provenanceMissing.push(`evidence_level (need one of ${EVIDENCE_LEVELS.join('/')})`);
  else if (!(EVIDENCE_LEVELS as readonly string[]).includes(level)) {
    provenanceMissing.push(`evidence_level (got '${level}', need one of ${EVIDENCE_LEVELS.join('/')})`);
  }
  out.push(
    provenanceMissing.length === 0
      ? {
          gate: 'provenance',
          status: 'passed',
          reason: `item ${id}: run '${item.generation_run_id}', evidence_level '${level}'`,
        }
      : {
          gate: 'provenance',
          status: 'failed',
          reason: `item ${id}: missing ${provenanceMissing.length} of 2 provenance facts: ${provenanceMissing.join('; ')}`,
        },
  );

  return out;
}

// ============================================================================
// 2. Writers
// ============================================================================

/** Deterministic row id so an upsert of the same gate is a genuine update. */
export function gateLedgerRowId(runId: string, itemId: string | null, gate: ContentGate): string {
  const basis = `${runId} ${itemId ?? ''} ${gate}`;
  return `gl-${crypto.createHash('sha256').update(basis).digest('hex').slice(0, 16)}`;
}

function poolOrNull(pool?: pg.Pool | null): pg.Pool | null {
  return pool ?? getSharedPool();
}

export interface RecordGatesInput {
  generation_run_id: string;
  item_id: string | null;
  verdicts: ReadonlyArray<GateVerdict>;
}

/**
 * Upsert automated gate verdicts. Best-effort: returns the number of rows
 * written, or 0 when there is no pool (DB-less) or the write failed. A
 * ledger write must never take down the pipeline that produced the item —
 * the item is still on disk either way, and an unwritten ledger row means
 * "not gated", which fails CLOSED at the enforcement seams.
 *
 * REFUSES to write 'passed' on an operator-decided gate. That is not a
 * caller-error to be tolerated: the whole point of the table is that this
 * path cannot produce an approved answer key.
 */
export async function recordGates(input: RecordGatesInput, pool?: pg.Pool | null): Promise<number> {
  // The refusal is checked BEFORE the pool, deliberately. It is a contract
  // about what this function may ever write, not a property of whether a
  // database happens to be reachable — a caller that only ever runs
  // DB-less must still find out it is doing something forbidden.
  const forbidden = input.verdicts.filter(
    (v) => OPERATOR_DECIDED_GATES.has(v.gate) && (v.status === 'passed' || v.status === 'failed'),
  );
  if (forbidden.length > 0) {
    throw new Error(
      `gate-ledger: refusing to auto-record ${forbidden.map((v) => `'${v.gate}'='${v.status}'`).join(', ')} — ` +
        `gate(s) ${[...OPERATOR_DECIDED_GATES].join(', ')} require an operator decision (decideGate with decided_by)`,
    );
  }
  const p = poolOrNull(pool);
  if (!p) return 0;
  let written = 0;
  for (const v of input.verdicts) {
    try {
      await p.query(
        `INSERT INTO content_gate_ledger (id, generation_run_id, item_id, gate, status, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           reason = EXCLUDED.reason`,
        [gateLedgerRowId(input.generation_run_id, input.item_id, v.gate), input.generation_run_id, input.item_id, v.gate, v.status, v.reason],
      );
      written++;
    } catch (err) {
      console.error(
        `[gate-ledger] failed to record gate '${v.gate}' for item '${input.item_id ?? '(run-level)'}' in run '${input.generation_run_id}': ${(err as Error).message}`,
      );
    }
  }
  return written;
}

export interface DecideGateInput {
  generation_run_id: string;
  item_id: string;
  gate: ContentGate;
  status: GateStatus;
  reason: string;
  /** Operator id from the authenticated admin. Required — an anonymous approval is not an approval. */
  decided_by: string;
}

/**
 * The ONLY path to a decided verdict on an operator-decided gate. Stamps
 * `decided_by` + `decided_at` so an approval is always attributable.
 * Throws (rather than returning false) on a missing operator id — a caller
 * that reached here without one has a bug the route must surface, not
 * swallow.
 */
export async function decideGate(input: DecideGateInput, pool?: pg.Pool | null): Promise<boolean> {
  if (!input.decided_by) {
    throw new Error(`gate-ledger: decideGate for item '${input.item_id}' gate '${input.gate}' requires decided_by (operator id), got empty`);
  }
  const p = poolOrNull(pool);
  if (!p) return false;
  await p.query(
    `INSERT INTO content_gate_ledger (id, generation_run_id, item_id, gate, status, reason, decided_by, decided_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       reason = EXCLUDED.reason,
       decided_by = EXCLUDED.decided_by,
       decided_at = now()`,
    [
      gateLedgerRowId(input.generation_run_id, input.item_id, input.gate),
      input.generation_run_id,
      input.item_id,
      input.gate,
      input.status,
      input.reason,
      input.decided_by,
    ],
  );
  return true;
}

// ============================================================================
// 3. Reads
// ============================================================================

/** Every ledger row for the given items, newest-decided first within an item. */
export async function gateRowsForItems(itemIds: ReadonlyArray<string>, pool?: pg.Pool | null): Promise<GateLedgerRow[]> {
  const p = poolOrNull(pool);
  if (!p || itemIds.length === 0) return [];
  try {
    const { rows } = await p.query<GateLedgerRow>(
      `SELECT id, generation_run_id, item_id, gate, status, reason, decided_by, decided_at, created_at
         FROM content_gate_ledger
        WHERE item_id = ANY($1::TEXT[])
        ORDER BY item_id, gate`,
      [[...itemIds]],
    );
    return rows;
  } catch (err) {
    console.error(`[gate-ledger] gateRowsForItems failed for ${itemIds.length} item(s): ${(err as Error).message}`);
    return [];
  }
}

export interface ListGatesQuery {
  generation_run_id?: string;
  gate?: ContentGate;
  status?: GateStatus;
  limit?: number;
}

/** The review queue's listing read. Item-level rows only (`item_id IS NOT NULL`). */
export async function listGateRows(q: ListGatesQuery, pool?: pg.Pool | null): Promise<GateLedgerRow[]> {
  const p = poolOrNull(pool);
  if (!p) return [];
  const where: string[] = ['item_id IS NOT NULL'];
  const params: unknown[] = [];
  if (q.generation_run_id) { params.push(q.generation_run_id); where.push(`generation_run_id = $${params.length}`); }
  if (q.gate) { params.push(q.gate); where.push(`gate = $${params.length}`); }
  if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
  params.push(Math.max(1, Math.min(500, q.limit ?? 100)));
  const { rows } = await p.query<GateLedgerRow>(
    `SELECT id, generation_run_id, item_id, gate, status, reason, decided_by, decided_at, created_at
       FROM content_gate_ledger
      WHERE ${where.join(' AND ')}
      ORDER BY created_at ASC
      LIMIT $${params.length}`,
    params,
  );
  return rows;
}

/**
 * ENFORCEMENT (plan E8). Of `itemIds` — which the CALLER has already
 * established carry `generation_run_id` provenance — returns the subset
 * whose five gates are ALL passed-or-waived.
 *
 * Fails CLOSED: an unreachable table, a missing migration, a transient
 * error, or simply no ledger rows at all all produce "not satisfied", and
 * the caller must then not serve / not promote. That is the correct
 * asymmetry: an item with no gate record has not passed a gate, and the
 * cost of a false negative (a generated item stays invisible until its
 * ledger is written) is nothing next to the cost of a false positive (an
 * unreviewed answer key reaches a student).
 *
 * Passing an empty list is free — no query, empty set.
 */
export async function gatesSatisfiedItemIds(
  itemIds: ReadonlyArray<string>,
  pool?: pg.Pool | null,
): Promise<Set<string>> {
  const out = new Set<string>();
  const p = poolOrNull(pool);
  if (!p || itemIds.length === 0) {
    if (!p && itemIds.length > 0) {
      console.warn(
        `[gate-ledger] no database pool: ${itemIds.length} item(s) with generation_run_id provenance cannot be gate-checked and are therefore not servable/promotable (plan E8 fails closed)`,
      );
    }
    return out;
  }
  try {
    const { rows } = await p.query<{ item_id: string; satisfied: string }>(
      `SELECT item_id, COUNT(DISTINCT gate) AS satisfied
         FROM content_gate_ledger
        WHERE item_id = ANY($1::TEXT[])
          AND status IN ('passed','waived')
        GROUP BY item_id`,
      [[...itemIds]],
    );
    for (const r of rows) {
      if (Number(r.satisfied) === CONTENT_GATES.length) out.add(r.item_id);
    }
    const blocked = itemIds.filter((id) => !out.has(id));
    if (blocked.length > 0) {
      console.warn(
        `[gate-ledger] ${blocked.length} of ${itemIds.length} provenance-carrying item(s) blocked: ` +
          `fewer than ${CONTENT_GATES.length} of ${CONTENT_GATES.length} gates passed-or-waived ` +
          `(gates: ${CONTENT_GATES.join(', ')}). Blocked ids: ${blocked.slice(0, 10).join(', ')}` +
          `${blocked.length > 10 ? ` … and ${blocked.length - 10} more` : ''}. ` +
          `Review at /admin/review-queue.`,
      );
    }
    return out;
  } catch (err) {
    console.error(
      `[gate-ledger] gate check FAILED for ${itemIds.length} provenance-carrying item(s) — ` +
        `refusing all of them rather than serving ungated content: ${(err as Error).message}`,
    );
    return new Set<string>();
  }
}
