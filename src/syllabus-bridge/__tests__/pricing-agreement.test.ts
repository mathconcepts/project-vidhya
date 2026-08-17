/**
 * The estimate an operator approves and the cost that stops their run must be
 * the same number.
 *
 * They were not. The plan screen quoted Gemini Flash ($0.30/M) while the spend
 * cap charged Anthropic ($3.00/M), so a batch previewed at $0.05 was metered
 * at $0.50 — a 10x gap between the number someone says yes to and the number
 * that halts them mid-run. Neither side was buggy on its own, which is why it
 * survived: two internally-consistent price tables in two files.
 *
 * These tests fail if they ever diverge again.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  estimateCost,
  BRIDGE_PROVIDER,
  BRIDGE_PRICING_LABEL,
  PROVIDER_RATE_USD_PER_MTOK,
} from '../pricing';
import { estimateCostUsd } from '../content-plan';
import { estimateUnitCost, BRIDGE_MODEL_ID } from '../batch-runner';

describe('the preview and the cap quote the same price', () => {
  it('the plan estimate uses the rate the cap enforces', () => {
    const tokens = 1_000_000;
    const plan = estimateCostUsd({
      mapping_id: 'm1',
      units: [],
      total_estimated_tokens: tokens,
    } as never);

    expect(plan).toBeCloseTo(estimateCost(BRIDGE_PROVIDER, tokens), 4);
    // And concretely: Anthropic's rate, not Gemini's.
    expect(plan).toBeCloseTo(3.0, 4);
    expect(plan).not.toBeCloseTo(0.3, 4);
  });

  it('a unit estimate is priced at the same provider', () => {
    const unit = { estimated_tokens: 500 } as never;
    // estimateUnitCost caps maxTokens at 2000, mirroring the generator.
    expect(estimateUnitCost(unit)).toBeCloseTo(estimateCost(BRIDGE_PROVIDER, 1000), 5);
  });
});

describe('the declared provider matches the model actually requested', () => {
  it('BRIDGE_MODEL_ID and BRIDGE_PROVIDER agree', () => {
    // If the bridge switches models, the rate has to move with it, or the
    // preview silently goes back to quoting the wrong vendor.
    const family = BRIDGE_MODEL_ID.split('-')[0];
    const expected: Record<string, string> = {
      claude: 'anthropic',
      gemini: 'gemini',
      gpt: 'openai',
    };
    expect(
      expected[family],
      `BRIDGE_MODEL_ID '${BRIDGE_MODEL_ID}' has no known provider mapping — ` +
        'add it here and set BRIDGE_PROVIDER to match.',
    ).toBeDefined();
    expect(expected[family]).toBe(BRIDGE_PROVIDER);
  });

  it('the on-screen label names the same vendor it is priced at', () => {
    const vendor: Record<string, RegExp> = {
      anthropic: /claude/i,
      gemini: /gemini/i,
      openai: /gpt|openai/i,
    };
    expect(BRIDGE_PRICING_LABEL).toMatch(vendor[BRIDGE_PROVIDER]);
  });
});

describe('there is only one price table', () => {
  it('no other bridge file hardcodes a per-million rate', () => {
    // The failure mode was a second copy of the numbers, not a wrong number.
    const dir = path.resolve(process.cwd(), 'src/syllabus-bridge');
    const offenders: string[] = [];
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.ts') || f === 'pricing.ts') continue;
      const src = fs.readFileSync(path.join(dir, f), 'utf-8');
      // A literal divided by a million is how both copies were written.
      if (/1_000_000\s*\*\s*[\d.]+|\/\s*1_000_000\s*\*\s*[\d.]+/.test(src)) {
        offenders.push(f);
      }
    }
    expect(
      offenders,
      'A per-million-token rate reappeared outside pricing.ts. That is how the\n' +
        'preview and the cap drifted 10x apart the first time.',
    ).toEqual([]);
  });

  it('the rate table is real, so the check above is not vacuous', () => {
    expect(Object.keys(PROVIDER_RATE_USD_PER_MTOK).sort()).toEqual(
      ['anthropic', 'gemini', 'openai'],
    );
    expect(PROVIDER_RATE_USD_PER_MTOK.anthropic).toBeGreaterThan(
      PROVIDER_RATE_USD_PER_MTOK.gemini,
    );
  });
});
