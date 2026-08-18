/**
 * src/lib/chat-spend.ts
 *
 * Durable, deployment-wide daily USD spend cap for the AI tutor chat LLM
 * fallback path (T19, per docs/designs/linear-algebra-realtime-and-math-
 * academy-plan.md and OV2 correction #11).
 *
 * OV2 #11's finding: chat had NO spend metering at all. `src/llm/
 * rate-limit-tracker.ts` records provider call OUTCOMES (429s, latency) —
 * never cost. `src/generation/cost-meter.ts` metres a single GenerationRun's
 * budget — per-run, in-memory, gone the moment the run object goes out of
 * scope. Neither answers "how much has chat spent today, across every
 * session, and is a production key about to bankrupt the deployment."
 *
 * This module answers that question with one counter:
 *   - Scope: the whole deployment, per UTC calendar day. NOT per-student —
 *     this is a cost circuit-breaker, not a usage profile, and the
 *     surveillance invariants (src/personalization/__tests__/
 *     surveillance-invariants.test.ts) forbid per-student spend tracking
 *     outside that module anyway. `chat-spend` never carries a session id,
 *     user id, or message content — just a date and two numbers.
 *   - Durability: mirrors into `durable_records` (migration 043, collection
 *     'chat-spend') via the same `durableCollection` helper every other
 *     irreplaceable flat-file store uses (src/storage/durable-flat-file.ts).
 *     `.data/chat-spend.json` is one JSON array of {date, spent_usd,
 *     trip_count} rows — small forever, since it grows by one row per day.
 *
 * ── The fail-safe tradeoff (read before changing DEFAULT behaviour) ───────
 *
 * `durableCollection.hydrate()` only restores when the LOCAL file is empty,
 * and it cannot tell "this is a brand new deployment, there is genuinely
 * nothing to restore" apart from "the mirror is unreachable and we lost
 * today's real total." Both look identical: an empty local file.
 *
 * The tempting fail-safe is "when in doubt, assume the cap is already
 * spent" — but that bricks chat on every fresh install and every DB-less
 * demo deploy forever, which is strictly worse than under-enforcing a cost
 * cap for the rest of one day. So this module fails OPEN: an empty or
 * unrestored local store reads as $0 spent today, chat proceeds, and
 * `hydrateChatSpendStore()` logs loudly (console.warn) so an operator who
 * cares about the cap notices the ambiguity instead of trusting a number
 * that might be silently wrong. Real, sustained overspend still gets caught
 * within one day once the counter is live again.
 */

import { createFlatFileStore } from './flat-file-store';
import { durableCollection } from '../storage/durable-flat-file';
import { priceForCall, isKnownModel } from '../generation/cost-meter';

// ============================================================================
// Storage
// ============================================================================

export interface ChatSpendDay {
  /** UTC calendar day, 'YYYY-MM-DD'. Also the row id — one row per day. */
  date_utc: string;
  /** Cumulative estimated USD spent on the chat LLM fallback path this day. */
  spent_usd: number;
  /** How many requests were refused this day because the cap was already hit. */
  trip_count: number;
  updated_at: string;
}

interface StoreShape {
  days: ChatSpendDay[];
}

const STORE_PATH = process.env.VIDHYA_CHAT_SPEND_FILE ?? '.data/chat-spend.json';

const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ days: [] }),
});

/**
 * Not wrapped in `registerDurable` — chat-spend hydrates via its own explicit
 * call from server.ts (same pattern as the Feedback / Bridge-content stores),
 * so the fail-safe warning below can live right next to the store it
 * describes instead of being generic boot-log noise.
 */
const _durable = durableCollection<ChatSpendDay>({
  collection: 'chat-spend',
  idOf: (d) => d.date_utc,
  // No scopeOf: this collection has no per-owner axis by design (see the
  // file header — it is a deployment-wide counter, never a per-student one).
  readLocal: () => _store.read().days ?? [],
  writeLocal: (days) => _store.write({ days }),
});

/** Restore today's (and prior days') spend counters at boot. See the
 * fail-safe tradeoff note at the top of this file for why a failed restore
 * is deliberately non-fatal. */
export async function hydrateChatSpendStore(): Promise<{ hydrated: boolean; count: number; reason: string }> {
  const result = await _durable.hydrate();
  if (!result.hydrated) {
    console.warn(
      `[chat-spend] Daily spend counter not restored from the durable store (${result.reason}). ` +
      'Treating today\'s chat spend as $0 and allowing the LLM fallback to proceed — bricking chat ' +
      'because a restore could not be confirmed would be worse than under-enforcing the cap for one ' +
      'day. If this deployment has run before today and has DATABASE_URL configured, this warning ' +
      'means the cap may be under-counting real spend until the next successful mirror; if this is a ' +
      'fresh or DB-less deploy, this is expected and harmless.',
    );
  }
  return result;
}

/** Test-only: reset both the local store and the module's cached knobs. */
export function _resetForTests(): void {
  _store.write({ days: [] });
}

// ============================================================================
// Cap configuration
// ============================================================================

const DEFAULT_DAILY_SPEND_CAP_USD = 5;

/** Read fresh each call (not cached at module load) so tests can flip the
 * env var without needing `vi.resetModules()`, and so an operator's env
 * change takes effect on the next request rather than requiring a restart. */
export function getDailySpendCapUsd(): number {
  const raw = process.env.VIDHYA_CHAT_DAILY_SPEND_CAP_USD;
  if (!raw) return DEFAULT_DAILY_SPEND_CAP_USD;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_SPEND_CAP_USD;
}

// A conservative flat fallback for a model id `cost-meter.ts` doesn't
// recognize. `priceForCall` returns $0 for an unknown model — correct for a
// generation run's cost LEDGER ("don't double-bill, just skip it"), wrong for
// a spend CAP: pricing an unrecognized model at $0 would let the cap go
// unenforced the moment a model id drifts (this codebase has a documented
// history of exactly that drift — see CLAUDE.md's "Multi-Provider LLM
// Support" section) or a brand-new model ships. Pitched near Claude
// Sonnet / GPT-4o's blended rate — expensive enough that an unrecognized
// model still trips the cap promptly rather than sailing under it.
const FALLBACK_INPUT_PER_1M_USD = 3.0;
const FALLBACK_OUTPUT_PER_1M_USD = 15.0;

/**
 * Estimate the USD cost of one chat completion. Reuses the canonical price
 * table (`src/generation/cost-meter.ts`'s `PRICES`, the table CLAUDE.md's
 * "Multi-Provider LLM Support" section consolidated model ids around) when
 * the model is recognized; falls back to a conservative flat rate otherwise
 * (see the constant comment above for why $0 is the wrong fallback here).
 */
export function estimateChatCostUsd(model_id: string, input_tokens: number, output_tokens: number): number {
  const inTok = Math.max(0, input_tokens || 0);
  const outTok = Math.max(0, output_tokens || 0);
  if (isKnownModel(model_id)) {
    return priceForCall({ model: model_id, input_tokens: inTok, output_tokens: outTok });
  }
  return (inTok / 1_000_000) * FALLBACK_INPUT_PER_1M_USD + (outTok / 1_000_000) * FALLBACK_OUTPUT_PER_1M_USD;
}

// ============================================================================
// Read / write today's counter
// ============================================================================

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Read-only snapshot of today's counter. Never creates a row. */
function peekToday(): ChatSpendDay {
  const today = todayUtc();
  const found = _store.read().days.find((d) => d.date_utc === today);
  return found ?? { date_utc: today, spent_usd: 0, trip_count: 0, updated_at: new Date(0).toISOString() };
}

function mutateToday<R>(fn: (day: ChatSpendDay) => R): R {
  let result!: R;
  _store.update((state) => {
    const today = todayUtc();
    let day = state.days.find((d) => d.date_utc === today);
    if (!day) {
      day = { date_utc: today, spent_usd: 0, trip_count: 0, updated_at: new Date().toISOString() };
      state.days.push(day);
    }
    result = fn(day);
    day.updated_at = new Date().toISOString();
  });
  _durable.mirror();
  return result;
}

export interface ChatSpendCheck {
  allowed: boolean;
  spent_today_usd: number;
  cap_usd: number;
  trip_count_today: number;
}

/**
 * Read-only cap check. Call BEFORE the LLM call. Pure — does not record a
 * trip; the caller decides whether a refusal actually happens and, if so,
 * calls `recordCapTrip()` itself (keeps this function safely callable from
 * places that just want a status read, e.g. the admin platform-health
 * route, without side effects).
 */
export function checkChatSpendCap(): ChatSpendCheck {
  const day = peekToday();
  const cap = getDailySpendCapUsd();
  return {
    allowed: day.spent_usd < cap,
    spent_today_usd: day.spent_usd,
    cap_usd: cap,
    trip_count_today: day.trip_count,
  };
}

/**
 * Record that a request was refused because the cap was already hit.
 * Logged loudly (per T19's requirement that a cap trip be logged with the
 * day's total) and persisted so `trip_count` survives a restart same as
 * `spent_usd`.
 */
export function recordCapTrip(): ChatSpendDay {
  return mutateToday((day) => {
    day.trip_count += 1;
    console.warn(
      `[chat-spend] Daily spend cap tripped — refusing the LLM fallback. ` +
      `$${day.spent_usd.toFixed(4)} spent of $${getDailySpendCapUsd().toFixed(2)} cap for ${day.date_utc} ` +
      `(trip #${day.trip_count} today). Atom-corpus content is unaffected.`,
    );
    return day;
  });
}

/** Record actual (estimated) spend for one completed chat LLM call. */
export function recordChatSpend(usd: number): void {
  if (!Number.isFinite(usd) || usd <= 0) return;
  mutateToday((day) => {
    day.spent_usd += usd;
  });
}

/** Read-only status for admin surfaces. Same shape as `checkChatSpendCap`
 * but named for its call site — no side effects either way. */
export function getChatSpendStatus(): ChatSpendCheck {
  return checkChatSpendCap();
}
