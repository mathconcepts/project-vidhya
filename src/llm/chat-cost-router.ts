// @ts-nocheck
/**
 * src/llm/chat-cost-router.ts
 *
 * Cost-tiered model routing for the AI Tutor chat endpoint (E1 — "runtime
 * LLM budget ladder", per docs/100x-blueprint.md's deferred list).
 *
 * What this is NOT: a semantic answer cache. An earlier design for this
 * slice considered caching/replaying chat answers across students for
 * near-duplicate questions, but chat responses here are built from
 * `buildContentGeneratorPrompt(reasonerInstructions, studentModel)` —
 * genuinely personalized per student (motivation state, mastery, right
 * modality). Replaying one student's cached answer to another would
 * silently undo that personalization. So this slice only changes WHICH
 * model generates the (always fresh, always personalized) response —
 * never what the response says.
 *
 * Design:
 *   - Default OFF. Set VIDHYA_COST_TIER_ROUTING=on to enable. Every
 *     existing caller of getLlmForRole() that doesn't pass the new opts
 *     param is completely unaffected — see runtime.ts.
 *   - Complexity is read off the existing rule-based intent classifier
 *     (src/content/intent-classifier.ts via src/content/router.ts) —
 *     no new classification logic, no new LLM call, no new latency.
 *     'walkthrough-problem' and 'solve-for-me' need real reasoning depth
 *     (multi-step derivations); the rest are lookups/explanations that a
 *     cheaper model handles fine.
 *   - The budget-model mapping is intentionally conservative: only
 *     providers with a genuinely cheaper *chat-capable* model in the
 *     registry are mapped. Providers without a clear cheaper option
 *     (openrouter, deepseek, ollama) resolve to undefined — no override,
 *     identical behavior to today.
 *   - Escalation-on-failure (retry the same turn on the standard model if
 *     the budget model errors or times out) is deliberately NOT included
 *     in this slice — the chat call is a live SSE stream, and restarting
 *     a partially-streamed response cleanly is a separate, riskier piece
 *     of work. Documented as deferred, not silently dropped.
 */

import type { Intent } from '../content/intent-classifier';

// ============================================================================
// Complexity classification
// ============================================================================

/**
 * Intents that need multi-step reasoning depth — kept on the provider's
 * standard/default model.
 */
const COMPLEX_INTENTS: ReadonlySet<Intent> = new Set(['walkthrough-problem', 'solve-for-me']);

/**
 * Everything else: concept explanations, answer checks, upload lookups,
 * "give me a practice problem" — a cheaper model handles these fine.
 */
export function isSimpleIntent(intent: Intent): boolean {
  return !COMPLEX_INTENTS.has(intent);
}

// ============================================================================
// Feature flag
// ============================================================================

export function isCostTierRoutingEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.VIDHYA_COST_TIER_ROUTING === 'on';
}

// ============================================================================
// Budget model mapping
// ============================================================================

/**
 * provider_id -> cheaper chat-capable model id. Only populated where the
 * registry (src/llm/provider-registry.ts) lists a genuinely cheaper
 * chat-capable alternative to that provider's default chat model.
 * Validated against the live registry at call time in runtime.ts — if a
 * mapped model id ever falls out of the registry, the override is
 * silently skipped rather than sending an invalid model id upstream.
 */
export const BUDGET_MODEL_BY_PROVIDER: Readonly<Record<string, string>> = {
  'google-gemini': 'gemini-2.5-flash-lite', // ~3x cheaper than the flash default, still vision-capable
  'anthropic': 'claude-haiku-4-5',          // cheap tier vs the mid-tier sonnet default
  'openai': 'gpt-4o-mini',                  // cheap tier vs gpt-4o default
  'groq': 'llama-3.1-8b-instant',           // free tier, extremely fast
  // No entry for 'mistral': its chat default (mistral-small-latest) is
  // already the cheap-tier model — mistral-large-latest is MORE
  // expensive, not a budget option. An earlier version of this map
  // pointed 'mistral' at mistral-small-latest, which is a silent no-op
  // (default === "budget" override). Caught by the strict
  // "budget model must actually differ from the default" test below;
  // left out entirely rather than mapped to itself.
};

export function resolveBudgetModelId(provider_id: string): string | undefined {
  return BUDGET_MODEL_BY_PROVIDER[provider_id];
}

// ============================================================================
// Telemetry — ground-truth usage counts, not attempted-tier counts
// ============================================================================
//
// Mirrors the in-memory-only pattern already used by src/lib/llm-budget.ts
// and src/lib/rate-limit.ts: per-process counters, documented as such, no
// DB write. Recorded from the LLM object actually returned by
// getLlmForRole() (llm.provider_id / llm.model_id) rather than from our own
// "did we ask for budget tier" flag, so a budget-model mapping that turns
// out to be stale/invalid doesn't produce misleading stats.

interface UsageCounter {
  count: number;
  by_complexity: { simple: number; complex: number };
}

const usageByModel = new Map<string, UsageCounter>();

function keyFor(provider_id: string, model_id: string): string {
  return `${provider_id}::${model_id}`;
}

export function recordChatModelUsage(
  provider_id: string,
  model_id: string,
  complexity: 'simple' | 'complex',
): void {
  const key = keyFor(provider_id, model_id);
  const existing = usageByModel.get(key) ?? { count: 0, by_complexity: { simple: 0, complex: 0 } };
  existing.count += 1;
  existing.by_complexity[complexity] += 1;
  usageByModel.set(key, existing);
}

export interface ChatModelUsageStats {
  provider_id: string;
  model_id: string;
  count: number;
  by_complexity: { simple: number; complex: number };
}

/** Read-only view for ops dashboards and tests. */
export function getChatModelUsageStats(): ChatModelUsageStats[] {
  return Array.from(usageByModel.entries()).map(([key, v]) => {
    const [provider_id, model_id] = key.split('::');
    return { provider_id, model_id, count: v.count, by_complexity: { ...v.by_complexity } };
  });
}

/** Test helper. */
export function _resetForTests(): void {
  usageByModel.clear();
}
