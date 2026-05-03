// @ts-nocheck
/**
 * LLM Config Routes
 *
 * HTTP endpoints for the frontend LLMConfigPage:
 *
 *   GET  /api/llm/providers         — full provider registry (no secrets)
 *   POST /api/llm/validate          — test that a key works with its provider
 *   POST /api/llm/test-chat         — round-trip test with a prompt (uses user's config)
 *   POST /api/llm/resolve           — resolve a config into per-role plan (for UI preview)
 *
 * CRITICAL: The server NEVER persists keys. Keys arrive in request bodies
 * or the X-Vidhya-Llm-Config header, are used for this single request,
 * and are discarded when the handler returns.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import {
  listProviders,
  getProvider,
  validateKeyFormat,
  type LLMRole,
} from '../llm/provider-registry';
import {
  resolveConfig,
  summarize,
  getConfigFromRequest,
  type LLMConfig,
} from '../llm/config-resolver';

// ============================================================================
// 1. List providers — full registry, no secrets
// ============================================================================

async function handleListProviders(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, {
    providers: listProviders().map(p => ({
      id: p.id,
      name: p.name,
      homepage: p.homepage,
      key_docs_url: p.key_docs_url,
      description: p.description,
      icon: p.icon,
      key_format: p.key_format,
      requires_key: p.requires_key,
      endpoint_overridable: p.endpoint_overridable,
      default_endpoint: p.default_endpoint,
      capabilities: p.capabilities,
      models: p.models,
      default_models: p.default_models,
    })),
  });
}

// ============================================================================
// 2. Validate — test that a key actually works
// ============================================================================

async function handleValidate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const { provider_id, key, endpoint } = body;
  if (!provider_id || typeof provider_id !== 'string') {
    return sendError(res, 400, 'provider_id required');
  }
  const provider = getProvider(provider_id);
  if (!provider) return sendError(res, 404, 'unknown provider');

  // Client-side format check first (cheap)
  if (provider.requires_key) {
    const fmt = validateKeyFormat(provider_id, key || '');
    if (!fmt.ok) {
      return sendJSON(res, { valid: false, stage: 'format', reason: fmt.reason }, 200);
    }
  }

  // Live validation — make a minimal, cheap call to the provider's list/models
  // or a 1-token chat, depending on api_shape.
  const usedEndpoint = endpoint || provider.default_endpoint;

  // If the endpoint points at the user's own machine (Ollama, LM Studio,
  // local custom proxy) and THIS server isn't running locally, the fetch
  // will always fail — Render can't reach the user's localhost. Surface
  // a friendly skip rather than a confusing "fetch failed".
  if (isLocalEndpoint(usedEndpoint) && !isLocalServer(req.headers.host)) {
    return sendJSON(
      res,
      {
        valid: false,
        stage: 'skipped',
        reason:
          'This endpoint points at localhost on your machine. The hosted ' +
          'server can\'t reach it. If you\'re running it locally, click ' +
          '"Save without testing" — your browser will reach it directly ' +
          'when you actually use the app.',
      },
      200,
    );
  }

  try {
    const result = await performLiveValidation({
      provider_id,
      endpoint: usedEndpoint,
      key: key || '',
    });
    sendJSON(res, { valid: result.valid, stage: 'live', reason: result.reason, latency_ms: result.latency_ms });
  } catch (err) {
    sendJSON(res, { valid: false, stage: 'live', reason: (err as Error).message }, 200);
  }
}

export const __testing = { isLocalEndpoint: (e: string | undefined) => isLocalEndpoint(e), isLocalServer: (h: string | string[] | undefined) => isLocalServer(h) };

function isLocalEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) return false;
  try {
    const u = new URL(endpoint);
    // URL parser preserves brackets around IPv6 addresses (e.g. "[::1]") —
    // strip them before comparing.
    const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0';
  } catch {
    return false;
  }
}

function isLocalServer(host: string | string[] | undefined): boolean {
  const h = (Array.isArray(host) ? host[0] : host) ?? '';
  const bare = h.split(':')[0].toLowerCase();
  return bare === 'localhost' || bare === '127.0.0.1' || bare === '0.0.0.0';
}

// ============================================================================
// 3. Resolve — show the user what each role will end up using
// ============================================================================

async function handleResolve(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const config: LLMConfig = {
    primary_provider_id: body.primary_provider_id,
    primary_key: body.primary_key,
    primary_endpoint_override: body.primary_endpoint_override,
    overrides: body.overrides,
  };
  const resolved = resolveConfig(config);
  sendJSON(res, { summary: summarize(resolved), resolved });
}

// ============================================================================
// 4. Test chat — real round-trip for the Test button in UI
// ============================================================================

async function handleTestChat(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const config = getConfigFromRequest(req.headers);
  if (!config) return sendError(res, 400, 'No LLM config — provide via body or header');

  const body = (req.body as any) || {};
  const prompt = typeof body.prompt === 'string' && body.prompt.length > 0
    ? body.prompt
    : 'Reply with exactly: ok';
  const role: LLMRole = body.role === 'vision' || body.role === 'json' ? body.role : 'chat';

  const resolved = resolveConfig(config);
  const r = resolved[role];
  if (!r) return sendError(res, 400, `no provider configured for role=${role}`);

  try {
    const started = Date.now();
    const text = await callChat({
      provider_id: r.provider_id,
      endpoint: r.endpoint,
      key: r.key,
      model_id: r.model_id,
      prompt,
    });
    sendJSON(res, {
      ok: true,
      role,
      provider: r.provider.name,
      model: r.model_id,
      response: text.slice(0, 500),
      latency_ms: Date.now() - started,
    });
  } catch (err) {
    sendJSON(res, { ok: false, error: (err as Error).message });
  }
}

// ============================================================================
// Backend adapters — minimal, provider-shape-aware
// ============================================================================

interface ValidationResult {
  valid: boolean;
  reason?: string;
  latency_ms?: number;
}

async function performLiveValidation(params: {
  provider_id: string;
  endpoint: string;
  key: string;
}): Promise<ValidationResult> {
  // For every provider we just do a minimal chat with the default model.
  // Cheaper than listing models and exercises the same auth path.
  const provider = getProvider(params.provider_id);
  if (!provider) return { valid: false, reason: 'unknown provider' };
  const model_id = provider.default_models.chat || provider.default_models.json;
  if (!model_id) return { valid: false, reason: 'no test model available' };

  const started = Date.now();
  try {
    const text = await callChat({
      provider_id: params.provider_id,
      endpoint: params.endpoint,
      key: params.key,
      model_id,
      prompt: 'Say exactly: ok',
      max_tokens: 10,
    });
    return { valid: !!text, latency_ms: Date.now() - started };
  } catch (err) {
    return { valid: false, reason: (err as Error).message, latency_ms: Date.now() - started };
  }
}

/**
 * Universal chat adapter — dispatches on provider.api_shape.
 */
async function callChat(params: {
  provider_id: string;
  endpoint: string;
  key: string | null;
  model_id: string;
  prompt: string;
  max_tokens?: number;
}): Promise<string> {
  const provider = getProvider(params.provider_id);
  if (!provider) throw new Error('unknown provider');
  const max_tokens = params.max_tokens ?? 32;
  const startedAt = Date.now();
  const recordOutcome = (status: number) => {
    // Fire-and-forget telemetry; never throws.
    try {
      const { recordCall, outcomeFromStatus } = require('../llm/rate-limit-tracker');
      recordCall({
        provider: params.provider_id,
        model: params.model_id,
        outcome: outcomeFromStatus(status),
        latency_ms: Date.now() - startedAt,
        ts: new Date().toISOString(),
      });
    } catch { /* swallow — telemetry must never break a real call */ }
  };

  switch (provider.api_shape) {
    case 'google-gemini': {
      // Gemini REST: /v1beta/models/{model}:generateContent?key=...
      const url = `${params.endpoint}/models/${params.model_id}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [provider.auth.header_name]: params.key || '',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
          generationConfig: { maxOutputTokens: max_tokens, temperature: 0 },
        }),
      });
      recordOutcome(res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    case 'anthropic': {
      const url = `${params.endpoint}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          [provider.auth.header_name]: params.key || '',
        },
        body: JSON.stringify({
          model: params.model_id,
          max_tokens,
          messages: [{ role: 'user', content: params.prompt }],
        }),
      });
      recordOutcome(res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      return json.content?.[0]?.text || '';
    }

    case 'openai-compatible':
    case 'ollama': {
      const url = `${params.endpoint}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (params.key) {
        headers[provider.auth.header_name] = provider.auth.header_value_template.replace('{key}', params.key);
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.model_id,
          messages: [{ role: 'user', content: params.prompt }],
          max_tokens,
          temperature: 0,
        }),
      });
      recordOutcome(res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    }

    default:
      throw new Error(`unsupported api_shape: ${provider.api_shape}`);
  }
}

// ============================================================================
// Export
// ============================================================================

export const llmConfigRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/llm/providers', handler: handleListProviders },
  { method: 'POST', path: '/api/llm/validate',  handler: handleValidate },
  { method: 'POST', path: '/api/llm/resolve',   handler: handleResolve },
  { method: 'POST', path: '/api/llm/test-chat', handler: handleTestChat },
];

// Export the adapter so other server modules can use it
export { callChat };
