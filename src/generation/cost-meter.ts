/**
 * src/generation/cost-meter.ts
 *
 * Per-run cost accumulator. Wraps token usage from LLM calls and aborts
 * the GenerationRun when `max_cost_usd` is hit.
 *
 * Pricing is approximate and codified inline — the framework needs a
 * single source of truth for "how much did this experiment burn" and we
 * don't want to depend on each provider's invoicing endpoint at run time.
 *
 * Update prices when providers change them. Versioned by `pricing_version`
 * stamped into generation_runs.config so historical cost numbers stay
 * comparable.
 */

export const PRICING_VERSION = 'v1-2026-05';

interface ModelPrice {
  input_per_1m: number; // USD per 1M input tokens
  output_per_1m: number; // USD per 1M output tokens
}

// Snapshot of public pricing as of 2026-05. Update + bump PRICING_VERSION.
const PRICES: Record<string, ModelPrice> = {
  // Anthropic
  'claude-opus-4-7': { input_per_1m: 15.0, output_per_1m: 75.0 },
  'claude-sonnet-4-6': { input_per_1m: 3.0, output_per_1m: 15.0 },
  'claude-haiku-4-5': { input_per_1m: 1.0, output_per_1m: 5.0 },
  // Google
  'gemini-2.5-flash': { input_per_1m: 0.075, output_per_1m: 0.3 },
  'gemini-2.5-pro': { input_per_1m: 1.25, output_per_1m: 5.0 },
  // OpenAI (rough)
  'gpt-4o': { input_per_1m: 2.5, output_per_1m: 10.0 },
  'gpt-4o-mini': { input_per_1m: 0.15, output_per_1m: 0.6 },
  // OpenAI TTS (per 1M chars input, no output cost)
  'tts-1': { input_per_1m: 15.0, output_per_1m: 0 },
  // Wolfram Alpha — no token model; charge a flat per-call estimate
  wolfram: { input_per_1m: 0, output_per_1m: 0 },
};

const WOLFRAM_PER_CALL_USD = 0.001; // assumed enterprise rate; adjust as needed

export function priceForCall(opts: {
  model: string;
  input_tokens?: number;
  output_tokens?: number;
  /** for non-token models (Wolfram). Counted as USD added directly. */
  flat_usd?: number;
}): number {
  if (opts.flat_usd != null) return opts.flat_usd;
  if (opts.model === 'wolfram') return WOLFRAM_PER_CALL_USD;

  const price = PRICES[opts.model];
  if (!price) return 0; // unknown model — don't double-bill, just return 0
  const inUsd = ((opts.input_tokens ?? 0) / 1_000_000) * price.input_per_1m;
  const outUsd = ((opts.output_tokens ?? 0) / 1_000_000) * price.output_per_1m;
  return inUsd + outUsd;
}

// ============================================================================
// Per-run accumulator
// ============================================================================

export interface CostMeterOptions {
  max_cost_usd: number;
  /** Called when the cap is hit. Default: throws RunBudgetExceeded. */
  onExceeded?: (totalUsd: number) => never | void;
}

export class RunBudgetExceeded extends Error {
  constructor(public readonly total_usd: number, public readonly cap_usd: number) {
    super(`Generation run budget exceeded: $${total_usd.toFixed(4)} > cap $${cap_usd.toFixed(4)}`);
    this.name = 'RunBudgetExceeded';
  }
}

export class CostMeter {
  private total = 0;
  private calls = 0;
  private byModel: Record<string, number> = {};

  constructor(private opts: CostMeterOptions) {}

  /** Record a call's cost. Throws RunBudgetExceeded if the cap is breached. */
  add(call: {
    model: string;
    input_tokens?: number;
    output_tokens?: number;
    flat_usd?: number;
  }): number {
    const cost = priceForCall(call);
    this.total += cost;
    this.calls += 1;
    this.byModel[call.model] = (this.byModel[call.model] ?? 0) + cost;

    if (this.total > this.opts.max_cost_usd) {
      if (this.opts.onExceeded) {
        this.opts.onExceeded(this.total);
        // If onExceeded didn't throw, do it ourselves
      }
      throw new RunBudgetExceeded(this.total, this.opts.max_cost_usd);
    }
    return cost;
  }

  totalUsd(): number {
    return this.total;
  }

  callCount(): number {
    return this.calls;
  }

  breakdown(): Record<string, number> {
    return { ...this.byModel };
  }

  remaining(): number {
    return Math.max(0, this.opts.max_cost_usd - this.total);
  }
}
