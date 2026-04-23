// @ts-nocheck
/**
 * LLM Bridge for the admin orchestrator + MCP server.
 *
 * This file is the ONLY place in the admin-orchestrator where an LLM
 * is called. It reuses the existing LLM configuration wrapper under
 * `src/llm/` — specifically:
 *
 *   - loadConfigFromEnv() from config-resolver — discovers provider
 *     config from environment variables (VIDHYA_LLM_PRIMARY_PROVIDER
 *     + VIDHYA_LLM_PRIMARY_KEY, or legacy GEMINI_API_KEY /
 *     ANTHROPIC_API_KEY / OPENAI_API_KEY / etc.)
 *
 *   - Provider adapters from adapters/ — GeminiAdapter,
 *     AnthropicAdapter, OpenAIAdapter, OllamaAdapter — which know how
 *     to format messages + call each provider's HTTP API.
 *
 * The bridge is deliberately thin. No YAML, no routing, no budget
 * tracking. The admin orchestrator only needs single-turn generation
 * with graceful failure.
 *
 * Failure modes, all of which return null (NOT throw):
 *   1. No provider + key in environment → null
 *   2. Provider id maps to no supported adapter → null
 *   3. Adapter call throws (network, 401, rate limit) → null
 *
 * Callers MUST treat null as the normal case when no LLM is configured.
 * Deterministic fallbacks always exist for the thing the caller wants
 * to do (narrate a strategy, summarize a health report, suggest a
 * next action). The LLM is icing, never the cake.
 */

import { loadConfigFromEnv } from '../llm/config-resolver';
import type { LLMConfig } from '../llm/config-resolver';
import type { ProviderId, GenerateRequest, Message, TaskType } from '../llm/types';
import { createAdapter } from '../llm/adapters';

// ============================================================================
// Provider id mapping
// ============================================================================

/**
 * Map the app-facing provider ids (stored in LLMConfig) to the ProviderId
 * the adapter factory accepts. Returns null if the caller's provider
 * can't be bridged to any supported adapter.
 *
 * Supported adapters: gemini, anthropic, openai, ollama, learnlm.
 * Unsupported here: openrouter, groq, deepseek, mistral — these would
 * need their own adapters before wiring in. Gracefully returning null
 * for these is correct: the bridge doesn't hallucinate support.
 */
function resolveProviderId(config: LLMConfig): ProviderId | null {
  const id = config.primary_provider_id;
  if (!id) return null;
  const table: Record<string, ProviderId> = {
    'gemini': 'gemini',
    'google-gemini': 'gemini',
    'anthropic': 'anthropic',
    'openai': 'openai',
    'ollama': 'ollama',
    'learnlm': 'learnlm',
  };
  return table[id] ?? null;
}

// ============================================================================
// Minimal ProviderConfig shapes
// ============================================================================

/**
 * Default model + cost stub per provider. Kept minimal because the
 * admin orchestrator uses fast/cheap models for short narrations. Real
 * costs + context windows are approximations sufficient for the
 * adapter's internal plumbing; the app pays no attention to these
 * numbers at this call site.
 */
const DEFAULT_CONFIGS: Record<ProviderId, any> = {
  gemini: {
    models: {
      'default': { id: 'gemini-2.0-flash-exp', contextWindow: 1048576, maxOutput: 8192, costPer1kInput: 0, costPer1kOutput: 0, tier: 'routine' },
    },
    fallbackOrder: ['default'],
  },
  learnlm: {
    models: {
      'default': { id: 'learnlm-1.5-pro-experimental', contextWindow: 32768, maxOutput: 8192, costPer1kInput: 0, costPer1kOutput: 0, tier: 'pedagogical' },
    },
    fallbackOrder: ['default'],
  },
  anthropic: {
    models: {
      'default': { id: 'claude-haiku-4-5-20251001', contextWindow: 200000, maxOutput: 8192, costPer1kInput: 0.00025, costPer1kOutput: 0.00125, tier: 'routine' },
    },
    fallbackOrder: ['default'],
  },
  openai: {
    models: {
      'default': { id: 'gpt-4o-mini', contextWindow: 128000, maxOutput: 16384, costPer1kInput: 0.00015, costPer1kOutput: 0.0006, tier: 'routine' },
    },
    fallbackOrder: ['default'],
  },
  ollama: {
    models: {
      'default': { id: 'llama3.2:3b', contextWindow: 128000, maxOutput: 4096, costPer1kInput: 0, costPer1kOutput: 0, tier: 'local' },
    },
    fallbackOrder: ['default'],
  },
};

// ============================================================================
// Public API
// ============================================================================

export interface BridgeCallInput {
  /** System prompt — e.g. "You are a terse admin strategy summarizer." */
  system?: string;
  /** The user prompt — what you actually want generated */
  user: string;
  /** Task type for downstream budget/routing tracking */
  task_type?: TaskType;
  /** Max output tokens; defaults to 200 for narration-style prompts */
  max_tokens?: number;
  /** Sampling temperature; defaults to 0.3 for deterministic narration */
  temperature?: number;
  /** Override config. If omitted, uses loadConfigFromEnv() */
  llm_config?: LLMConfig | null;
  /** Caller identifier for logging */
  agent_id?: string;
}

export interface BridgeCallOutput {
  content: string;
  provider: string;
  model: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_estimate_usd: number;
}

export interface BridgeCallMeta {
  attempted: boolean;
  /** Why call was skipped, if attempted=false */
  skip_reason?: 'no-config' | 'unsupported-provider' | 'no-key';
  /** Error if adapter threw */
  error?: string;
}

/**
 * Single-turn LLM call with graceful failure.
 *
 * Returns { output: BridgeCallOutput, meta: BridgeCallMeta } where
 * output is null if no LLM was called OR if the call failed. meta
 * always carries enough detail for the caller to log + fall back.
 */
export async function callLLMWithConfig(
  input: BridgeCallInput,
): Promise<{ output: BridgeCallOutput | null; meta: BridgeCallMeta }> {
  const config = input.llm_config ?? loadConfigFromEnv();
  if (!config) {
    return { output: null, meta: { attempted: false, skip_reason: 'no-config' } };
  }

  const providerId = resolveProviderId(config);
  if (!providerId) {
    return {
      output: null,
      meta: { attempted: false, skip_reason: 'unsupported-provider' },
    };
  }

  const apiKey = config.primary_key ?? null;
  if (!apiKey && providerId !== 'ollama') {
    // Ollama is keyless (local); every other provider requires a key.
    return { output: null, meta: { attempted: false, skip_reason: 'no-key' } };
  }

  const providerConfig = DEFAULT_CONFIGS[providerId];
  if (!providerConfig) {
    return { output: null, meta: { attempted: false, skip_reason: 'unsupported-provider' } };
  }

  let adapter: any;
  try {
    adapter = createAdapter(providerId, providerConfig, apiKey ?? undefined);
  } catch (err: any) {
    return { output: null, meta: { attempted: false, error: err.message ?? String(err) } };
  }

  const messages: Message[] = [];
  if (input.system) messages.push({ role: 'system', content: input.system });
  messages.push({ role: 'user', content: input.user });

  const genReq: GenerateRequest = {
    messages,
    taskType: input.task_type ?? 'summarization',
    agentId: input.agent_id ?? 'admin-orchestrator',
    maxTokens: input.max_tokens ?? 200,
    temperature: input.temperature ?? 0.3,
  };

  try {
    const resp = await adapter.generate(genReq);
    return {
      output: {
        content: resp.content,
        provider: resp.provider,
        model: resp.model,
        latency_ms: resp.latencyMs,
        input_tokens: resp.usage?.inputTokens ?? 0,
        output_tokens: resp.usage?.outputTokens ?? 0,
        cost_estimate_usd: resp.usage?.estimatedCostUsd ?? 0,
      },
      meta: { attempted: true },
    };
  } catch (err: any) {
    return { output: null, meta: { attempted: true, error: err.message ?? String(err) } };
  }
}

/**
 * Diagnostic helper — returns whether the environment is configured
 * to make LLM calls, without actually making one.
 */
export function describeLLMAvailability(): {
  available: boolean;
  provider_id: string | null;
  reason?: string;
} {
  const config = loadConfigFromEnv();
  if (!config) return { available: false, provider_id: null, reason: 'no-config' };
  const providerId = resolveProviderId(config);
  if (!providerId) return { available: false, provider_id: config.primary_provider_id, reason: 'unsupported-provider' };
  if (!config.primary_key && providerId !== 'ollama') {
    return { available: false, provider_id: providerId, reason: 'no-key' };
  }
  return { available: true, provider_id: providerId };
}
