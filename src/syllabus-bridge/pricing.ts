/**
 * One price table for the bridge, because two of them had already drifted.
 *
 * The operator's plan screen priced a batch at Gemini Flash rates ($0.30/M)
 * while the spend cap charged the same batch at Anthropic rates ($3.00/M) —
 * a 10x gap between the number someone approves and the number that stops
 * the run. Nothing detected it, because each side was internally consistent.
 *
 * So the rate table, the provider the bridge actually asks for, and the label
 * shown to the operator all live here, and the estimate the UI shows is
 * computed from the same function that enforces the cap.
 *
 * If BRIDGE_MODEL_ID in batch-runner.ts changes provider, change
 * BRIDGE_PROVIDER here in the same commit. The test asserts they agree.
 */

export type PricedProvider = 'gemini' | 'anthropic' | 'openai';

/** Rough per-million-token output prices, mid-tier models. */
export const PROVIDER_RATE_USD_PER_MTOK: Record<PricedProvider, number> = {
  gemini: 0.30,
  anthropic: 3.00,
  openai: 2.50,
};

/**
 * The provider `BRIDGE_MODEL_ID` resolves to. Estimates are quoted at this
 * rate so the plan screen and the cap agree on what a batch costs.
 */
export const BRIDGE_PROVIDER: PricedProvider = 'anthropic';

/** What to call it on screen. Derived here so no component hardcodes a name. */
export const BRIDGE_PRICING_LABEL = 'Claude Sonnet';

export function estimateCost(provider: PricedProvider, tokens: number): number {
  return Number(((tokens / 1_000_000) * PROVIDER_RATE_USD_PER_MTOK[provider]).toFixed(5));
}
