/**
 * env-config — builds a minimal LLMClient provider config directly from
 * environment variables.
 *
 * orchestrator.ts's callLlm()/maybeEmbedQuery() and llm-judge.ts's
 * scoreAtom() previously fell back to `{ providers: {}, defaultProvider: '' }`
 * whenever LLM_CONFIG_PATH wasn't set (it never was, anywhere in this repo) —
 * an empty-providers config that made every generation/judging call fail
 * with "No adapter for provider: " and silently burn the LLM call budget.
 * config/providers.yaml (the real, populated provider registry) was never
 * actually wired to these call sites. This fills that gap: if the relevant
 * API key env var is set, that provider is enabled with a real model.
 */

export interface EnvLlmConfig {
  providers: Record<string, {
    enabled: boolean;
    models: Record<string, { id: string; tier?: string; costPer1kInput?: number; costPer1kOutput?: number }>;
    fallbackOrder: string[];
  }>;
  defaultProvider: string;
}

export function buildLlmConfigFromEnv(): EnvLlmConfig {
  const providers: EnvLlmConfig['providers'] = {};

  if (process.env.GEMINI_API_KEY) {
    providers.gemini = {
      enabled: true,
      models: {
        flash: { id: 'gemini-2.0-flash', tier: 'routine', costPer1kInput: 0.000075, costPer1kOutput: 0.0003 },
      },
      fallbackOrder: ['flash'],
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.anthropic = {
      enabled: true,
      models: {
        sonnet: { id: 'claude-sonnet-4-20250514', tier: 'quality', costPer1kInput: 0.003, costPer1kOutput: 0.015 },
      },
      fallbackOrder: ['sonnet'],
    };
  }

  if (process.env.OPENAI_API_KEY) {
    providers.openai = {
      enabled: true,
      models: {
        gpt4o_mini: { id: 'gpt-4o-mini', tier: 'routine', costPer1kInput: 0.00015, costPer1kOutput: 0.0006 },
      },
      fallbackOrder: ['gpt4o_mini'],
    };
  }

  return {
    providers,
    defaultProvider: providers.gemini ? 'gemini' : Object.keys(providers)[0] || '',
  };
}
export interface ProviderPreflightResult {
  provider: string;
  ok: boolean;
  error?: string;
}

/**
 * Live health check: one minimal-cost call per configured (enabled)
 * provider, targeting its model explicitly with maxRetries: 0 so a
 * failure is attributed to the right provider instead of being masked by
 * fallback (the same bug class fixed in orchestrator.ts's callLlm()).
 *
 * Used by content-generation-job's preflight to fail fast — before the
 * job burns LLM-call budget churning through "No adapter" / "invalid
 * x-api-key" errors concept-by-concept — with a clear per-provider
 * diagnostic instead.
 */
export async function preflightProviders(
  config: EnvLlmConfig = buildLlmConfigFromEnv(),
): Promise<ProviderPreflightResult[]> {
  const { LLMClient } = await import('./index');
  const client = new (LLMClient as any)(config);
  const results: ProviderPreflightResult[] = [];

  for (const [providerId, pconfig] of Object.entries(config.providers)) {
    if (!pconfig.enabled) continue;
    const modelKey = pconfig.fallbackOrder[0];
    const modelId = modelKey ? pconfig.models[modelKey]?.id : undefined;
    if (!modelId) {
      results.push({ provider: providerId, ok: false, error: 'no model configured' });
      continue;
    }
    try {
      await client.generate({
        messages: [{ role: 'user', content: 'ping' }],
        taskType: 'preflight',
        model: modelId,
        maxRetries: 0,
      });
      results.push({ provider: providerId, ok: true });
    } catch (err) {
      results.push({ provider: providerId, ok: false, error: (err as Error).message });
    }
  }

  return results;
}
