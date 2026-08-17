/**
 * The batch runner.
 *
 * This file had zero tests, which is how it shipped a generation path that
 * never once called a model. `new LLMClient({})` builds no adapters, so every
 * call threw and a bare catch turned it into a placeholder body. Nobody
 * noticed for months because the placeholder is readable prose and the only
 * signal was a metadata field nothing read.
 *
 * Two behaviours are load-bearing here and both are tested by their refusals:
 *
 *   1. The cost cap is checked BEFORE the call, outside the try. A cap that
 *      throws cannot stop this loop — the per-unit catch marks one unit
 *      failed and keeps spending.
 *   2. A mock body is recorded but never servable. The route refuses it.
 *
 * Everything external is injected, so none of this needs an API key.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'vidhya-batch-'));
process.env.VIDHYA_DATA_DIR ??= TMP;

import { runBatch, DEFAULT_BATCH_CAP_USD, BRIDGE_MODEL_ID, type LLMDeps } from '../../../syllabus-bridge/batch-runner';
import type { BatchRequest, ContentUnit } from '../../../syllabus-bridge/types';
import * as registry from '../../../syllabus-bridge/registry';
import * as store from '../../../syllabus-bridge/store';

function unit(id: string, tokens = 500): ContentUnit {
  return {
    unit_id: id,
    unit_type: 'foundation-explainer',
    mapping_entry_id: 'E1',
    difficulty: 2,
    estimated_tokens: tokens,
  } as ContentUnit;
}

function batchFor(unitIds: string[]): BatchRequest {
  return {
    batch_id: `B-${unitIds.join('-')}`,
    mapping_id: 'M1',
    unit_ids: unitIds,
    submitted_by: 'tester',
    submitted_at: new Date(0).toISOString(),
    status: 'queued',
    results: [],
    total_units: unitIds.length,
    completed_units: 0,
    failed_units: 0,
    total_cost_estimate_usd: 0,
  } as BatchRequest;
}

const MAPPING = {
  id: 'M1',
  target_exam_id: 'jee-main',
  entries: [{ id: 'E1', source_concept_ids: ['c1'], bridge_note: 'note', gap_class: 'same' }],
} as never;

const CONCEPT = {
  concept: { id: 'c1', name: 'Complex numbers', difficulty: 2, source_ref: '2.1' },
  topic: { id: 't1', name: 'Complex', chapter_number: 2 },
} as never;

let saved: unknown[] = [];

beforeEach(() => {
  saved = [];
  vi.spyOn(registry, 'getMapping').mockReturnValue(MAPPING);
  vi.spyOn(registry, 'getConcept').mockReturnValue(CONCEPT);
  vi.spyOn(store, 'saveBatch').mockImplementation(() => {});
  vi.spyOn(store, 'saveGeneratedContent').mockImplementation((c: never) => {
    saved.push(c);
  });
});
afterEach(() => vi.restoreAllMocks());

/** A model that always answers. */
function workingLlm(text = 'A real generated explainer body.'): LLMDeps {
  return { generate: vi.fn(async () => ({ text, model: BRIDGE_MODEL_ID, tokens_used: 400 })) };
}

describe('real generation', () => {
  it('writes the model output, not a placeholder', async () => {
    const b = batchFor(['u1']);
    await runBatch(b, [unit('u1')], { llm: workingLlm() });
    expect(b.status).toBe('completed');
    expect(b.completed_units).toBe(1);
    const [c] = saved as Array<{ body_markdown: string; source: string }>;
    expect(c.body_markdown).toContain('A real generated explainer body.');
    expect(c.source).not.toBe('mock');
  });

  it('asks for a model id the provider registry declares', async () => {
    // A near-miss id throws ModelRetiredError rather than falling back, which
    // is the drift bug config/providers.yaml already paid for once.
    expect(BRIDGE_MODEL_ID).toBe('claude-sonnet-4-5');
  });
});

describe('falling back to mock', () => {
  it('records a mock body when the model returns nothing', async () => {
    const b = batchFor(['u1']);
    await runBatch(b, [unit('u1')], { llm: { generate: async () => null } });
    expect(b.status).toBe('completed');
    const [c] = saved as Array<{ source: string }>;
    expect(c.source).toBe('mock');
  });

  it('records a mock body when the model throws', async () => {
    const b = batchFor(['u1']);
    await runBatch(b, [unit('u1')], {
      llm: { generate: async () => { throw new Error('429 rate limited'); } },
    });
    const [c] = saved as Array<{ source: string }>;
    expect(c.source).toBe('mock');
  });

  it('keeps the mock row rather than dropping the unit', async () => {
    // The row is what makes a failed unit retryable. Deleting it would lose
    // the fact that generation was attempted at all.
    const b = batchFor(['u1']);
    await runBatch(b, [unit('u1')], { llm: { generate: async () => null } });
    expect(saved).toHaveLength(1);
  });
});

describe('the cost cap', () => {
  it('makes ZERO calls when nothing is affordable', async () => {
    // The fully deterministic case: no arithmetic, no dependence on which
    // provider the environment implies. A cap of zero must refuse the very
    // first unit, before any spend.
    const llm = workingLlm();
    const b = batchFor(['u1', 'u2', 'u3']);
    await runBatch(b, [unit('u1'), unit('u2'), unit('u3')], { llm, maxCostUsd: 0 });

    expect(b.status).toBe('aborted');
    expect(b.error).toMatch(/cost cap reached/);
    expect((llm.generate as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
    expect(saved).toHaveLength(0);
  });

  it('stops early on a tight cap and never spends past it', async () => {
    // Asserted as an invariant rather than an exact call count. The estimate
    // prices against the most expensive provider while the recorded spend
    // prices against whichever one served, so an exact count would depend on
    // which API keys happen to be set in the environment running the test.
    const llm = workingLlm();
    const units = ['u1', 'u2', 'u3', 'u4', 'u5'].map((u) => unit(u));
    const b = batchFor(units.map((u) => u.unit_id));
    const cap = 0.004;
    await runBatch(b, units, { llm, maxCostUsd: cap });

    expect(b.status).toBe('aborted');
    expect(b.total_cost_estimate_usd).toBeLessThanOrEqual(cap);
    expect((llm.generate as ReturnType<typeof vi.fn>).mock.calls.length).toBeLessThan(units.length);
  });

  it('does NOT mark the aborted units as failed', async () => {
    // They were never attempted. Counting them as failures would report a
    // content problem where there is only a budget decision.
    const b = batchFor(['u1', 'u2', 'u3']);
    await runBatch(b, [unit('u1'), unit('u2'), unit('u3')], { llm: workingLlm(), maxCostUsd: 0 });
    expect(b.failed_units).toBe(0);
  });

  it('cannot be defeated by the per-unit catch', async () => {
    // The regression this exists for: a throw-based cap is swallowed by the
    // catch inside the loop, so the batch spends everything and reports
    // "completed". If that ever comes back, status will not be 'aborted'.
    const b = batchFor(['u1', 'u2', 'u3', 'u4', 'u5']);
    await runBatch(b, ['u1', 'u2', 'u3', 'u4', 'u5'].map((u) => unit(u)), {
      llm: workingLlm(),
      maxCostUsd: 0.004,
    });
    expect(b.status).toBe('aborted');
    expect(b.completed_units).toBeLessThan(5);
    // 'completed' here would mean the cap threw, got swallowed by the
    // per-unit catch, and the loop spent the whole batch anyway.
    expect(b.status).not.toBe('completed');
  });

  it('runs the whole batch when the cap is generous', async () => {
    const b = batchFor(['u1', 'u2']);
    await runBatch(b, [unit('u1'), unit('u2')], { llm: workingLlm(), maxCostUsd: 100 });
    expect(b.status).toBe('completed');
    expect(b.completed_units).toBe(2);
  });

  it('has a default cap rather than relying on a caller to pass one', async () => {
    expect(DEFAULT_BATCH_CAP_USD).toBeGreaterThan(0);
    expect(Number.isFinite(DEFAULT_BATCH_CAP_USD)).toBe(true);
  });
});

describe('a mock body is recorded but never servable', () => {
  it('refuses exactly the mock source and nothing else', async () => {
    const { isServable } = await import('../../../api/syllabus-bridge-routes');
    expect(isServable({ source: 'mock' })).toBe(false);
    expect(isServable({ source: 'anthropic' })).toBe(true);
    expect(isServable({ source: 'gemini' })).toBe(true);
    expect(isServable({ source: 'openai' })).toBe(true);
  });

  it('treats a missing source as servable, not as mock', async () => {
    // Rows predating the source field are real content. Refusing them would
    // blank existing lessons to fix a bug they do not have.
    const { isServable } = await import('../../../api/syllabus-bridge-routes');
    expect(isServable({})).toBe(true);
  });

  it('what runBatch records on fallback is what the route refuses', async () => {
    // The seam: these two halves are in different files and must agree, or
    // the refusal guards a value nothing produces.
    const { isServable } = await import('../../../api/syllabus-bridge-routes');
    const b = batchFor(['u1']);
    await runBatch(b, [unit('u1')], { llm: { generate: async () => null } });
    const [c] = saved as Array<{ source: string }>;
    expect(isServable(c)).toBe(false);
  });
});

describe('per-unit failure isolation', () => {
  it('one bad unit does not poison the batch', async () => {
    let n = 0;
    const b = batchFor(['u1', 'u2', 'u3']);
    await runBatch(b, [unit('u1'), unit('u2'), unit('u3')], {
      maxCostUsd: 100,
      llm: {
        generate: async () => {
          n += 1;
          if (n === 2) throw new Error('provider blew up');
          return { text: 'ok', model: BRIDGE_MODEL_ID, tokens_used: 10 };
        },
      },
    });
    // The throwing unit falls back to mock rather than failing the batch.
    expect(b.status).toBe('completed');
    expect(saved).toHaveLength(3);
  });

  it('fails the batch when the mapping does not resolve', async () => {
    vi.spyOn(registry, 'getMapping').mockReturnValue(null as never);
    const b = batchFor(['u1']);
    await runBatch(b, [unit('u1')], { llm: workingLlm() });
    expect(b.status).toBe('failed');
    expect(b.error).toMatch(/Unknown mapping_id/);
  });

  it('ignores plan units the batch did not ask for', async () => {
    const llm = workingLlm();
    const b = batchFor(['u1']);
    await runBatch(b, [unit('u1'), unit('u2'), unit('u3')], { llm, maxCostUsd: 100 });
    expect(saved).toHaveLength(1);
  });
});
