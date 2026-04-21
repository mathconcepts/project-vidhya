// @ts-nocheck
/**
 * LLM Provider Registry — data-driven definitions
 *
 * Adding a new provider is a DATA change (append to PROVIDERS below), not
 * a code change. The client factory reads this registry to construct
 * requests for any supported backend.
 *
 * Every provider declares:
 *   - id (kebab-case): used in config
 *   - display metadata: name, logo, homepage
 *   - supported roles: which LLM tasks it can handle (chat, vision, json)
 *   - default models per role: what to use if user doesn't override
 *   - endpoint_template: optional custom endpoint (for OpenRouter, Ollama etc.)
 *   - capabilities: streaming, tool-use, image-input
 *   - key_format: hint for validation (e.g., starts-with "sk-")
 *   - key_docs_url: where to get a key
 *
 * Role taxonomy:
 *   chat      — conversational responses (streaming-friendly)
 *   vision    — image + text analysis
 *   json      — structured output generation (explainers, intent analysis)
 */

// ============================================================================
// Types
// ============================================================================

export type LLMRole = 'chat' | 'vision' | 'json';

export interface ProviderModel {
  /** Canonical model id as the provider's API expects it */
  id: string;
  /** User-facing label */
  label: string;
  /** Which roles this specific model can handle */
  roles: LLMRole[];
  /** Context window in tokens, for display */
  context_window: number;
  /** Rough cost tier: "free" | "cheap" | "mid" | "premium" */
  cost_tier: 'free' | 'cheap' | 'mid' | 'premium';
  /** Free-form note visible in UI */
  note?: string;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  homepage: string;
  key_docs_url: string;
  /** Short description shown in the UI */
  description: string;
  /** Logo/emoji used in picker cards (no external image dependency) */
  icon: string;
  /** How the API key typically looks, for client-side sanity check */
  key_format?: {
    prefix?: string;        // "sk-"
    min_length?: number;    // minimum characters
    max_length?: number;
  };
  /** Default endpoint — can be overridden per-role */
  default_endpoint: string;
  /** Whether the endpoint is user-configurable (for Ollama, OpenRouter etc.) */
  endpoint_overridable: boolean;
  /** Whether this provider needs an API key at all (local models don't) */
  requires_key: boolean;
  /** The models this provider offers */
  models: ProviderModel[];
  /** Default model id per role — must exist in the models list */
  default_models: Partial<Record<LLMRole, string>>;
  /** Capability flags used by client to decide request shape */
  capabilities: {
    streaming: boolean;
    json_mode: boolean;         // provider supports structured-JSON output
    image_input: boolean;
    system_prompt: boolean;
  };
  /** Authentication header shape — how to attach the key */
  auth: {
    header_name: string;        // "Authorization" or "x-api-key" or "x-goog-api-key"
    header_value_template: string; // "Bearer {key}" or "{key}"
  };
  /** API compatibility — used to pick the right request builder */
  api_shape: 'openai-compatible' | 'anthropic' | 'google-gemini' | 'ollama';
}

// ============================================================================
// Provider registry
// ============================================================================

export const PROVIDERS: ProviderDefinition[] = [
  // --------------------------------------------------------------------------
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    homepage: 'https://ai.google.dev',
    key_docs_url: 'https://aistudio.google.com/app/apikey',
    description: 'Google\'s multimodal models. Generous free tier, fast, vision-native.',
    icon: '✨',
    key_format: { prefix: 'AIza', min_length: 35, max_length: 45 },
    default_endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    endpoint_overridable: false,
    requires_key: true,
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', roles: ['chat', 'vision', 'json'], context_window: 1_000_000, cost_tier: 'cheap', note: 'best all-round default' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', roles: ['chat', 'vision', 'json'], context_window: 1_000_000, cost_tier: 'cheap', note: '3× cheaper, still vision-capable' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', roles: ['chat', 'vision', 'json'], context_window: 2_000_000, cost_tier: 'premium', note: 'highest quality, slower' },
    ],
    default_models: {
      chat: 'gemini-2.5-flash',
      vision: 'gemini-2.5-flash',
      json: 'gemini-2.5-flash-lite',  // cheaper for JSON-heavy tasks
    },
    capabilities: { streaming: true, json_mode: true, image_input: true, system_prompt: true },
    auth: { header_name: 'x-goog-api-key', header_value_template: '{key}' },
    api_shape: 'google-gemini',
  },

  // --------------------------------------------------------------------------
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    homepage: 'https://anthropic.com',
    key_docs_url: 'https://console.anthropic.com/settings/keys',
    description: 'Claude models. Best-in-class reasoning, careful outputs, vision on all recent models.',
    icon: '🤖',
    key_format: { prefix: 'sk-ant-', min_length: 40 },
    default_endpoint: 'https://api.anthropic.com/v1',
    endpoint_overridable: false,
    requires_key: true,
    models: [
      { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', roles: ['chat', 'vision', 'json'], context_window: 200_000, cost_tier: 'mid', note: 'best balance' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', roles: ['chat', 'vision', 'json'], context_window: 200_000, cost_tier: 'cheap', note: 'fastest' },
      { id: 'claude-opus-4-5', label: 'Claude Opus 4.5', roles: ['chat', 'vision', 'json'], context_window: 200_000, cost_tier: 'premium', note: 'highest quality' },
    ],
    default_models: {
      chat: 'claude-sonnet-4-5',
      vision: 'claude-sonnet-4-5',
      json: 'claude-haiku-4-5',
    },
    capabilities: { streaming: true, json_mode: true, image_input: true, system_prompt: true },
    auth: { header_name: 'x-api-key', header_value_template: '{key}' },
    api_shape: 'anthropic',
  },

  // --------------------------------------------------------------------------
  {
    id: 'openai',
    name: 'OpenAI',
    homepage: 'https://openai.com',
    key_docs_url: 'https://platform.openai.com/api-keys',
    description: 'GPT-4 family. Broad model selection, vision on 4o and above.',
    icon: '🟢',
    key_format: { prefix: 'sk-', min_length: 40 },
    default_endpoint: 'https://api.openai.com/v1',
    endpoint_overridable: false,
    requires_key: true,
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', roles: ['chat', 'vision', 'json'], context_window: 128_000, cost_tier: 'mid' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', roles: ['chat', 'vision', 'json'], context_window: 128_000, cost_tier: 'cheap', note: 'cheap vision' },
      { id: 'gpt-4.1', label: 'GPT-4.1', roles: ['chat', 'vision', 'json'], context_window: 200_000, cost_tier: 'mid' },
    ],
    default_models: {
      chat: 'gpt-4o',
      vision: 'gpt-4o',
      json: 'gpt-4o-mini',
    },
    capabilities: { streaming: true, json_mode: true, image_input: true, system_prompt: true },
    auth: { header_name: 'Authorization', header_value_template: 'Bearer {key}' },
    api_shape: 'openai-compatible',
  },

  // --------------------------------------------------------------------------
  {
    id: 'openrouter',
    name: 'OpenRouter',
    homepage: 'https://openrouter.ai',
    key_docs_url: 'https://openrouter.ai/keys',
    description: 'One key, 100+ models across providers. Good for experimentation.',
    icon: '🛣️',
    key_format: { prefix: 'sk-or-', min_length: 30 },
    default_endpoint: 'https://openrouter.ai/api/v1',
    endpoint_overridable: true,
    requires_key: true,
    models: [
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (via OpenRouter)', roles: ['chat', 'vision', 'json'], context_window: 1_000_000, cost_tier: 'cheap' },
      { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (via OpenRouter)', roles: ['chat', 'vision', 'json'], context_window: 200_000, cost_tier: 'mid' },
      { id: 'openai/gpt-4o', label: 'GPT-4o (via OpenRouter)', roles: ['chat', 'vision', 'json'], context_window: 128_000, cost_tier: 'mid' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', roles: ['chat', 'json'], context_window: 128_000, cost_tier: 'cheap', note: 'no vision' },
    ],
    default_models: {
      chat: 'google/gemini-2.5-flash',
      vision: 'google/gemini-2.5-flash',
      json: 'google/gemini-2.5-flash',
    },
    capabilities: { streaming: true, json_mode: true, image_input: true, system_prompt: true },
    auth: { header_name: 'Authorization', header_value_template: 'Bearer {key}' },
    api_shape: 'openai-compatible',
  },

  // --------------------------------------------------------------------------
  {
    id: 'groq',
    name: 'Groq',
    homepage: 'https://groq.com',
    key_docs_url: 'https://console.groq.com/keys',
    description: 'Ultra-fast inference on open models (Llama, Mixtral). No vision.',
    icon: '⚡',
    key_format: { prefix: 'gsk_', min_length: 40 },
    default_endpoint: 'https://api.groq.com/openai/v1',
    endpoint_overridable: false,
    requires_key: true,
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', roles: ['chat', 'json'], context_window: 128_000, cost_tier: 'cheap' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', roles: ['chat', 'json'], context_window: 128_000, cost_tier: 'free', note: 'extremely fast' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', roles: ['chat', 'json'], context_window: 32_768, cost_tier: 'cheap' },
    ],
    default_models: {
      chat: 'llama-3.3-70b-versatile',
      json: 'llama-3.1-8b-instant',
      // NOTE: no vision default — Groq doesn't support it. Client will
      // fall back to another provider if vision is needed.
    },
    capabilities: { streaming: true, json_mode: true, image_input: false, system_prompt: true },
    auth: { header_name: 'Authorization', header_value_template: 'Bearer {key}' },
    api_shape: 'openai-compatible',
  },

  // --------------------------------------------------------------------------
  {
    id: 'deepseek',
    name: 'DeepSeek',
    homepage: 'https://deepseek.com',
    key_docs_url: 'https://platform.deepseek.com/api_keys',
    description: 'Reasoning-heavy models at very low cost.',
    icon: '🔷',
    key_format: { prefix: 'sk-', min_length: 30 },
    default_endpoint: 'https://api.deepseek.com/v1',
    endpoint_overridable: false,
    requires_key: true,
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat', roles: ['chat', 'json'], context_window: 64_000, cost_tier: 'cheap' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', roles: ['chat', 'json'], context_window: 64_000, cost_tier: 'cheap', note: 'chain-of-thought' },
    ],
    default_models: {
      chat: 'deepseek-chat',
      json: 'deepseek-chat',
    },
    capabilities: { streaming: true, json_mode: true, image_input: false, system_prompt: true },
    auth: { header_name: 'Authorization', header_value_template: 'Bearer {key}' },
    api_shape: 'openai-compatible',
  },

  // --------------------------------------------------------------------------
  {
    id: 'mistral',
    name: 'Mistral',
    homepage: 'https://mistral.ai',
    key_docs_url: 'https://console.mistral.ai/api-keys',
    description: 'European-hosted open-weight models.',
    icon: '🌬️',
    key_format: { min_length: 30 },
    default_endpoint: 'https://api.mistral.ai/v1',
    endpoint_overridable: false,
    requires_key: true,
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large', roles: ['chat', 'json'], context_window: 128_000, cost_tier: 'mid' },
      { id: 'mistral-small-latest', label: 'Mistral Small', roles: ['chat', 'json'], context_window: 128_000, cost_tier: 'cheap' },
      { id: 'pixtral-large-latest', label: 'Pixtral Large', roles: ['chat', 'vision', 'json'], context_window: 128_000, cost_tier: 'mid', note: 'vision model' },
    ],
    default_models: {
      chat: 'mistral-small-latest',
      json: 'mistral-small-latest',
      vision: 'pixtral-large-latest',
    },
    capabilities: { streaming: true, json_mode: true, image_input: true, system_prompt: true },
    auth: { header_name: 'Authorization', header_value_template: 'Bearer {key}' },
    api_shape: 'openai-compatible',
  },

  // --------------------------------------------------------------------------
  {
    id: 'ollama',
    name: 'Ollama (local)',
    homepage: 'https://ollama.com',
    key_docs_url: 'https://ollama.com/download',
    description: 'Run models locally on your machine. No key needed, but slower.',
    icon: '🏠',
    default_endpoint: 'http://localhost:11434/v1',
    endpoint_overridable: true,
    requires_key: false,
    models: [
      { id: 'llama3.3:70b', label: 'Llama 3.3 70B', roles: ['chat', 'json'], context_window: 128_000, cost_tier: 'free' },
      { id: 'llama3.2:3b', label: 'Llama 3.2 3B', roles: ['chat', 'json'], context_window: 128_000, cost_tier: 'free', note: 'fits on most laptops' },
      { id: 'llava:34b', label: 'LLaVA 34B', roles: ['chat', 'vision', 'json'], context_window: 4_096, cost_tier: 'free', note: 'vision-capable' },
      { id: 'gemma2:27b', label: 'Gemma 2 27B', roles: ['chat', 'json'], context_window: 8_192, cost_tier: 'free' },
    ],
    default_models: {
      chat: 'llama3.2:3b',
      json: 'llama3.2:3b',
      vision: 'llava:34b',
    },
    capabilities: { streaming: true, json_mode: false, image_input: true, system_prompt: true },
    auth: { header_name: 'Authorization', header_value_template: 'Bearer {key}' }, // Ollama ignores; we send dummy
    api_shape: 'ollama',
  },
];

// ============================================================================
// Lookup helpers
// ============================================================================

export function getProvider(id: string): ProviderDefinition | null {
  return PROVIDERS.find(p => p.id === id) || null;
}

export function listProviders(): ProviderDefinition[] {
  return PROVIDERS;
}

/**
 * Find the first provider that supports a given role. Used as a fallback
 * when the user's primary provider can't handle (e.g.) vision.
 */
export function findProviderForRole(role: LLMRole, exclude: string[] = []): ProviderDefinition | null {
  return PROVIDERS.find(p =>
    !exclude.includes(p.id) &&
    p.capabilities[role === 'vision' ? 'image_input' : 'system_prompt'] &&
    p.default_models[role],
  ) || null;
}

export function getModelsForRole(provider_id: string, role: LLMRole): ProviderModel[] {
  const p = getProvider(provider_id);
  if (!p) return [];
  return p.models.filter(m => m.roles.includes(role));
}

export function validateKeyFormat(provider_id: string, key: string): { ok: boolean; reason?: string } {
  const p = getProvider(provider_id);
  if (!p) return { ok: false, reason: 'unknown provider' };
  if (!p.requires_key) return { ok: true };
  if (!key || key.trim().length === 0) return { ok: false, reason: 'key required' };
  if (p.key_format?.prefix && !key.startsWith(p.key_format.prefix)) {
    return { ok: false, reason: `key should start with "${p.key_format.prefix}"` };
  }
  if (p.key_format?.min_length && key.length < p.key_format.min_length) {
    return { ok: false, reason: `key looks too short (min ${p.key_format.min_length} chars)` };
  }
  return { ok: true };
}
