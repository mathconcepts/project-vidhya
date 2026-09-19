/**
 * Regression tests for the doubled-version-segment outage.
 *
 * Root cause (found in production logs, 2026-09-18):
 *   [chat] Stream error: Gemini stream 404:
 * with an EMPTY error body. Every `default_endpoint` in provider-registry.ts
 * already carries its version prefix, and every dispatcher in runtime.ts
 * appended a second one, yielding `.../v1beta/v1beta/models/...` and
 * `https://api.anthropic.com/v1/v1/messages`. 7 of 8 providers were affected,
 * so the runtime LLM layer had never completed a call with any provider — the
 * AI tutor, thinking-gap insights and error classification all failed, and the
 * failure was long misattributed to a missing provider key.
 *
 * The table below is the canonical documented URL for each provider. If a
 * future edit reintroduces the doubling (either by changing a registry
 * endpoint or by hand-building a URL in a dispatcher), these fail.
 */

import { describe, it, expect } from 'vitest';
import { joinProviderUrl } from '../runtime';
import { PROVIDERS } from '../provider-registry';

/** The path each api_shape's dispatcher in runtime.ts asks for. */
const PATH_FOR_SHAPE: Record<string, string> = {
  'google-gemini': '/v1beta/models/test-model:streamGenerateContent',
  anthropic: '/v1/messages',
  openai: '/v1/chat/completions',
  'openai-compatible': '/v1/chat/completions',
  ollama: '/api/chat',
};

/** Canonical, documented endpoint per provider — the real thing, not derived. */
const EXPECTED_URL: Record<string, string> = {
  'google-gemini': 'https://generativelanguage.googleapis.com/v1beta/models/test-model:streamGenerateContent',
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  ollama: 'http://localhost:11434/api/chat',
};

describe('joinProviderUrl — version-segment dedupe', () => {
  it('does not double a version segment the endpoint already ends with', () => {
    expect(joinProviderUrl('https://api.anthropic.com/v1', '/v1/messages')).toBe(
      'https://api.anthropic.com/v1/messages',
    );
    expect(
      joinProviderUrl('https://generativelanguage.googleapis.com/v1beta', '/v1beta/models/m:go'),
    ).toBe('https://generativelanguage.googleapis.com/v1beta/models/m:go');
  });

  it('adds the version segment when the endpoint omits it (a BYOK user may paste either form)', () => {
    expect(joinProviderUrl('https://api.anthropic.com', '/v1/messages')).toBe(
      'https://api.anthropic.com/v1/messages',
    );
  });

  it('tolerates a trailing slash on the endpoint', () => {
    expect(joinProviderUrl('https://api.openai.com/v1/', '/v1/chat/completions')).toBe(
      'https://api.openai.com/v1/chat/completions',
    );
    expect(joinProviderUrl('https://api.openai.com/', '/v1/chat/completions')).toBe(
      'https://api.openai.com/v1/chat/completions',
    );
  });

  it('only dedupes an EXACT version match, never a different version', () => {
    // A v1 base asked for a v1beta path must keep both — they are not the
    // same segment, and silently dropping one would build a wrong URL.
    expect(joinProviderUrl('https://example.com/v1', '/v1beta/models/m:go')).toBe(
      'https://example.com/v1/v1beta/models/m:go',
    );
  });

  it('leaves a non-version path alone (Ollama speaks /api/chat, not /vN/...)', () => {
    expect(joinProviderUrl('http://localhost:11434', '/api/chat')).toBe(
      'http://localhost:11434/api/chat',
    );
  });

  it('does not mistake a path segment mid-URL for the trailing version', () => {
    // groq's base is /openai/v1 — the dedupe must anchor on the END of the base.
    expect(joinProviderUrl('https://api.groq.com/openai/v1', '/v1/chat/completions')).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    );
  });
});

describe('every registered provider resolves to its canonical URL', () => {
  it('covers every provider in the registry (so a new one cannot slip through untested)', () => {
    expect(PROVIDERS.map((p) => p.id).sort()).toEqual(Object.keys(EXPECTED_URL).sort());
  });

  for (const provider of PROVIDERS) {
    it(`${provider.id} builds the documented endpoint`, () => {
      const path = PATH_FOR_SHAPE[provider.api_shape];
      expect(path, `unknown api_shape ${provider.api_shape}`).toBeDefined();
      const url = joinProviderUrl(provider.default_endpoint, path);
      expect(url).toBe(EXPECTED_URL[provider.id]);
      // The specific shape of the outage, stated directly.
      expect(url).not.toMatch(/\/(v\d+[a-z]*)\/\1(\/|$)/);
      expect(url).not.toContain('/v1/api/');
    });
  }
});
