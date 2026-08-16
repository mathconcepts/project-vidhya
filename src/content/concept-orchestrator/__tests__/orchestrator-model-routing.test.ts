/**
 * orchestrator-model-routing.test.ts
 *
 * Pins the v4.26.0 generalization of orchestrator.ts's callLlm() from a
 * fixed 'claude'|'gemini' union to an arbitrary OrchestratorOptions.model_id
 * — the piece that lets an admin-launched GenerationRun's
 * config.pipeline.llm_models[0] (the RunLauncher "LLM" dropdown) actually
 * pick which provider generates content.
 *
 * Two layers:
 *   - End-to-end via generateConcept() for the simple (single-call,
 *     non-consensus) path — proves model_id actually reaches the LLM
 *     client's request.
 *   - Direct unit tests of the consensus-secondary-picking helpers
 *     (__testing) for the math-atom dual-call path — the two consensus
 *     legs fire concurrently via Promise.all inside generateOne, which
 *     makes asserting on them independently through the full pipeline
 *     unreliable; the helpers are simple pure/near-pure functions and
 *     are far more precisely testable directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_TIER_MODELS } from '../model-tiers';

interface Call {
  model?: string;
  taskType?: string;
}

let calls: Call[] = [];

vi.mock('../../../llm/index', () => ({
  LLMClient: class {
    async generate(request: any) {
      calls.push({ model: request.model, taskType: request.taskType });
      if (request.taskType === 'eval') {
        // Malformed on purpose — llm-judge falls back to score:5 either
        // way, which is all these tests need (not gate-passing content).
        return { content: 'not json' };
      }
      return { content: `content from ${request.model}` };
    }
  },
}));

const FIXTURE_PROVIDERS = {
  anthropic: { models: { sonnet: { id: 'claude-sonnet-4-5' } } },
  gemini: { models: { flash: { id: 'gemini-2.5-flash' } } },
  openai: { models: { gpt4o: { id: 'gpt-4o' } } },
};

vi.mock('../../../llm/registry', () => ({
  loadLlmConfig: () => ({ providers: FIXTURE_PROVIDERS }),
}));

const { generateConcept, __testing } = await import('../orchestrator');
const { resolveProviderForModel, pickConsensusSecondary, consensusProvidersAreDistinct, MODEL_ID_MAP, DEFAULT_MODEL_ID } = __testing;

beforeEach(() => {
  calls = [];
});

function contentGenModels(): (string | undefined)[] {
  return calls.filter((c) => c.taskType === 'content-generation').map((c) => c.model);
}

describe('generateConcept → callLlm (end-to-end, single-call path)', () => {
  it('routes a FORMATTING atom to the cheap tier when no model is pinned', async () => {
    // Contract change (v4.32.0): generation no longer sends every atom type to
    // one model. `hook` is shape-driven, so it goes to the formatting tier.
    // Before this it went to DEFAULT_MODEL_ID like everything else.
    await generateConcept({
      concept_id: 'derivatives-basic',
      topic_family: 'calculus',
      atom_types: ['hook'],
      dry_run: true,
    });
    expect(contentGenModels()).toEqual([DEFAULT_TIER_MODELS.formatting]);
    expect(DEFAULT_TIER_MODELS.formatting).toBe('claude-haiku-4-5');
  });

  it('routes a THINKING atom to the reasoning tier when no model is pinned', async () => {
    // The half that must not regress: an atom whose correctness is
    // load-bearing keeps the stronger model without anyone selecting it.
    await generateConcept({
      concept_id: 'derivatives-basic',
      topic_family: 'calculus',
      atom_types: ['intuition'],
      dry_run: true,
    });
    expect(contentGenModels()).toEqual([DEFAULT_TIER_MODELS.thinking]);
    expect(DEFAULT_TIER_MODELS.thinking).toBe('claude-sonnet-4-5');
  });

  it('honours a per-tier operator selection', async () => {
    await generateConcept({
      concept_id: 'derivatives-basic',
      topic_family: 'calculus',
      atom_types: ['hook'],
      dry_run: true,
      tier_models: { formatting: 'gpt-4o-mini' },
    });
    expect(contentGenModels()).toEqual(['gpt-4o-mini']);
  });

  it('lets an explicitly pinned model override the tier routing', async () => {
    await generateConcept({
      concept_id: 'derivatives-basic',
      topic_family: 'calculus',
      atom_types: ['hook'],
      dry_run: true,
      model_id: 'gpt-4o',
    });
    expect(contentGenModels()).toEqual(['gpt-4o']);
  });
});

describe('resolveProviderForModel', () => {
  it('finds the provider that declares a given model id', async () => {
    const config = { providers: FIXTURE_PROVIDERS };
    expect(resolveProviderForModel(config, 'gpt-4o')).toBe('openai');
    expect(resolveProviderForModel(config, 'gemini-2.5-flash')).toBe('gemini');
    expect(resolveProviderForModel(config, 'claude-sonnet-4-5')).toBe('anthropic');
  });

  it('returns null for a model id no configured provider serves', async () => {
    const config = { providers: FIXTURE_PROVIDERS };
    expect(resolveProviderForModel(config, 'not-a-real-model')).toBeNull();
  });
});

describe('pickConsensusSecondary', () => {
  it('picks the Gemini default when the primary is NOT on the gemini provider', async () => {
    expect(await pickConsensusSecondary('gpt-4o')).toBe(MODEL_ID_MAP.gemini);
    expect(await pickConsensusSecondary('claude-sonnet-4-5')).toBe(MODEL_ID_MAP.gemini);
  });

  it('picks the Claude default when the primary IS on the gemini provider — never same-provider vs itself', async () => {
    expect(await pickConsensusSecondary('gemini-2.5-flash')).toBe(MODEL_ID_MAP.claude);
  });

  it('reduces to the exact historical default pair when the caller passes no model_id at all', async () => {
    // DEFAULT_MODEL_ID is Claude, so the auto-picked secondary must be
    // Gemini — today's unchanged default consensus pair.
    expect(await pickConsensusSecondary(DEFAULT_MODEL_ID)).toBe(MODEL_ID_MAP.gemini);
  });
});

describe('consensusProvidersAreDistinct', () => {
  it('is true when the two legs resolve to different providers', async () => {
    expect(await consensusProvidersAreDistinct('gpt-4o', 'gemini-2.5-flash')).toBe(true);
  });

  it('is false when both legs would resolve to the SAME provider — refuses fake independence', async () => {
    expect(await consensusProvidersAreDistinct('gemini-2.5-flash', 'gemini-2.5-flash')).toBe(false);
  });

  it('degrades to true (lets individual callLlm calls surface their own errors) when config fails to load', async () => {
    vi.doMock('../../../llm/registry', () => ({
      loadLlmConfig: () => {
        throw new Error('boom');
      },
    }));
    vi.resetModules();
    const { __testing: brokenTesting } = await import('../orchestrator');
    expect(await brokenTesting.consensusProvidersAreDistinct('a', 'b')).toBe(true);
  });
});
