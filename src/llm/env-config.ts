/**
 * env-config — bootstrap shim over the ONE config truth (src/llm/registry.ts).
 *
 * Until this file's history: orchestrator.ts's callLlm()/maybeEmbedQuery()
 * and llm-judge.ts's scoreAtom() fell back to `{ providers: {}, defaultProvider: '' }`
 * whenever LLM_CONFIG_PATH wasn't set (it never was, anywhere in this repo) —
 * an empty-providers config that made every generation/judging call fail
 * with "No adapter for provider: " and silently burn the LLM call budget.
 * config/providers.yaml (the real, populated provider registry) was never
 * actually wired to these call sites — this module's first version fixed
 * that by hand-duplicating one model per provider from env vars.
 *
 * That hand-duplication was itself a second, narrower config truth that
 * could silently drift from config/providers.yaml (CEO plan §8 names this
 * exact class of bug: "parallel truths that drift"). It's retired now:
 * buildLlmConfigFromEnv() below delegates entirely to registry.ts, which
 * reads config/providers.yaml directly. This file's remaining job is the
 * bootstrap shim (write the tracked file only if it's missing — see
 * registry.ts's ensureProvidersYamlBootstrap) and the live preflight check
 * used before a generation run spends its budget.
 */

import { buildLlmConfigFromRegistry, loadProvidersRegistry, ensureProvidersYamlBootstrap, type EnvLlmConfig } from './registry';

export type { EnvLlmConfig };

/**
 * @deprecated Prefer `loadLlmConfig()` from `./registry` directly — this
 * wrapper exists only so existing call sites (orchestrator.ts, llm-judge.ts,
 * content-generation-job.ts, setup-cli.ts) don't all need simultaneous
 * edits. It has the same "never throws, degrades to empty config" contract
 * the original had.
 */
export function buildLlmConfigFromEnv(): EnvLlmConfig {
  try {
    ensureProvidersYamlBootstrap();
    const registry = loadProvidersRegistry();
    return buildLlmConfigFromRegistry(registry);
  } catch (err) {
    console.warn(`[env-config] falling back to empty config: ${(err as Error).message}`);
    return { providers: {}, defaultProvider: '' };
  }
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
