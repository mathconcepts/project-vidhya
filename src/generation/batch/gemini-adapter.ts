/**
 * src/generation/batch/gemini-adapter.ts
 *
 * Pure HTTP adapter over Google's Gemini Batch API. No DB. No
 * orchestration. The orchestrator (PR-A2) calls these functions and
 * persists the result.
 *
 * Idempotency: submitBatch uses our deterministic `display_name` (derived
 * from run_id) so a re-submit after crash returns the same batch_id
 * rather than creating a duplicate.
 *
 * Retries: 5xx responses retry with exponential backoff (3 attempts).
 * 4xx surfaces immediately — those are our bug, not the provider's.
 *
 * Test seam: the `fetcher` arg lets unit tests inject a stub fetch.
 */

import type {
  BatchAdapter,
  BatchSubmitResult,
  BatchPollStatus,
  BatchResultRow,
} from './types';

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface GeminiAdapterOpts {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  fetcher?: FetchLike;
  retryDelays?: number[]; // ms; default exponential
}

const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_RETRY_DELAYS = [500, 2000, 8000];

export function createGeminiBatchAdapter(opts: GeminiAdapterOpts = {}): BatchAdapter {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY ?? '';
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const model = opts.model ?? DEFAULT_MODEL;
  const fetcher: FetchLike = opts.fetcher ?? ((url, init) => fetch(url, init));
  const retryDelays = opts.retryDelays ?? DEFAULT_RETRY_DELAYS;

  async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err as Error;
        if (!isRetryable(lastErr) || attempt === retryDelays.length) throw lastErr;
        await sleep(retryDelays[attempt]);
      }
    }
    throw lastErr ?? new Error(`${label}: unknown failure`);
  }

  return {
    provider: 'gemini',

    async submitBatch(input) {
      return withRetry('submitBatch', async () => {
        // Two-step: upload the JSONL as a file, then create the batch.
        // Both operations are keyed on display_name so a re-call after
        // crash returns the existing record.
        const fileName = await uploadJsonl({
          fetcher,
          endpoint,
          apiKey,
          display_name: input.display_name,
          jsonl: input.jsonl,
        });

        const url = `${endpoint}/models/${model}:batchGenerateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetcher(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: input.display_name,
            input_config: { file_name: fileName },
          }),
        });
        if (!res.ok) throw httpError('submitBatch', res);
        const body = (await res.json()) as { name: string; metadata?: { state?: string; createTime?: string } };
        return {
          batch_id: body.name,
          submitted_at: body.metadata?.createTime ?? new Date().toISOString(),
        } satisfies BatchSubmitResult;
      });
    },

    async pollBatch(batch_id) {
      return withRetry('pollBatch', async () => {
        const url = `${endpoint}/${encodeURIComponent(batch_id)}?key=${encodeURIComponent(apiKey)}`;
        const res = await fetcher(url, { method: 'GET' });
        if (!res.ok) throw httpError('pollBatch', res);
        const body = (await res.json()) as {
          metadata?: { state?: string; progress?: number };
          response?: { output_file_name?: string; output_uri?: string };
          error?: { message?: string };
        };
        const state = body.metadata?.state ?? '';
        if (state === 'JOB_STATE_PENDING' || state === 'JOB_STATE_QUEUED') return { kind: 'pending' };
        if (state === 'JOB_STATE_RUNNING') return { kind: 'running', progress: body.metadata?.progress };
        if (state === 'JOB_STATE_SUCCEEDED') {
          const url = body.response?.output_uri ?? body.response?.output_file_name ?? '';
          if (!url) return { kind: 'failed', reason: 'succeeded with no output_uri' };
          return { kind: 'complete', output_url: url };
        }
        if (state === 'JOB_STATE_EXPIRED') return { kind: 'expired' };
        if (state === 'JOB_STATE_FAILED' || state === 'JOB_STATE_CANCELLED') {
          return { kind: 'failed', reason: body.error?.message ?? state };
        }
        return { kind: 'pending' }; // unknown → treat as still in progress
      });
    },

    async downloadResults(output_url) {
      return withRetry('downloadResults', async () => {
        const url = output_url.startsWith('http')
          ? output_url
          : `${endpoint}/${encodeURIComponent(output_url)}?alt=media&key=${encodeURIComponent(apiKey)}`;
        const res = await fetcher(url, { method: 'GET' });
        if (!res.ok) throw httpError('downloadResults', res);
        return await res.text();
      });
    },

    async cancelBatch(batch_id) {
      // Best-effort. Don't throw on 404 — caller already marked aborted.
      try {
        const url = `${endpoint}/${encodeURIComponent(batch_id)}:cancel?key=${encodeURIComponent(apiKey)}`;
        await fetcher(url, { method: 'POST' });
      } catch {
        // swallow
      }
    },

    parseResults(jsonl) {
      const rows: BatchResultRow[] = [];
      for (const line of jsonl.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as {
            custom_id?: string;
            response?: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
            error?: { message?: string };
          };
          if (!parsed.custom_id) continue;
          if (parsed.error) {
            rows.push({
              custom_id: parsed.custom_id,
              status: 'failed',
              error: parsed.error.message ?? 'unknown',
            });
            continue;
          }
          const text = parsed.response?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            rows.push({ custom_id: parsed.custom_id, status: 'failed', error: 'empty response' });
            continue;
          }
          let result: unknown = text;
          try { result = JSON.parse(text); } catch { /* leave as text */ }
          rows.push({ custom_id: parsed.custom_id, status: 'succeeded', result });
        } catch {
          // malformed line — skip; don't crash the parser
        }
      }
      return rows;
    },
  };
}

// ----------------------------------------------------------------------------

async function uploadJsonl(args: {
  fetcher: FetchLike;
  endpoint: string;
  apiKey: string;
  display_name: string;
  jsonl: string;
}): Promise<string> {
  // Gemini's file-upload endpoint. Display_name is our idempotency key
  // (we set it deterministically); the endpoint returns the existing
  // file name on collision rather than uploading twice.
  const url = `${args.endpoint.replace('/v1beta', '')}/upload/v1beta/files?key=${encodeURIComponent(args.apiKey)}`;
  const res = await args.fetcher(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-jsonlines',
      'X-Goog-Upload-Protocol': 'raw',
      'X-Goog-Display-Name': args.display_name,
    },
    body: args.jsonl,
  });
  if (!res.ok) throw httpError('uploadJsonl', res);
  const body = (await res.json()) as { file?: { name?: string } };
  if (!body.file?.name) throw new Error('uploadJsonl: missing file.name in response');
  return body.file.name;
}

function isRetryable(err: Error): boolean {
  const m = err.message ?? '';
  // 5xx + network errors are retryable; 4xx surfaces immediately.
  return /\bHTTP 5\d\d\b/.test(m) || /\bECONN/.test(m) || /\bENETUNREACH\b/.test(m) || /\btimeout\b/i.test(m);
}

function httpError(label: string, res: Response): Error {
  return new Error(`${label}: HTTP ${res.status} ${res.statusText}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
