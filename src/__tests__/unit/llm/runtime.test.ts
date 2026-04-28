// @ts-nocheck
/**
 * Unit tests for src/llm/runtime.ts
 *
 * The runtime helper is the thin layer hot paths use to call any LLM
 * provider. Tests focus on:
 *   - Configuration resolution (env vars, header config, role selection)
 *   - Failure modes (no provider, no key, network error)
 *   - Provider dispatch is hooked up correctly (mocked fetch)
 *
 * What's NOT tested here:
 *   - Real LLM calls (would require live API keys; the live verify
 *     suite covers this)
 *   - SSE stream parser correctness on every provider format (the
 *     dispatchers themselves are simple `fetch + JSON parse`; the
 *     SSE parser is exercised by the streaming tests below with
 *     synthetic responses)
 *   - Anthropic / OpenAI / Ollama dispatch — same code path as Gemini
 *     just different URL + body shape; the test for Gemini covers
 *     the core wiring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL_FETCH = global.fetch;

beforeEach(() => {
  // Clear env vars that might affect resolution
  delete process.env.VIDHYA_LLM_PRIMARY_PROVIDER;
  delete process.env.VIDHYA_LLM_PRIMARY_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
});

describe('runtime — configuration resolution', () => {
  it('returns null when no provider is configured', async () => {
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    expect(llm).toBeNull();
  });

  it('resolves to gemini when GEMINI_API_KEY is set', async () => {
    process.env.GEMINI_API_KEY = 'test-key-1234567890abc';
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    expect(llm).not.toBeNull();
    expect(llm!.provider_id).toBe('google-gemini');
    expect(llm!.role).toBe('chat');
    expect(llm!.model_id).toBeTruthy();
  });

  it('resolves to anthropic when ANTHROPIC_API_KEY is set (no gemini)', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    expect(llm).not.toBeNull();
    expect(llm!.provider_id).toBe('anthropic');
  });

  it('resolves to openai when OPENAI_API_KEY is set (no others)', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-key';
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    expect(llm).not.toBeNull();
    expect(llm!.provider_id).toBe('openai');
  });

  it('explicit VIDHYA_LLM_PRIMARY_PROVIDER overrides legacy keys', async () => {
    // Both legacy and explicit set — explicit wins
    process.env.GEMINI_API_KEY = 'gemini-key-leftover';
    process.env.VIDHYA_LLM_PRIMARY_PROVIDER = 'anthropic';
    process.env.VIDHYA_LLM_PRIMARY_KEY = 'sk-ant-explicit';
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    expect(llm).not.toBeNull();
    expect(llm!.provider_id).toBe('anthropic');
  });

  it('resolves different roles independently — chat vs vision vs json', async () => {
    process.env.GEMINI_API_KEY = 'test-key-1234567890abc';
    const { getLlmForRole } = await import('../../../llm/runtime');
    const chat = await getLlmForRole('chat');
    const vision = await getLlmForRole('vision');
    const json = await getLlmForRole('json');
    expect(chat).not.toBeNull();
    expect(vision).not.toBeNull();
    expect(json).not.toBeNull();
    // All on Gemini, but possibly different default models
    expect(chat!.provider_id).toBe('google-gemini');
    expect(vision!.provider_id).toBe('google-gemini');
    expect(json!.provider_id).toBe('google-gemini');
  });

  it('respects per-request header config over env defaults', async () => {
    // Env says Gemini, header says Anthropic — header wins
    process.env.GEMINI_API_KEY = 'env-gemini';
    const { getLlmForRole } = await import('../../../llm/runtime');
    const headerConfig = JSON.stringify({
      primary_provider_id: 'anthropic',
      primary_key: 'sk-ant-from-header',
    });
    // Header is base64-encoded
    const encoded = Buffer.from(headerConfig).toString('base64');
    const llm = await getLlmForRole('chat', {
      'x-vidhya-llm-config': encoded,
    });
    expect(llm).not.toBeNull();
    expect(llm!.provider_id).toBe('anthropic');
  });
});

describe('runtime — provider dispatch (mocked fetch)', () => {
  it('Gemini generate() builds the right URL and body', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    let capturedUrl = '';
    let capturedBody: any = null;
    let capturedHeaders: any = null;
    global.fetch = vi.fn(async (url: string, opts: any) => {
      capturedUrl = url;
      capturedBody = JSON.parse(opts.body);
      capturedHeaders = opts.headers;
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }],
        }),
      } as any;
    });
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    const text = await llm!.generate('Test prompt');
    expect(text).toBe('Hello from Gemini');
    expect(capturedUrl).toContain('generativelanguage.googleapis.com');
    expect(capturedUrl).toContain(':generateContent');
    expect(capturedHeaders['x-goog-api-key']).toBe('test-key');
    expect(capturedBody.contents[0].parts[0].text).toBe('Test prompt');
  });

  it('Gemini generate() returns null on non-OK response and logs error', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    }) as any);
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    const text = await llm!.generate('Test prompt');
    expect(text).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('Gemini generate() returns null on empty content', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '' }] } }] }),
    }) as any);
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    const text = await llm!.generate('Test prompt');
    expect(text).toBeNull();
  });

  it('Anthropic generate() uses /v1/messages with x-api-key header', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    let capturedUrl = '';
    let capturedHeaders: any = null;
    let capturedBody: any = null;
    global.fetch = vi.fn(async (url: string, opts: any) => {
      capturedUrl = url;
      capturedHeaders = opts.headers;
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({ content: [{ text: 'Hello from Claude' }] }),
      } as any;
    });
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('chat');
    const text = await llm!.generate('Test prompt');
    expect(text).toBe('Hello from Claude');
    expect(capturedUrl).toContain('/v1/messages');
    expect(capturedHeaders['x-api-key']).toBe('sk-ant-test');
    expect(capturedHeaders['anthropic-version']).toBeTruthy();
    expect(capturedBody.messages[0].content).toBe('Test prompt');
  });

  it('image input is included in Gemini body as inlineData', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    let capturedBody: any = null;
    global.fetch = vi.fn(async (url: string, opts: any) => {
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'image text' }] } }] }),
      } as any;
    });
    const { getLlmForRole } = await import('../../../llm/runtime');
    const llm = await getLlmForRole('vision');
    const text = await llm!.generate({
      text: 'What is in this image?',
      image: { mimeType: 'image/jpeg', data: 'base64data' },
    });
    expect(text).toBe('image text');
    const parts = capturedBody.contents[0].parts;
    expect(parts.find((p: any) => p.text === 'What is in this image?')).toBeTruthy();
    expect(parts.find((p: any) => p.inlineData?.mimeType === 'image/jpeg')).toBeTruthy();
  });
});

describe('runtime — embeddings', () => {
  it('embedText returns null when no provider configured', async () => {
    const { embedText } = await import('../../../llm/runtime');
    const r = await embedText('hello');
    expect(r).toBeNull();
  });

  it('embedText calls Gemini embeddings API when GEMINI_API_KEY is set', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    let capturedUrl = '';
    global.fetch = vi.fn(async (url: string) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ embedding: { values: [0.1, 0.2, 0.3] } }),
      } as any;
    });
    const { embedText } = await import('../../../llm/runtime');
    const r = await embedText('hello');
    expect(r).not.toBeNull();
    expect(r!.dim).toBe(3);
    expect(r!.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(r!.provider_id).toBe('google-gemini');
    expect(capturedUrl).toContain('text-embedding-004:embedContent');
  });

  it('embedText falls back to OpenAI when only OPENAI_API_KEY is set', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    let capturedUrl = '';
    global.fetch = vi.fn(async (url: string) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ data: [{ embedding: [0.1, 0.2] }] }),
      } as any;
    });
    const { embedText } = await import('../../../llm/runtime');
    const r = await embedText('hello');
    expect(r).not.toBeNull();
    expect(r!.dim).toBe(2);
    expect(r!.provider_id).toBe('openai');
    expect(capturedUrl).toContain('api.openai.com');
    expect(capturedUrl).toContain('/embeddings');
  });
});
