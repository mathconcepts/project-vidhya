// @ts-nocheck
/**
 * src/lib/llm-budget.ts
 *
 * Per-user daily LLM token budget. Protects deployments from
 * runaway costs when a single user (legitimately or not) consumes
 * an outsized share of the operator's API budget.
 *
 * Design:
 *   - Default OFF — most deployments don't need caps. Opt in by
 *     setting VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER to a positive
 *     integer.
 *   - Daily window resets at UTC midnight. The window is a calendar
 *     boundary (not a 24-hour rolling window) because:
 *       (a) it's predictable for users — "I'll have my budget back
 *           tomorrow" is easier to communicate than "in 14h 23m"
 *       (b) bookkeeping is simpler — one counter per user keyed by
 *           the current YYYY-MM-DD
 *   - In-memory state, same caveat as the rate limiter — multi-
 *     process state is shared nothing; documented in PRODUCTION.md
 *   - Token denomination is documented per provider in FOUNDER.md
 *     so operators can map "100k tokens/day" to a dollar cost
 *
 * Cost math (Gemini 2.5 Flash, the default chat backend):
 *   - Input:  ~$0.075 per million tokens
 *   - Output: ~$0.30  per million tokens
 *   - Mixed call (3:1 input:output): ~$0.13 per million tokens
 *   - 100k tokens/day cap = ~$0.013/user/day = ~$0.40/user/month
 *
 * Anthropic / OpenAI are different. FOUNDER.md has the table.
 *
 * Usage:
 *   1. Before the LLM call, ask `tryReserveTokens(user_id, est)`.
 *      If false, return 429 to the user; their budget is exhausted.
 *   2. After the LLM call returns, call `recordUsage(user_id,
 *      actual)` with the actual token count from the response.
 *   3. The reservation/usage difference is reconciled — the bucket
 *      tracks actuals, so over-estimation just means earlier
 *      reservations.
 *
 * Failure mode if a deployment forgets to call recordUsage():
 *   The budget tracking is purely the reservation count, which is
 *   the est passed to tryReserveTokens. As long as estimates are
 *   reasonable, the cap holds. Operators can verify by comparing
 *   recordUsage call sites against tryReserveTokens call sites.
 */

const RAW_CAP = process.env.VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER;
const DAILY_CAP_TOKENS: number | null = RAW_CAP && /^\d+$/.test(RAW_CAP)
  ? parseInt(RAW_CAP, 10)
  : null;

interface BudgetEntry {
  /** Day key, e.g. '2026-04-28'. */
  date_utc: string;
  /** Tokens consumed today (sum of recordUsage calls). */
  used: number;
  /** Tokens reserved but not yet recorded (in-flight requests). */
  reserved: number;
}

const budgets = new Map<string, BudgetEntry>();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOrInit(user_id: string): BudgetEntry {
  const today = todayUtc();
  let cur = budgets.get(user_id);
  if (!cur || cur.date_utc !== today) {
    cur = { date_utc: today, used: 0, reserved: 0 };
    budgets.set(user_id, cur);
  }
  return cur;
}

/**
 * Try to reserve `est_tokens` for an upcoming LLM call. Returns
 * true if the user has budget left, false otherwise. If the budget
 * cap isn't configured (env var unset), always returns true.
 */
export function tryReserveTokens(user_id: string, est_tokens: number): {
  allowed: boolean;
  used_today: number;
  cap: number | null;
  remaining: number;
} {
  if (DAILY_CAP_TOKENS === null) {
    return { allowed: true, used_today: 0, cap: null, remaining: Infinity };
  }
  if (est_tokens < 0) est_tokens = 0;

  const entry = getOrInit(user_id);
  const projected = entry.used + entry.reserved + est_tokens;
  if (projected > DAILY_CAP_TOKENS) {
    return {
      allowed: false,
      used_today: entry.used,
      cap: DAILY_CAP_TOKENS,
      remaining: Math.max(0, DAILY_CAP_TOKENS - entry.used - entry.reserved),
    };
  }
  entry.reserved += est_tokens;
  return {
    allowed: true,
    used_today: entry.used,
    cap: DAILY_CAP_TOKENS,
    remaining: DAILY_CAP_TOKENS - entry.used - entry.reserved,
  };
}

/**
 * Record actual token usage for a user. Reconciles against the
 * reservation made earlier — if the actual was less than the
 * reservation, frees the difference. If more, the bucket goes
 * over for the rest of the day; subsequent reservations will be
 * denied. This means estimates should be conservative-leaning.
 *
 * `est_tokens` should match what was passed to tryReserveTokens
 * for this same call. If you forgot to reserve, pass 0.
 */
export function recordUsage(
  user_id: string,
  actual_tokens: number,
  est_tokens: number = 0,
): void {
  if (DAILY_CAP_TOKENS === null) return;
  if (actual_tokens < 0) actual_tokens = 0;
  const entry = getOrInit(user_id);
  entry.used += actual_tokens;
  entry.reserved = Math.max(0, entry.reserved - est_tokens);
}

/**
 * Cancel a reservation that didn't happen — e.g. the LLM call
 * failed before consuming any tokens, or the upstream rejected
 * the request.
 */
export function cancelReservation(user_id: string, est_tokens: number): void {
  if (DAILY_CAP_TOKENS === null) return;
  const entry = getOrInit(user_id);
  entry.reserved = Math.max(0, entry.reserved - est_tokens);
}

/**
 * Read-only view for ops dashboards and tests.
 */
export function getBudgetStatus(user_id: string): {
  date_utc: string;
  used: number;
  reserved: number;
  cap: number | null;
  remaining: number | null;
} {
  if (DAILY_CAP_TOKENS === null) {
    return { date_utc: todayUtc(), used: 0, reserved: 0, cap: null, remaining: null };
  }
  const entry = getOrInit(user_id);
  return {
    date_utc: entry.date_utc,
    used: entry.used,
    reserved: entry.reserved,
    cap: DAILY_CAP_TOKENS,
    remaining: Math.max(0, DAILY_CAP_TOKENS - entry.used - entry.reserved),
  };
}

/** Test helper. */
export function _resetForTests(): void {
  budgets.clear();
}

/** Whether the cap is configured at all. Useful for runtime checks. */
export function isBudgetCapEnabled(): boolean {
  return DAILY_CAP_TOKENS !== null;
}
