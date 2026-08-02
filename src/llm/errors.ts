/**
 * Named errors for the LLM router/registry seam.
 *
 * Part of the "One Truth" foundation (CEO plan §8, §12): a seam is only
 * plug-and-play if its failures are named, not swallowed. These replace
 * the old behavior where an unconfigured/retired model silently rerouted
 * to whatever provider happened to be enabled (the exact bug class that
 * broke multi-llm-consensus's independence guarantee — see
 * claude/2026-08-02-Content-Pipeline-Workflow-Hardening.md, round 1).
 */

/**
 * Thrown when a caller requests an explicit model id that isn't present
 * in the currently loaded provider registry (config/providers.yaml) —
 * either because the provider isn't configured (no API key / not
 * enabled), or because the provider retired the model id server-side.
 * Callers must NOT silently reroute to a different provider on this
 * error; that is precisely the failure this class exists to prevent.
 */
export class ModelRetiredError extends Error {
  readonly modelId: string;

  constructor(modelId: string, extra?: string) {
    super(
      `Model "${modelId}" is not available in the current provider registry ` +
      `(config/providers.yaml, or LLM_CONFIG_PATH override) — either no provider ` +
      `serves this model id, or the configured provider lacks a usable key.` +
      (extra ? ` ${extra}` : ''),
    );
    this.name = 'ModelRetiredError';
    this.modelId = modelId;
  }
}

/**
 * Thrown before a consensus (multi-provider independence) request is
 * dispatched, when both legs of the consensus pair would resolve to the
 * SAME underlying provider. Consensus generation exists specifically to
 * get two independent opinions; silently degrading to one provider
 * calling itself twice defeats the guarantee. Refused before any spend.
 */
export class ConsensusRoutingError extends Error {
  readonly providerA: string;
  readonly providerB: string;

  constructor(providerA: string, providerB: string) {
    super(
      `Consensus request refused: both legs resolved to provider "${providerA}" ` +
      `— independence guarantee requires two distinct providers. Configure a ` +
      `second provider's API key, or reduce to single-model generation explicitly.`,
    );
    this.name = 'ConsensusRoutingError';
    this.providerA = providerA;
    this.providerB = providerB;
  }
}

/**
 * Thrown by the CI adapter-conformance runner (§8.2) when an adapter
 * fails one or more of the required conformance checks (generate,
 * refuse, timeout, cost-report, model-listing). Carries the per-check
 * report so CI can print exactly what failed.
 */
export class AdapterConformanceError extends Error {
  readonly provider: string;
  readonly failures: string[];

  constructor(provider: string, failures: string[]) {
    super(
      `Adapter conformance failed for provider "${provider}": ${failures.join('; ')}`,
    );
    this.name = 'AdapterConformanceError';
    this.provider = provider;
    this.failures = failures;
  }
}
