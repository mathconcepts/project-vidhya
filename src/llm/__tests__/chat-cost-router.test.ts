// @ts-nocheck
/**
 * Unit tests for src/llm/chat-cost-router.ts (E1 cost-tiered chat routing).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isSimpleIntent,
  isCostTierRoutingEnabled,
  resolveBudgetModelId,
  BUDGET_MODEL_BY_PROVIDER,
  recordChatModelUsage,
  getChatModelUsageStats,
  _resetForTests,
} from '../chat-cost-router';
import { PROVIDERS } from '../provider-registry';

beforeEach(() => {
  _resetForTests();
});

describe('isSimpleIntent', () => {
  it('classifies walkthrough-problem and solve-for-me as complex (not simple)', () => {
    expect(isSimpleIntent('walkthrough-problem')).toBe(false);
    expect(isSimpleIntent('solve-for-me')).toBe(false);
  });

  it('classifies explain-concept, verify-answer, find-in-uploads, practice-problem as simple', () => {
    expect(isSimpleIntent('explain-concept')).toBe(true);
    expect(isSimpleIntent('verify-answer')).toBe(true);
    expect(isSimpleIntent('find-in-uploads')).toBe(true);
    expect(isSimpleIntent('practice-problem')).toBe(true);
  });
});

describe('isCostTierRoutingEnabled', () => {
  it('is off by default (env var unset)', () => {
    expect(isCostTierRoutingEnabled({})).toBe(false);
  });

  it('is on only when the env var is exactly "on"', () => {
    expect(isCostTierRoutingEnabled({ VIDHYA_COST_TIER_ROUTING: 'on' })).toBe(true);
    expect(isCostTierRoutingEnabled({ VIDHYA_COST_TIER_ROUTING: 'true' })).toBe(false);
    expect(isCostTierRoutingEnabled({ VIDHYA_COST_TIER_ROUTING: '1' })).toBe(false);
    expect(isCostTierRoutingEnabled({ VIDHYA_COST_TIER_ROUTING: 'ON' })).toBe(false);
  });
});

describe('resolveBudgetModelId', () => {
  it('returns a mapped budget model for google-gemini, anthropic, openai, groq', () => {
    expect(resolveBudgetModelId('google-gemini')).toBe('gemini-2.5-flash-lite');
    expect(resolveBudgetModelId('anthropic')).toBe('claude-haiku-4-5');
    expect(resolveBudgetModelId('openai')).toBe('gpt-4o-mini');
    expect(resolveBudgetModelId('groq')).toBe('llama-3.1-8b-instant');
  });

  it('returns undefined for providers without a mapped cheaper alternative', () => {
    // mistral: its chat default (mistral-small-latest) IS the cheap-tier
    // model already — mistral-large-latest is more expensive, not a
    // budget option, so there's genuinely nothing cheaper to map to.
    expect(resolveBudgetModelId('mistral')).toBeUndefined();
    expect(resolveBudgetModelId('openrouter')).toBeUndefined();
    expect(resolveBudgetModelId('deepseek')).toBeUndefined();
    expect(resolveBudgetModelId('ollama')).toBeUndefined();
    expect(resolveBudgetModelId('not-a-real-provider')).toBeUndefined();
  });

  it('every mapped budget model actually exists in the live provider registry, chat-capable', () => {
    // Guards against the mapping drifting out of sync with provider-registry.ts
    // (e.g. a model gets renamed/removed there). runtime.ts's own override
    // logic degrades safely if this ever breaks, but this test catches it
    // at CI time instead of silently losing the cost saving in production.
    for (const [provider_id, model_id] of Object.entries(BUDGET_MODEL_BY_PROVIDER)) {
      const provider = PROVIDERS.find((p) => p.id === provider_id);
      expect(provider, `provider ${provider_id} not found in registry`).toBeTruthy();
      const model = provider!.models.find((m) => m.id === model_id);
      expect(model, `budget model ${model_id} not found for provider ${provider_id}`).toBeTruthy();
      expect(model!.roles).toContain('chat');
    }
  });

  it('every mapped budget model is a genuinely cheaper alternative to the provider default chat model', () => {
    // Two conditions, both required — this is what actually caught the
    // earlier mistral bug (mapped to its OWN chat default: same
    // cost_tier AND same model id, i.e. a complete no-op override):
    //   1. cost_tier rank must not be worse than the default's.
    //   2. AND it must not be the exact same model id as the default —
    //      a same-tier-but-different-model case (e.g. Gemini's flash vs
    //      flash-lite, both 'cheap') is a legitimate real saving, but
    //      "budget model === default model" never is.
    const RANK: Record<string, number> = { free: 0, cheap: 1, mid: 2, premium: 3 };
    for (const [provider_id, model_id] of Object.entries(BUDGET_MODEL_BY_PROVIDER)) {
      const provider = PROVIDERS.find((p) => p.id === provider_id)!;
      const defaultModelId = provider.default_models.chat!;
      const defaultModel = provider.models.find((m) => m.id === defaultModelId)!;
      const budgetModel = provider.models.find((m) => m.id === model_id)!;
      expect(RANK[budgetModel.cost_tier]).toBeLessThanOrEqual(RANK[defaultModel.cost_tier]);
      expect(model_id, `${provider_id}: budget model must differ from the default (${defaultModelId})`).not.toBe(defaultModelId);
    }
  });
});

describe('chat model usage telemetry', () => {
  it('starts empty', () => {
    expect(getChatModelUsageStats()).toEqual([]);
  });

  it('accumulates counts per (provider, model), split by complexity', () => {
    recordChatModelUsage('google-gemini', 'gemini-2.5-flash-lite', 'simple');
    recordChatModelUsage('google-gemini', 'gemini-2.5-flash-lite', 'simple');
    recordChatModelUsage('google-gemini', 'gemini-2.5-flash', 'complex');

    const stats = getChatModelUsageStats();
    expect(stats).toHaveLength(2);

    const lite = stats.find((s) => s.model_id === 'gemini-2.5-flash-lite')!;
    expect(lite.count).toBe(2);
    expect(lite.by_complexity).toEqual({ simple: 2, complex: 0 });

    const flash = stats.find((s) => s.model_id === 'gemini-2.5-flash')!;
    expect(flash.count).toBe(1);
    expect(flash.by_complexity).toEqual({ simple: 0, complex: 1 });
  });

  it('_resetForTests clears accumulated state', () => {
    recordChatModelUsage('anthropic', 'claude-haiku-4-5', 'simple');
    expect(getChatModelUsageStats()).toHaveLength(1);
    _resetForTests();
    expect(getChatModelUsageStats()).toEqual([]);
  });
});
