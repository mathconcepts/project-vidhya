/**
 * src/api/admin-review-queue-routes.ts — D4, the item-level review queue.
 *
 *   GET  /api/admin/review-queue?run=&status=&limit=
 *   POST /api/admin/review-queue/:itemId/decide
 *   POST /api/admin/review-queue/decide-batch
 *
 * ── Why this exists BEFORE the pilot (plan D4) ───────────────────────────
 *
 * Premise 5 names verification labor — not generation — as the inventory
 * bottleneck, and the whole 50-item anatomy pilot exists to MEASURE that
 * labor. Before this file, practice items had no approval surface at all:
 * an operator reviewed them by hand-editing JSON. A pilot run through a
 * text editor would have measured a text editor. So the queue ships first,
 * and the pilot's minutes-per-item is measured through it.
 *
 * ── What the operator decides ────────────────────────────────────────────
 *
 * Exactly one thing: the `mathematics` gate — is the ANSWER KEY right? The
 * other four gates in `content_gate_ledger` are mechanical properties the
 * batch pipeline already decided (src/generation/gate-ledger.ts). This
 * surface shows all five, because an operator judging a key needs to see
 * what else the row is or isn't, but it only ever WRITES `mathematics`.
 *
 * `approve` → passed, `reject` → failed (reason required), `needs_fix` →
 * stays 'pending' with `decided_at`/`decided_by` stamped, so the item stays
 * in the queue but visibly annotated rather than disappearing into a state
 * with no home. The list endpoint derives `needs_fix` as
 * `status === 'pending' && decided_at != null` — no sixth status, no
 * stringly-typed prefix.
 *
 * ── Where the item detail comes from ─────────────────────────────────────
 *
 * Two sources, tried in order: the `generated_problems` row (unfiltered —
 * this is the ONE surface that must see ungated items, since gating them
 * is what put them here), then the committed file banks. An item the
 * ledger names but neither source resolves is returned with
 * `source: 'unresolved'` and no detail rather than omitted: a gate row
 * pointing at nothing is a fact the operator should see.
 *
 * Auth: requireRole('admin') — same gate as every other /api/admin/* route.
 */

import { ServerResponse } from 'http';
import type pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { getSharedPool } from '../storage/pool';
import {
  CONTENT_GATES,
  decideGate,
  gateRowsForItems,
  listGateRows,
  type ContentGate,
  type GateLedgerRow,
  type GateStatus,
} from '../generation/gate-ledger';
import { loadAuthoredItemsRaw, type AuthoredItem } from '../scoring/learning-object-catalog-file';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function badRequest(res: ServerResponse, message: string): void {
  sendJSON(res, { error: 'Bad Request', message }, 400);
}

function requireDb(res: ServerResponse): pg.Pool | null {
  const pool = getSharedPool();
  if (!pool) {
    sendJSON(
      res,
      {
        error: 'DATABASE_URL not configured',
        message:
          'The review queue reads content_gate_ledger, which only exists in Postgres. A DB-less deploy generates nothing and therefore has nothing to review.',
      },
      503,
    );
    return null;
  }
  return pool;
}

// ============================================================================
// Decisions
// ============================================================================

export const REVIEW_DECISIONS = ['approve', 'reject', 'needs_fix'] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** The gate an operator decides here. Locked to one — see the header. */
export const REVIEWED_GATE: ContentGate = 'mathematics';

/** Decisions that cannot be recorded without the operator saying why. */
const REASON_REQUIRED: ReadonlySet<ReviewDecision> = new Set<ReviewDecision>(['reject']);

const DECISION_STATUS: Record<ReviewDecision, GateStatus> = {
  approve: 'passed',
  reject: 'failed',
  needs_fix: 'pending',
};

/**
 * Validate a decision request. Pure — exported so the rules are testable
 * without a server. Returns the refusal string (D8-precise: names the
 * decision, what is missing, and what is required) or null when valid.
 */
export function validateDecision(decision: unknown, notes: unknown): string | null {
  if (typeof decision !== 'string' || !(REVIEW_DECISIONS as readonly string[]).includes(decision)) {
    return `decision must be one of ${REVIEW_DECISIONS.join('/')}, got ${decision === undefined ? 'undefined' : JSON.stringify(decision)}`;
  }
  if (REASON_REQUIRED.has(decision as ReviewDecision)) {
    const trimmed = typeof notes === 'string' ? notes.trim() : '';
    if (trimmed.length === 0) {
      return `decision '${decision}' requires notes: the reason the answer key is wrong. Rejecting without a recorded reason leaves the next operator no way to fix the item.`;
    }
  }
  return null;
}

/** The `reason` string written into the ledger for a decision. */
export function decisionReason(decision: ReviewDecision, notes: string | undefined, operatorId: string): string {
  const trimmed = (notes ?? '').trim();
  const suffix = trimmed ? ` — ${trimmed}` : '';
  switch (decision) {
    case 'approve':
      return `answer key approved by operator '${operatorId}'${suffix}`;
    case 'reject':
      return `answer key rejected by operator '${operatorId}'${suffix}`;
    case 'needs_fix':
      return `answer key returned for fix by operator '${operatorId}'${suffix}`;
  }
}

// ============================================================================
// Item detail resolution
// ============================================================================

export interface ReviewItemDetail {
  source: 'generated_problems' | 'file_bank' | 'unresolved';
  concept_id?: string;
  topic?: string;
  question_type?: string | null;
  marks?: number | null;
  question_text?: string;
  options?: string[];
  answer_index?: number | null;
  answer_indices?: number[] | null;
  answer_range?: [number, number] | null;
  correct_answer?: string | null;
  solution_steps?: string[];
  distractor_failure_tags?: Record<string, string> | null;
  verification_method?: string | null;
  difficulty?: number | null;
}

function detailFromAuthored(item: AuthoredItem): ReviewItemDetail {
  return {
    source: 'file_bank',
    concept_id: item.concept_id,
    topic: item.topic,
    question_type: item.question_type ?? null,
    marks: item.marks ?? null,
    question_text: item.question_text,
    options: item.options,
    answer_index: item.answer_index ?? null,
    answer_indices: item.answer_indices ?? null,
    answer_range: item.answer_range ?? null,
    correct_answer: item.correct_answer ?? null,
    solution_steps: item.solution_steps ?? [],
    distractor_failure_tags: (item.distractor_failure_tags as Record<string, string> | undefined) ?? null,
    verification_method: item.verification_method ?? null,
    difficulty: item.difficulty ?? null,
  };
}

/**
 * Resolve detail for every item id in one pass: one `generated_problems`
 * query, one bank scan. Deliberately NOT the serving catalog — that path
 * is gate-filtered, and an item in this queue is by definition not through
 * its gates yet.
 */
export async function resolveReviewDetails(
  itemIds: ReadonlyArray<string>,
  pool: pg.Pool | null,
  loadBanks: () => AuthoredItem[] = loadAuthoredItemsRaw,
): Promise<Map<string, ReviewItemDetail>> {
  const out = new Map<string, ReviewItemDetail>();
  if (itemIds.length === 0) return out;

  if (pool) {
    try {
      const { rows } = await pool.query<Record<string, unknown>>(
        'SELECT * FROM generated_problems WHERE id::TEXT = ANY($1::TEXT[])',
        [[...itemIds]],
      );
      for (const r of rows) {
        out.set(String(r.id), {
          source: 'generated_problems',
          concept_id: r.concept_id as string,
          topic: r.topic as string,
          question_type: (r.question_type as string) ?? null,
          marks: (r.marks as number) ?? null,
          question_text: r.question_text as string,
          options: Array.isArray(r.options) ? (r.options as string[]) : undefined,
          answer_index: (r.answer_index as number) ?? null,
          answer_indices: Array.isArray(r.answer_indices) ? (r.answer_indices as number[]) : null,
          answer_range: Array.isArray(r.answer_range) ? (r.answer_range as [number, number]) : null,
          correct_answer: (r.correct_answer as string) ?? null,
          solution_steps: Array.isArray(r.solution_steps) ? (r.solution_steps as string[]) : [],
          distractor_failure_tags:
            r.distractor_failure_tags && typeof r.distractor_failure_tags === 'object' && !Array.isArray(r.distractor_failure_tags)
              ? (r.distractor_failure_tags as Record<string, string>)
              : null,
          verification_method: (r.verification_method as string) ?? null,
          difficulty: (r.difficulty as number) ?? null,
        });
      }
    } catch (err) {
      // A failed lookup must not blank the queue — the ledger rows are
      // still worth showing, with an honest 'unresolved' source.
      console.error(`[review-queue] generated_problems detail lookup failed: ${(err as Error).message}`);
    }
  }

  const missing = itemIds.filter((id) => !out.has(id));
  if (missing.length > 0) {
    const wanted = new Set(missing);
    for (const item of loadBanks()) {
      if (wanted.has(item.id)) out.set(item.id, detailFromAuthored(item));
    }
  }

  for (const id of itemIds) {
    if (!out.has(id)) out.set(id, { source: 'unresolved' });
  }
  return out;
}

// ============================================================================
// Shaping
// ============================================================================

export interface ReviewQueueRow {
  item_id: string;
  generation_run_id: string;
  /** The mathematics gate's current state. */
  status: GateStatus;
  reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  /** Derived: pending, but an operator has already looked at it and asked for a fix. */
  needs_fix: boolean;
  /** All five gates, so the operator sees the whole row's standing. */
  gates: Record<string, { status: GateStatus; reason: string | null; decided_by: string | null; decided_at: string | null }>;
  /** How many of the five are passed-or-waived — the promotion check, previewed. */
  gates_satisfied: number;
  gates_total: number;
  detail: ReviewItemDetail;
}

/**
 * Join ledger rows + all-gate context + item detail into the ONE row the
 * operator reads. Pure — exported for tests.
 */
export function buildQueueRows(
  reviewRows: ReadonlyArray<GateLedgerRow>,
  allGateRows: ReadonlyArray<GateLedgerRow>,
  details: ReadonlyMap<string, ReviewItemDetail>,
): ReviewQueueRow[] {
  const byItem = new Map<string, GateLedgerRow[]>();
  for (const r of allGateRows) {
    if (!r.item_id) continue;
    const list = byItem.get(r.item_id) ?? [];
    list.push(r);
    byItem.set(r.item_id, list);
  }

  return reviewRows
    .filter((r): r is GateLedgerRow & { item_id: string } => !!r.item_id)
    .map((r) => {
      const gates: ReviewQueueRow['gates'] = {};
      let satisfied = 0;
      for (const g of byItem.get(r.item_id) ?? []) {
        gates[g.gate] = { status: g.status, reason: g.reason, decided_by: g.decided_by, decided_at: g.decided_at };
        if (g.status === 'passed' || g.status === 'waived') satisfied++;
      }
      return {
        item_id: r.item_id,
        generation_run_id: r.generation_run_id,
        status: r.status,
        reason: r.reason,
        decided_by: r.decided_by,
        decided_at: r.decided_at,
        created_at: r.created_at,
        needs_fix: r.status === 'pending' && r.decided_at != null,
        gates,
        gates_satisfied: satisfied,
        gates_total: CONTENT_GATES.length,
        detail: details.get(r.item_id) ?? { source: 'unresolved' },
      };
    });
}

// ============================================================================
// Handlers
// ============================================================================

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await requireRole(req, res, 'admin'))) return;
  const pool = requireDb(res);
  if (!pool) return;

  const run = req.query.get('run') || undefined;
  const statusParam = req.query.get('status') || 'pending';
  const status = statusParam === 'all' ? undefined : (statusParam as GateStatus);
  const limitRaw = Number(req.query.get('limit') ?? 100);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;

  try {
    const reviewRows = await listGateRows(
      { generation_run_id: run, gate: REVIEWED_GATE, status, limit },
      pool,
    );
    const itemIds = reviewRows.map((r) => r.item_id).filter((x): x is string => !!x);
    const [allGateRows, details] = await Promise.all([
      gateRowsForItems(itemIds, pool),
      resolveReviewDetails(itemIds, pool),
    ]);
    const items = buildQueueRows(reviewRows, allGateRows, details);
    sendJSON(res, {
      items,
      gate: REVIEWED_GATE,
      gates_total: CONTENT_GATES.length,
      filters: { run: run ?? null, status: statusParam, limit },
    });
  } catch (err) {
    sendJSON(res, { error: 'Internal Server Error', message: (err as Error).message }, 500);
  }
}

interface DecideOutcome {
  decided: string[];
  failed: Array<{ item_id: string; reason: string }>;
}

async function applyDecision(
  pool: pg.Pool,
  itemIds: ReadonlyArray<string>,
  decision: ReviewDecision,
  notes: string | undefined,
  operatorId: string,
): Promise<DecideOutcome> {
  const out: DecideOutcome = { decided: [], failed: [] };
  // The run id is not in the request — it is a property of the ledger row,
  // and taking it from the client would let a caller write a verdict into a
  // run the item does not belong to.
  const rows = await gateRowsForItems(itemIds, pool);
  const runByItem = new Map<string, string>();
  for (const r of rows) {
    if (r.item_id && r.gate === REVIEWED_GATE) runByItem.set(r.item_id, r.generation_run_id);
  }
  for (const itemId of itemIds) {
    const runId = runByItem.get(itemId);
    if (!runId) {
      out.failed.push({
        item_id: itemId,
        reason: `no '${REVIEWED_GATE}' gate row exists for item '${itemId}' — nothing to decide. Items enter this queue when a generation run writes its gate ledger.`,
      });
      continue;
    }
    try {
      await decideGate(
        {
          generation_run_id: runId,
          item_id: itemId,
          gate: REVIEWED_GATE,
          status: DECISION_STATUS[decision],
          reason: decisionReason(decision, notes, operatorId),
          decided_by: operatorId,
        },
        pool,
      );
      out.decided.push(itemId);
    } catch (err) {
      out.failed.push({ item_id: itemId, reason: (err as Error).message });
    }
  }
  return out;
}

async function handleDecide(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;
  const pool = requireDb(res);
  if (!pool) return;

  const itemId = req.params.itemId;
  if (!itemId) return badRequest(res, 'itemId path param required');

  const body = (req.body ?? {}) as Record<string, unknown>;
  const invalid = validateDecision(body.decision, body.notes);
  if (invalid) return badRequest(res, invalid);

  const operatorId = operatorIdFor(user);
  const outcome = await applyDecision(
    pool,
    [itemId],
    body.decision as ReviewDecision,
    typeof body.notes === 'string' ? body.notes : undefined,
    operatorId,
  );
  if (outcome.failed.length > 0) {
    return sendJSON(res, { error: 'Not Found', message: outcome.failed[0].reason }, 404);
  }
  sendJSON(res, { item_id: itemId, decision: body.decision, decided_by: operatorId });
}

async function handleDecideBatch(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;
  const pool = requireDb(res);
  if (!pool) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const ids = body.item_ids;
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((x) => typeof x === 'string' && x.length > 0)) {
    return badRequest(res, 'item_ids must be a non-empty array of item id strings');
  }
  if (ids.length > MAX_BATCH) {
    return badRequest(res, `item_ids has ${ids.length} entries, the batch limit is ${MAX_BATCH} — split the selection`);
  }
  const invalid = validateDecision(body.decision, body.notes);
  if (invalid) return badRequest(res, invalid);

  const operatorId = operatorIdFor(user);
  const outcome = await applyDecision(
    pool,
    ids as string[],
    body.decision as ReviewDecision,
    typeof body.notes === 'string' ? body.notes : undefined,
    operatorId,
  );
  sendJSON(res, {
    decision: body.decision,
    decided_by: operatorId,
    decided: outcome.decided.length,
    decided_item_ids: outcome.decided,
    failed: outcome.failed,
  });
}

/** One bulk approve should not be able to sweep an unbounded backlog unseen. */
export const MAX_BATCH = 100;

/**
 * The operator id stamped into `decided_by`. Prefers the stable user id;
 * falls back to email only when there is no id (the CRON_SECRET path has
 * neither, and 'cron-secret' is the honest label for it — an approval made
 * with a shared secret is attributable to the secret, not to a person).
 */
export function operatorIdFor(user: { userId?: string; email?: string } | null): string {
  return user?.userId || user?.email || 'cron-secret';
}

// ============================================================================
// Route table
// ============================================================================

export const adminReviewQueueRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/review-queue', handler: handleList },
  // Literal path before the :itemId matcher so 'decide-batch' is not captured.
  { method: 'POST', path: '/api/admin/review-queue/decide-batch', handler: handleDecideBatch },
  { method: 'POST', path: '/api/admin/review-queue/:itemId/decide', handler: handleDecide },
];
