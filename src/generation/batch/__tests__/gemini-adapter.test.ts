import { describe, it, expect, vi } from 'vitest';
import { createGeminiBatchAdapter } from '../gemini-adapter';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

describe('gemini batch adapter', () => {
  it('submitBatch uploads JSONL then creates the batch and returns the id', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes('/upload/v1beta/files')) {
        return jsonResponse({ file: { name: 'files/abc' } });
      }
      if (url.includes(':batchGenerateContent')) {
        return jsonResponse({ name: 'batches/xyz', metadata: { createTime: '2026-05-03T10:00:00Z' } });
      }
      return new Response('not found', { status: 404 });
    });

    const adapter = createGeminiBatchAdapter({ apiKey: 'test', fetcher });
    const r = await adapter.submitBatch({ display_name: 'run-1', jsonl: '{"x":1}\n' });
    expect(r.batch_id).toBe('batches/xyz');
    expect(r.submitted_at).toBe('2026-05-03T10:00:00Z');
    expect(calls.length).toBe(2);
    expect(calls[0].init?.headers).toMatchObject({ 'X-Goog-Display-Name': 'run-1' });
  });

  it('pollBatch maps state strings to typed status', async () => {
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher: vi.fn(async () => jsonResponse({ metadata: { state: 'JOB_STATE_RUNNING', progress: 0.42 } })),
    });
    const status = await adapter.pollBatch('batches/x');
    expect(status.kind).toBe('running');
    if (status.kind === 'running') expect(status.progress).toBe(0.42);
  });

  it('pollBatch returns complete with output_url when succeeded', async () => {
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher: vi.fn(async () => jsonResponse({
        metadata: { state: 'JOB_STATE_SUCCEEDED' },
        response: { output_uri: 'https://storage/output.jsonl' },
      })),
    });
    const status = await adapter.pollBatch('batches/x');
    expect(status.kind).toBe('complete');
    if (status.kind === 'complete') expect(status.output_url).toBe('https://storage/output.jsonl');
  });

  it('pollBatch maps EXPIRED to expired', async () => {
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher: vi.fn(async () => jsonResponse({ metadata: { state: 'JOB_STATE_EXPIRED' } })),
    });
    expect((await adapter.pollBatch('batches/x')).kind).toBe('expired');
  });

  it('pollBatch maps FAILED with reason', async () => {
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher: vi.fn(async () => jsonResponse({
        metadata: { state: 'JOB_STATE_FAILED' },
        error: { message: 'quota exceeded' },
      })),
    });
    const status = await adapter.pollBatch('batches/x');
    expect(status.kind).toBe('failed');
    if (status.kind === 'failed') expect(status.reason).toBe('quota exceeded');
  });

  it('cancelBatch never throws even on 404', async () => {
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher: vi.fn(async () => new Response('not found', { status: 404 })),
    });
    await expect(adapter.cancelBatch('batches/missing')).resolves.toBeUndefined();
  });

  it('parseResults extracts custom_id + JSON-parsed result', () => {
    const adapter = createGeminiBatchAdapter({ apiKey: 'test' });
    const jsonl = [
      JSON.stringify({
        custom_id: 'job-1',
        response: {
          candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }],
        },
      }),
      JSON.stringify({ custom_id: 'job-2', error: { message: 'safety' } }),
      '',                                     // empty line — skipped
      'malformed line',                       // skipped, no crash
    ].join('\n');
    const rows = adapter.parseResults(jsonl);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual({ custom_id: 'job-1', status: 'succeeded', result: { a: 1 } });
    expect(rows[1].status).toBe('failed');
    expect(rows[1].error).toBe('safety');
  });

  it('retries 5xx responses with backoff', async () => {
    let attempts = 0;
    const fetcher = vi.fn(async () => {
      attempts++;
      if (attempts < 3) return new Response('boom', { status: 503, statusText: 'Service Unavailable' });
      return jsonResponse({ metadata: { state: 'JOB_STATE_RUNNING' } });
    });
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher,
      retryDelays: [1, 1, 1], // fast for test
    });
    const status = await adapter.pollBatch('batches/x');
    expect(status.kind).toBe('running');
    expect(attempts).toBe(3);
  });

  it('does NOT retry 4xx responses', async () => {
    let attempts = 0;
    const fetcher = vi.fn(async () => {
      attempts++;
      return new Response('bad request', { status: 400, statusText: 'Bad Request' });
    });
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher,
      retryDelays: [1, 1],
    });
    await expect(adapter.pollBatch('batches/x')).rejects.toThrow(/400/);
    expect(attempts).toBe(1);
  });

  it('downloadResults returns the raw text body', async () => {
    const adapter = createGeminiBatchAdapter({
      apiKey: 'test',
      fetcher: vi.fn(async () => textResponse('line1\nline2\n')),
    });
    const text = await adapter.downloadResults('https://storage/output.jsonl');
    expect(text).toBe('line1\nline2\n');
  });
});
