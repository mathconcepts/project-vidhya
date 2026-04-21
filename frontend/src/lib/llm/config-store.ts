/**
 * LLM Config Store — client-side only
 *
 * Stores the user's LLM configuration in localStorage. Keys are masked
 * when displayed in the UI. The store is pure client-state — keys
 * NEVER leave the browser except as auth on outbound API requests.
 *
 * All changes go through the setter which also persists to localStorage
 * and emits a synthetic storage event so other tabs can react.
 */

const STORAGE_KEY = 'vidhya.llm.config.v1';
const HEADER_NAME = 'x-vidhya-llm-config';

// ============================================================================
// Types — mirror backend src/llm/config-resolver.ts
// ============================================================================

export type LLMRole = 'chat' | 'vision' | 'json';

export interface LLMConfig {
  primary_provider_id: string | null;
  primary_key: string | null;
  primary_endpoint_override?: string | null;
  overrides?: Partial<Record<LLMRole, {
    provider_id?: string | null;
    key?: string | null;
    model_id?: string | null;
    endpoint?: string | null;
  }>>;
  last_validated_at?: string | null;
  last_validation_ok?: boolean | null;
}

const EMPTY_CONFIG: LLMConfig = {
  primary_provider_id: null,
  primary_key: null,
};

// ============================================================================
// Read/write
// ============================================================================

export function loadConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_CONFIG };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...EMPTY_CONFIG };
    return { ...EMPTY_CONFIG, ...parsed };
  } catch {
    return { ...EMPTY_CONFIG };
  }
}

export function saveConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Emit a cross-tab notification
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(config),
      }));
    } catch { /* ignore — not all browsers allow synthetic StorageEvents */ }
  } catch (err) {
    console.warn('[llm-config] failed to persist config:', err);
  }
}

export function clearConfig(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function isConfigured(config: LLMConfig = loadConfig()): boolean {
  return !!config.primary_provider_id &&
    (!!config.primary_key || config.primary_provider_id === 'ollama');
}

// ============================================================================
// Key masking for UI display
// ============================================================================

export function maskKey(key: string | null): string {
  if (!key || key.length === 0) return '';
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

// ============================================================================
// Header injection — add config to outbound fetch calls
// ============================================================================

function encodeConfig(config: LLMConfig): string {
  const payload = {
    primary_provider_id: config.primary_provider_id,
    primary_key: config.primary_key,
    primary_endpoint_override: config.primary_endpoint_override,
    overrides: config.overrides,
  };
  const json = JSON.stringify(payload);
  // UTF-8 safe base64
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Build headers to merge into a fetch() call. Only includes the config
 * header when the user has a primary provider configured.
 */
export function buildAuthHeaders(): Record<string, string> {
  const config = loadConfig();
  if (!isConfigured(config)) return {};
  return { [HEADER_NAME]: encodeConfig(config) };
}

/**
 * Wrapper around fetch that injects the LLM config header automatically.
 * Use this for any API call that might need LLM capabilities.
 */
export async function fetchWithConfig(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const extraHeaders = buildAuthHeaders();
  const mergedHeaders = { ...extraHeaders, ...(init.headers || {}) };
  return fetch(input, { ...init, headers: mergedHeaders });
}

// ============================================================================
// Validation helpers (pre-submit sanity check)
// ============================================================================

export function validateKeyLocally(
  provider: { requires_key: boolean; key_format?: { prefix?: string; min_length?: number } } | null,
  key: string | null,
): { ok: boolean; reason?: string } {
  if (!provider) return { ok: false, reason: 'pick a provider first' };
  if (!provider.requires_key) return { ok: true };
  if (!key || key.trim().length === 0) return { ok: false, reason: 'API key is required for this provider' };
  if (provider.key_format?.prefix && !key.startsWith(provider.key_format.prefix)) {
    return { ok: false, reason: `key should start with "${provider.key_format.prefix}"` };
  }
  if (provider.key_format?.min_length && key.length < provider.key_format.min_length) {
    return { ok: false, reason: `key is shorter than expected (min ${provider.key_format.min_length} chars)` };
  }
  return { ok: true };
}

export { HEADER_NAME as LLM_CONFIG_HEADER };
