// @ts-nocheck
/**
 * LLM Config Resolver
 *
 * Takes a user's LLMConfig (primary provider + optional per-role overrides)
 * and returns fully-resolved role configurations the server can use.
 *
 * Cascading rules:
 *   1. If a role has an explicit override, use it
 *   2. Else use the primary provider's default for that role
 *   3. If the primary can't handle the role (e.g., Groq has no vision),
 *      fall back to a provider that can
 *   4. If still nothing, return null — server operates in bundle-only mode
 */

import {
  getProvider,
  findProviderForRole,
  type ProviderDefinition,
  type LLMRole,
} from './provider-registry';

// ============================================================================
// Types
// ============================================================================

/**
 * What gets stored in the client's localStorage and sent in request headers.
 */
export interface LLMConfig {
  /** The primary provider id — the one selected in the Quick Setup */
  primary_provider_id: string | null;
  /** Primary provider's API key (or null for keyless providers like Ollama) */
  primary_key: string | null;
  /** Optional custom endpoint — overrides the provider's default_endpoint */
  primary_endpoint_override?: string | null;

  /**
   * Per-role overrides. Each role can independently override:
   *   - provider_id (use a different provider for this role)
   *   - key (different key, useful for user who pays for two services)
   *   - model_id (different model within the same provider)
   *   - endpoint (custom endpoint)
   * Any omitted field falls back to the primary / provider default.
   */
  overrides?: Partial<Record<LLMRole, {
    provider_id?: string | null;
    key?: string | null;
    model_id?: string | null;
    endpoint?: string | null;
  }>>;

  /** Timestamp of last validation against provider, for UI */
  last_validated_at?: string | null;
  /** true if last validation succeeded */
  last_validation_ok?: boolean | null;
}

/**
 * Fully resolved config for ONE role. This is what the server handlers see.
 */
export interface ResolvedRoleConfig {
  role: LLMRole;
  provider_id: string;
  provider: ProviderDefinition;
  model_id: string;
  endpoint: string;
  key: string | null;
  /** Was this resolved from primary vs override vs fallback? */
  source: 'primary' | 'override' | 'fallback';
}

export interface ResolvedLLMConfig {
  chat: ResolvedRoleConfig | null;
  vision: ResolvedRoleConfig | null;
  json: ResolvedRoleConfig | null;
}

// ============================================================================
// Resolution
// ============================================================================

function resolveOneRole(
  role: LLMRole,
  config: LLMConfig,
): ResolvedRoleConfig | null {
  const override = config.overrides?.[role];
  const primaryId = config.primary_provider_id;

  // Try override → primary → fallback in order
  const candidates: Array<{ provider_id: string; key: string | null; endpoint: string | null; model_id: string | null; source: ResolvedRoleConfig['source'] }> = [];

  if (override?.provider_id || override?.model_id || override?.key || override?.endpoint) {
    candidates.push({
      provider_id: override.provider_id || primaryId || '',
      key: override.key ?? null,
      endpoint: override.endpoint ?? null,
      model_id: override.model_id ?? null,
      source: 'override',
    });
  }

  if (primaryId) {
    candidates.push({
      provider_id: primaryId,
      key: config.primary_key,
      endpoint: config.primary_endpoint_override ?? null,
      model_id: null,
      source: 'primary',
    });
  }

  // Walk candidates; the first one that can serve the role wins
  for (const cand of candidates) {
    const provider = getProvider(cand.provider_id);
    if (!provider) continue;

    // Check capability
    const hasRole = cand.model_id
      ? !!provider.models.find(m => m.id === cand.model_id && m.roles.includes(role))
      : !!provider.default_models[role];
    if (!hasRole) continue;

    // Check key availability
    if (provider.requires_key && (!cand.key || cand.key.trim().length === 0)) continue;

    const model_id = cand.model_id || provider.default_models[role]!;
    const endpoint = cand.endpoint || provider.default_endpoint;
    return {
      role,
      provider_id: provider.id,
      provider,
      model_id,
      endpoint,
      key: cand.key,
      source: cand.source,
    };
  }

  // Fallback — find any provider that can handle the role (requires some key
  // to be configured at all for that provider; for MVP we skip — resolver
  // returns null and server handler falls back to keyless/bundle-only mode)
  return null;
}

/**
 * Resolve the full config across all three roles.
 */
export function resolveConfig(config: LLMConfig): ResolvedLLMConfig {
  return {
    chat: resolveOneRole('chat', config),
    vision: resolveOneRole('vision', config),
    json: resolveOneRole('json', config),
  };
}

/**
 * A compact summary for the UI — shows which provider/model each role
 * ended up with, helpful for the "here's what will happen" panel.
 */
export interface ResolutionSummary {
  chat: { provider: string; model: string; source: string } | null;
  vision: { provider: string; model: string; source: string } | null;
  json: { provider: string; model: string; source: string } | null;
  any_configured: boolean;
}

export function summarize(resolved: ResolvedLLMConfig): ResolutionSummary {
  const row = (r: ResolvedRoleConfig | null) =>
    r ? { provider: r.provider.name, model: r.model_id, source: r.source } : null;
  return {
    chat: row(resolved.chat),
    vision: row(resolved.vision),
    json: row(resolved.json),
    any_configured: !!(resolved.chat || resolved.vision || resolved.json),
  };
}

// ============================================================================
// Header-based transport — config travels in request headers
// ============================================================================

export const LLM_CONFIG_HEADER = 'x-vidhya-llm-config';

/**
 * Encode config for transport. Base64-encoded JSON. Kept minimal — only
 * fields the server needs for this request.
 */
export function encodeConfigForHeader(config: LLMConfig): string {
  // Don't send timestamps or validation state over the wire
  const payload = {
    primary_provider_id: config.primary_provider_id,
    primary_key: config.primary_key,
    primary_endpoint_override: config.primary_endpoint_override,
    overrides: config.overrides,
  };
  // btoa equivalent for Node + browser
  const json = JSON.stringify(payload);
  if (typeof Buffer !== 'undefined') return Buffer.from(json, 'utf-8').toString('base64');
  // @ts-ignore — btoa is available in browser
  return typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : json;
}

/**
 * Decode a header value on the server side. Returns null on any error,
 * so server handlers degrade gracefully to env-var mode.
 */
export function decodeConfigFromHeader(value: string | undefined | null): LLMConfig | null {
  if (!value || typeof value !== 'string') return null;
  try {
    const buf = typeof Buffer !== 'undefined'
      ? Buffer.from(value, 'base64').toString('utf-8')
      // @ts-ignore
      : (typeof atob === 'function' ? decodeURIComponent(escape(atob(value))) : value);
    const parsed = JSON.parse(buf);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as LLMConfig;
  } catch {
    return null;
  }
}

// ============================================================================
// Server-side helper: env-var fallback
// ============================================================================

/**
 * When no client config is provided (e.g., during CI / admin tools), the
 * server falls back to environment variables. This keeps existing
 * deployment workflows working.
 *
 * Env vars checked (in order):
 *   VIDHYA_LLM_PRIMARY_PROVIDER  (defaults to 'google-gemini' if GEMINI_API_KEY exists)
 *   VIDHYA_LLM_PRIMARY_KEY       (or the provider-specific env var — GEMINI_API_KEY, ANTHROPIC_API_KEY, etc.)
 */
export function loadConfigFromEnv(): LLMConfig | null {
  const explicitProvider = process.env.VIDHYA_LLM_PRIMARY_PROVIDER;
  const explicitKey = process.env.VIDHYA_LLM_PRIMARY_KEY;
  if (explicitProvider && explicitKey) {
    return {
      primary_provider_id: explicitProvider,
      primary_key: explicitKey,
    };
  }
  // Legacy compat — check well-known provider env vars
  const legacyMap: Array<{ env: string; provider: string }> = [
    { env: 'GEMINI_API_KEY', provider: 'google-gemini' },
    { env: 'ANTHROPIC_API_KEY', provider: 'anthropic' },
    { env: 'OPENAI_API_KEY', provider: 'openai' },
    { env: 'OPENROUTER_API_KEY', provider: 'openrouter' },
    { env: 'GROQ_API_KEY', provider: 'groq' },
    { env: 'DEEPSEEK_API_KEY', provider: 'deepseek' },
    { env: 'MISTRAL_API_KEY', provider: 'mistral' },
  ];
  for (const m of legacyMap) {
    const key = process.env[m.env];
    if (key) return { primary_provider_id: m.provider, primary_key: key };
  }
  return null;
}

/**
 * Utility for request handlers — extract config from headers or env fallback.
 */
export function getConfigFromRequest(headers: Record<string, any>): LLMConfig | null {
  const headerValue = headers[LLM_CONFIG_HEADER] || headers[LLM_CONFIG_HEADER.toLowerCase()];
  const fromHeader = decodeConfigFromHeader(
    Array.isArray(headerValue) ? headerValue[0] : headerValue,
  );
  if (fromHeader) return fromHeader;
  return loadConfigFromEnv();
}
