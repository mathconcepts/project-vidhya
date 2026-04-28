// @ts-nocheck
/**
 * src/llm/runtime.ts
 *
 * Runtime-friendly LLM helper for hot paths.
 *
 * BACKGROUND
 * ──────────
 * The codebase already has a comprehensive LLM abstraction at src/llm/
 * (LLMClient, ModelRouter, adapters for gemini/anthropic/openai/ollama,
 * provider-registry, config-resolver). But that layer requires a YAML
 * config file at boot — heavyweight for runtime hot paths that just
 * want "give me a chat model I can call right now."
 *
 * As a result, ~12 hot-path files imported `@google/generative-ai`
 * directly and called Gemini specifically, defeating the abstraction.
 *
 * This file is the thin runtime layer that closes the gap. It builds
 * on the existing config-resolver + provider-registry, but provides
 * a minimal API hot paths can use:
 *
 *   const llm = await getLlmForRole('chat', req.headers);
 *   if (!llm) return null;
 *   const text = await llm.generate(prompt);
 *   // or
 *   for await (const chunk of llm.generateStream(prompt)) yield chunk;
 *
 * Configuration cascades exactly the same way as the existing layer:
 *   1. Per-request header (X-Vidhya-Llm-Config) — user-supplied client config
 *   2. Env vars (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
 *   3. null → caller graceful-degrades (no LLM available)
 *
 * The four API shapes (openai-compatible, anthropic, google-gemini, ollama)
 * are dispatched in this file via fetch() — same pattern the existing
 * adapters use, just stateless (no health tracking, no retry logic — those
 * belong at the adapter layer when LLMClient is fully wired in).
 *
 * KEEPING THIS THIN ON PURPOSE
 * ────────────────────────────
 * Things this file deliberately does NOT do:
 *   - No retry / fallback (caller does its own try/catch)
 *   - No health tracking (the adapter layer does this; runtime doesn't need it)
 *   - No budget tracking (handlers wire src/lib/llm-budget.ts directly when
 *     they want it — keeps cost protection at the handler boundary, where
 *     the actor_id is available)
 *   - No automatic provider switching (the config resolver picks one;
 *     runtime calls it; if it fails, caller decides)
 *
 * Everything that's useful but optional belongs at the LLMClient layer.
 * This is the thin runtime path that REPLACES the direct
 * `new GoogleGenerativeAI(...)` pattern.
 */

import type { LLMRole } from './provider-registry';
import { getProvider } from './provider-registry';
import {
  getConfigFromRequest,
  resolveConfig,
  type ResolvedRoleConfig,
} from './config-resolver';

// ─── Public API ────────────────────────────────────────────────────

/**
 * What hot-path callers get back. Wraps the resolved config with a
 * normalized generate() / generateStream() / embed() API.
 */
export interface RuntimeLLM {
  /** Provider id (e.g. 'google-gemini', 'anthropic'). For logging. */
  provider_id: string;
  /** Model id (e.g. 'gemini-2.5-flash', 'claude-haiku-4-5-20251001'). */
  model_id:    string;
  /** Role this LLM was resolved for. */
  role:        LLMRole;

  /**
   * One-shot generation. Takes a prompt (string) or a multipart input
   * (string + image). Returns the response text or null on failure.
   *
   * The image input is a uniform shape across providers:
   *   { text: string; image?: { mimeType: string; data: string } }
   * where data is base64.
   *
   * Returns null on:
   *   - Network error
   *   - Provider returned non-OK
   *   - Provider returned empty content
   * Always logs the failure reason to console.error before returning null.
   */
  generate(input: string | GenerateInput, opts?: GenerateOptions): Promise<string | null>;

  /**
   * Streaming generation. Yields text chunks as the provider streams them.
   * On error, throws — caller should wrap in try/catch.
   *
   * Note: not all providers stream the same way. Providers without native
   * streaming will yield the full response as one chunk.
   */
  generateStream(input: string | GenerateInput, opts?: GenerateOptions): AsyncGenerator<string>;
}

export interface GenerateInput {
  text:     string;
  /** Optional image — base64 data + MIME type. Requires vision-capable model. */
  image?:   { mimeType: string; data: string };
  /** Optional system prompt. Inlined for providers without native system support. */
  system?:  string;
  /** Optional prior turns for chat history. */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface GenerateOptions {
  temperature?: number;        // default 0.7
  maxTokens?:   number;        // default 4096
  topP?:        number;        // default 0.95
}

/**
 * Resolve an LLM for a role, given request headers.
 *
 * Returns null when no provider is configured — caller graceful-degrades.
 *
 * Headers are optional; if undefined, falls back to env vars only. This
 * lets hot paths that don't have request access (background jobs,
 * helpers called from multiple places) still call this.
 */
export async function getLlmForRole(
  role: LLMRole,
  headers?: Record<string, any>,
): Promise<RuntimeLLM | null> {
  const config = headers ? getConfigFromRequest(headers) : (await import('./config-resolver')).loadConfigFromEnv();
  if (!config) return null;

  const resolved = resolveConfig(config);
  const roleConfig = resolved[role];
  if (!roleConfig) return null;

  return new RuntimeLLMImpl(roleConfig);
}

/**
 * Embedding-only helper. Embeddings don't have a "role" in the registry
 * (they're always JSON-shape and use a separate model class), so this is
 * its own entry point. Returns null on failure or no provider.
 */
export async function embedText(
  text: string,
  headers?: Record<string, any>,
): Promise<{ embedding: number[]; dim: number; provider_id: string; model_id: string } | null> {
  const config = headers ? getConfigFromRequest(headers) : (await import('./config-resolver')).loadConfigFromEnv();
  if (!config) return null;

  // Embeddings only on Gemini today (Anthropic doesn't expose embeddings;
  // OpenAI does but pricing is different). If primary isn't Gemini, fall
  // back to env-only Gemini.
  const primaryId = config.primary_provider_id;
  if (primaryId === 'google-gemini' && config.primary_key) {
    return embedViaGemini(text, config.primary_key);
  }
  // Try env GEMINI_API_KEY as a final fallback
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) return embedViaGemini(text, envKey);

  // OpenAI embeddings fallback
  if (primaryId === 'openai' && config.primary_key) {
    return embedViaOpenAI(text, config.primary_key);
  }
  const openAiEnvKey = process.env.OPENAI_API_KEY;
  if (openAiEnvKey) return embedViaOpenAI(text, openAiEnvKey);

  return null;
}

// ─── Implementation ────────────────────────────────────────────────

class RuntimeLLMImpl implements RuntimeLLM {
  provider_id: string;
  model_id:    string;
  role:        LLMRole;
  private resolved: ResolvedRoleConfig;

  constructor(resolved: ResolvedRoleConfig) {
    this.resolved    = resolved;
    this.provider_id = resolved.provider_id;
    this.model_id    = resolved.model_id;
    this.role        = resolved.role;
  }

  async generate(input: string | GenerateInput, opts: GenerateOptions = {}): Promise<string | null> {
    const normalized = typeof input === 'string' ? { text: input } : input;
    try {
      switch (this.resolved.provider.api_shape) {
        case 'google-gemini':       return await callGemini(this.resolved, normalized, opts, false);
        case 'anthropic':           return await callAnthropic(this.resolved, normalized, opts, false);
        case 'openai-compatible':   return await callOpenAICompat(this.resolved, normalized, opts, false);
        case 'ollama':              return await callOllama(this.resolved, normalized, opts, false);
        default:
          console.error(`[llm/runtime] unknown api_shape: ${this.resolved.provider.api_shape}`);
          return null;
      }
    } catch (e: any) {
      console.error(`[llm/runtime] generate failed (${this.provider_id}/${this.model_id}): ${e?.message ?? e}`);
      return null;
    }
  }

  async *generateStream(input: string | GenerateInput, opts: GenerateOptions = {}): AsyncGenerator<string> {
    const normalized = typeof input === 'string' ? { text: input } : input;
    switch (this.resolved.provider.api_shape) {
      case 'google-gemini': {
        // Use the SSE streaming endpoint
        for await (const chunk of streamGemini(this.resolved, normalized, opts)) yield chunk;
        return;
      }
      case 'anthropic': {
        for await (const chunk of streamAnthropic(this.resolved, normalized, opts)) yield chunk;
        return;
      }
      case 'openai-compatible': {
        for await (const chunk of streamOpenAICompat(this.resolved, normalized, opts)) yield chunk;
        return;
      }
      case 'ollama': {
        for await (const chunk of streamOllama(this.resolved, normalized, opts)) yield chunk;
        return;
      }
      default:
        // Fallback — non-streaming providers yield the full response as one chunk
        const text = await this.generate(input, opts);
        if (text) yield text;
        return;
    }
  }
}

// ─── Provider dispatchers ──────────────────────────────────────────

const DEFAULT_MAX_TOKENS  = 4096;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P       = 0.95;

// ─ Gemini (google-gemini api_shape) ───

async function callGemini(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
  stream: boolean,
): Promise<string | null> {
  const url = `${resolved.endpoint}/v1beta/models/${resolved.model_id}:${stream ? 'streamGenerateContent' : 'generateContent'}`;
  const body = buildGeminiBody(input, opts);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': resolved.key || '',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text || null;
}

async function* streamGemini(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
): AsyncGenerator<string> {
  const url = `${resolved.endpoint}/v1beta/models/${resolved.model_id}:streamGenerateContent?alt=sse`;
  const body = buildGeminiBody(input, opts);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': resolved.key || '',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini stream ${response.status}: ${errText.slice(0, 200)}`);
  }
  yield* readSseStream(response, (json) => json.candidates?.[0]?.content?.parts?.[0]?.text || '');
}

function buildGeminiBody(input: GenerateInput, opts: GenerateOptions): any {
  const parts: any[] = [];
  if (input.text) parts.push({ text: input.text });
  if (input.image) parts.push({ inlineData: { mimeType: input.image.mimeType, data: input.image.data } });
  // History becomes contents[] in role/parts shape; we keep it simple — only
  // a single user turn here. Hot paths needing multi-turn use the chat-routes
  // streaming flow which calls this with the full history pre-formatted.
  const contents: any[] = [];
  if (input.history) {
    for (const h of input.history) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
  }
  // System gets prepended to the user turn for Gemini (no native system role).
  const systemPrefix = input.system ? `System: ${input.system}\n\n` : '';
  if (systemPrefix && parts[0]?.text !== undefined) {
    parts[0].text = systemPrefix + parts[0].text;
  }
  contents.push({ role: 'user', parts });
  return {
    contents,
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature:     opts.temperature ?? DEFAULT_TEMPERATURE,
      topP:            opts.topP ?? DEFAULT_TOP_P,
    },
  };
}

// ─ Anthropic (anthropic api_shape) ───

async function callAnthropic(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
  stream: boolean,
): Promise<string | null> {
  const url = `${resolved.endpoint}/v1/messages`;
  const body = buildAnthropicBody(resolved.model_id, input, opts, stream);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': resolved.key || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  return text || null;
}

async function* streamAnthropic(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
): AsyncGenerator<string> {
  const url = `${resolved.endpoint}/v1/messages`;
  const body = buildAnthropicBody(resolved.model_id, input, opts, true);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': resolved.key || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic stream ${response.status}: ${errText.slice(0, 200)}`);
  }
  yield* readSseStream(response, (json) => {
    if (json.type === 'content_block_delta') return json.delta?.text || '';
    return '';
  });
}

function buildAnthropicBody(modelId: string, input: GenerateInput, opts: GenerateOptions, stream: boolean): any {
  const messages: any[] = [];
  if (input.history) {
    for (const h of input.history) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  // User turn — text + optional image
  if (input.image) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: input.text },
        {
          type: 'image',
          source: { type: 'base64', media_type: input.image.mimeType, data: input.image.data },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: input.text });
  }
  const body: any = {
    model:       modelId,
    max_tokens:  opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
    top_p:       opts.topP ?? DEFAULT_TOP_P,
    messages,
    stream,
  };
  if (input.system) body.system = input.system;
  return body;
}

// ─ OpenAI-compatible (openai-compatible api_shape) ───
// Used by OpenAI, Groq, OpenRouter, DeepSeek, Mistral, etc.

async function callOpenAICompat(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
  stream: boolean,
): Promise<string | null> {
  const url = `${resolved.endpoint}/v1/chat/completions`;
  const body = buildOpenAIBody(resolved.model_id, input, opts, stream);
  const auth = resolved.provider.auth;
  const headers: any = { 'Content-Type': 'application/json' };
  if (resolved.key) {
    headers[auth.header_name] = auth.header_value_template.replace('{key}', resolved.key);
  }
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI-compat ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return text || null;
}

async function* streamOpenAICompat(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
): AsyncGenerator<string> {
  const url = `${resolved.endpoint}/v1/chat/completions`;
  const body = buildOpenAIBody(resolved.model_id, input, opts, true);
  const auth = resolved.provider.auth;
  const headers: any = { 'Content-Type': 'application/json' };
  if (resolved.key) {
    headers[auth.header_name] = auth.header_value_template.replace('{key}', resolved.key);
  }
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI-compat stream ${response.status}: ${errText.slice(0, 200)}`);
  }
  yield* readSseStream(response, (json) => json.choices?.[0]?.delta?.content || '');
}

function buildOpenAIBody(modelId: string, input: GenerateInput, opts: GenerateOptions, stream: boolean): any {
  const messages: any[] = [];
  if (input.system) messages.push({ role: 'system', content: input.system });
  if (input.history) {
    for (const h of input.history) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
  }
  if (input.image) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: input.text },
        {
          type: 'image_url',
          image_url: { url: `data:${input.image.mimeType};base64,${input.image.data}` },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: input.text });
  }
  return {
    model:       modelId,
    messages,
    max_tokens:  opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
    top_p:       opts.topP ?? DEFAULT_TOP_P,
    stream,
  };
}

// ─ Ollama (ollama api_shape) ───
// Local LLM server, no API key, OpenAI-compatible chat endpoint.

async function callOllama(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
  stream: boolean,
): Promise<string | null> {
  const url = `${resolved.endpoint}/api/chat`;
  const body = buildOllamaBody(resolved.model_id, input, opts, stream);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.message?.content || null;
}

async function* streamOllama(
  resolved: ResolvedRoleConfig,
  input: GenerateInput,
  opts: GenerateOptions,
): AsyncGenerator<string> {
  const url = `${resolved.endpoint}/api/chat`;
  const body = buildOllamaBody(resolved.model_id, input, opts, true);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama stream ${response.status}: ${errText.slice(0, 200)}`);
  }
  // Ollama uses NDJSON, not SSE
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        const chunk = parsed.message?.content;
        if (chunk) yield chunk;
      } catch {
        // Tolerate corrupt line; ndjson stream may have a torn line at the boundary
      }
    }
  }
}

function buildOllamaBody(modelId: string, input: GenerateInput, opts: GenerateOptions, stream: boolean): any {
  const messages: any[] = [];
  if (input.system) messages.push({ role: 'system', content: input.system });
  if (input.history) {
    for (const h of input.history) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
  }
  // Ollama image support is via images[] array of base64 strings
  const userMessage: any = { role: 'user', content: input.text };
  if (input.image) userMessage.images = [input.image.data];
  messages.push(userMessage);
  return {
    model: modelId,
    messages,
    options: {
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      top_p:       opts.topP ?? DEFAULT_TOP_P,
      num_predict: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    },
    stream,
  };
}

// ─── Embeddings ────────────────────────────────────────────────────

async function embedViaGemini(text: string, key: string): Promise<{
  embedding: number[]; dim: number; provider_id: string; model_id: string
} | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    });
    if (!response.ok) {
      console.error(`[llm/runtime] gemini embed failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    const values = data.embedding?.values;
    if (!Array.isArray(values)) return null;
    return { embedding: values, dim: values.length, provider_id: 'google-gemini', model_id: 'text-embedding-004' };
  } catch (e: any) {
    console.error(`[llm/runtime] gemini embed error: ${e?.message ?? e}`);
    return null;
  }
}

async function embedViaOpenAI(text: string, key: string): Promise<{
  embedding: number[]; dim: number; provider_id: string; model_id: string
} | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });
    if (!response.ok) {
      console.error(`[llm/runtime] openai embed failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    const values = data.data?.[0]?.embedding;
    if (!Array.isArray(values)) return null;
    return { embedding: values, dim: values.length, provider_id: 'openai', model_id: 'text-embedding-3-small' };
  } catch (e: any) {
    console.error(`[llm/runtime] openai embed error: ${e?.message ?? e}`);
    return null;
  }
}

// ─── SSE stream parser ─────────────────────────────────────────────
//
// Generic SSE parser used by Gemini, Anthropic, OpenAI-compatible. Extracts
// `data:` lines, JSON-parses each, and yields textual chunks via the caller's
// extractor function. Tolerates split chunks (the boundary may bisect a line).

async function* readSseStream(
  response: Response,
  extractor: (json: any) => string,
): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE frames separated by double-newline; lines within a frame separated by single newline
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      for (const line of frame.split('\n')) {
        const m = line.match(/^data:\s*(.*)$/);
        if (!m) continue;
        const data = m[1];
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const chunk = extractor(parsed);
          if (chunk) yield chunk;
        } catch {
          // Tolerate corrupt frame; SSE may have malformed JSON at edge cases
        }
      }
    }
  }
}
