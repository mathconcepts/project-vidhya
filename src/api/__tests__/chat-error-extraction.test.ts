import { describe, it, expect } from 'vitest';

// Inline the logic from frontend/src/lib/api-error.ts so we don't need a frontend
// test harness. If the logic changes there, update this test too.
async function extractErrorDetail(response: { json: () => Promise<unknown> }, fallback = 'Request failed'): Promise<string> {
  try {
    const body = await response.json() as Record<string, unknown>;
    if (body?.detail) return body.detail as string;
    if (body?.error) return body.error as string;
  } catch { /* not JSON */ }
  return fallback;
}

function mockJsonResponse(body: unknown) {
  return { json: () => Promise.resolve(body) };
}

function mockNonJsonResponse() {
  return { json: () => Promise.reject(new SyntaxError('Unexpected token')) };
}

describe('chat error extraction (ChatPage.tsx 503 fix)', () => {
  it('extracts detail field from JSON body', async () => {
    const res = mockJsonResponse({ detail: 'No LLM provider configured (set GEMINI_API_KEY)' });
    expect(await extractErrorDetail(res)).toBe('No LLM provider configured (set GEMINI_API_KEY)');
  });

  it('extracts error field when detail is absent', async () => {
    const res = mockJsonResponse({ error: 'Rate limit exceeded' });
    expect(await extractErrorDetail(res)).toBe('Rate limit exceeded');
  });

  it('prefers detail over error when both present', async () => {
    const res = mockJsonResponse({ detail: 'detail msg', error: 'error msg' });
    expect(await extractErrorDetail(res)).toBe('detail msg');
  });

  it('falls back to provided default for non-JSON response', async () => {
    expect(await extractErrorDetail(mockNonJsonResponse(), 'Chat request failed')).toBe('Chat request failed');
  });

  it('falls back to default for empty JSON body', async () => {
    expect(await extractErrorDetail(mockJsonResponse({}), 'Chat request failed')).toBe('Chat request failed');
  });
});
