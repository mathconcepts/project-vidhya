/**
 * registry.ts — the ONE config truth for LLM provider/model/pricing data.
 *
 * CEO plan §8: "config/providers.yaml becomes the only configuration
 * truth; env-config.ts demotes from parallel truth to bootstrap shim."
 *
 * Before this file existed, three call sites (orchestrator.ts x2,
 * llm-judge.ts x1) each did:
 *
 *   const config = process.env.LLM_CONFIG_PATH
 *     ? require(process.env.LLM_CONFIG_PATH)
 *     : buildLlmConfigFromEnv();
 *
 * Two bugs in that snippet, both fixed here:
 *   1. `require()` cannot parse YAML — if LLM_CONFIG_PATH ever pointed at
 *      config/providers.yaml (the file the docs call canonical), this
 *      would throw at runtime. It was never actually exercised because
 *      LLM_CONFIG_PATH was never set anywhere (see env-config.ts's
 *      original docblock) — the registry was reachable only by tests.
 *   2. buildLlmConfigFromEnv() hand-duplicated ONE model per provider
 *      (gemini flash only, claude sonnet only, ...) instead of reading
 *      the full registry — a second, narrower truth that could drift
 *      from config/providers.yaml (e.g. gemini-2.0-flash vs the
 *      registry's gemini.flash id) without anything noticing.
 *
 * This module is the single loader every call site now uses.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

// ============================================================================
// Types — the on-disk registry shape (config/providers.yaml)
// ============================================================================

export interface RegistryModel {
  id: string;
  context_window?: number;
  max_output?: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  tier?: string;
  specialization?: string;
}

export interface RegistryProvider {
  enabled: boolean;
  /** Which env var holds this provider's API key. Never the key itself —
   *  the tracked YAML stays key-free by design (CEO plan §8). Absent for
   *  keyless providers (ollama). */
  api_key_env?: string;
  /** ISO date the cost_per_1k_* figures were last checked against the
   *  provider's published pricing. No auto-update (CEO plan §8.4 — silent
   *  wrongness is worse than visible staleness); a human updates this
   *  whenever prices are re-verified. */
  priced_at?: string;
  models: Record<string, RegistryModel>;
  fallback_order: string[];
  base_url?: string;
}

export interface ProvidersRegistry {
  version: string;
  default_provider: string;
  providers: Record<string, RegistryProvider>;
  task_routing?: Record<string, string[]>;
  fallback?: Record<string, unknown>;
  budget?: Record<string, unknown>;
}

// ============================================================================
// Types — the shape LLMClient/ModelRouter consume (unchanged wire format,
// so this is a drop-in replacement for the old buildLlmConfigFromEnv()
// return value — no call-site changes needed beyond swapping the loader).
// ============================================================================

export interface EnvLlmConfig {
  providers: Record<string, {
    enabled: boolean;
    models: Record<string, { id: string; tier?: string; costPer1kInput?: number; costPer1kOutput?: number }>;
    fallbackOrder: string[];
  }>;
  defaultProvider: string;
}

// ============================================================================
// Path resolution
// ============================================================================

/** Default location of the tracked provider registry, repo-root-relative
 *  (matches the convention every other config loader in this repo uses —
 *  see src/curriculum/exam-loader.ts's CURRICULUM_DIR). */
export function defaultProvidersYamlPath(): string {
  return path.resolve(process.cwd(), 'config/providers.yaml');
}

/** LLM_CONFIG_PATH, when set, overrides the default location — e.g. for
 *  tests that want a fixture registry, or a future per-deployment
 *  override. Unset means "use the tracked config/providers.yaml". */
export function resolveProvidersYamlPath(): string {
  return process.env.LLM_CONFIG_PATH || defaultProvidersYamlPath();
}

// ============================================================================
// Loading + parsing
// ============================================================================

let cachedRegistry: { path: string; mtimeMs: number; parsed: ProvidersRegistry } | null = null;

/**
 * Load + parse the provider registry YAML. Cached by (path, mtime) so
 * repeated calls within a process (every generation call, historically)
 * don't re-read + re-parse the file each time; a file edit invalidates
 * the cache automatically.
 */
export function loadProvidersRegistry(yamlPath: string = resolveProvidersYamlPath()): ProvidersRegistry {
  const stat = existsSync(yamlPath) ? require('fs').statSync(yamlPath) : null;
  const mtimeMs = stat?.mtimeMs ?? 0;

  if (cachedRegistry && cachedRegistry.path === yamlPath && cachedRegistry.mtimeMs === mtimeMs) {
    return cachedRegistry.parsed;
  }

  if (!stat) {
    throw new Error(
      `Provider registry not found at "${yamlPath}". Expected config/providers.yaml ` +
      `(or LLM_CONFIG_PATH override) — run \`npm run content:setup\` to bootstrap it.`,
    );
  }

  const text = readFileSync(yamlPath, 'utf-8');
  const parsed = parseYaml(text) as ProvidersRegistry;
  if (!parsed || typeof parsed !== 'object' || !parsed.providers) {
    throw new Error(`Provider registry at "${yamlPath}" is malformed — missing top-level "providers" map.`);
  }

  cachedRegistry = { path: yamlPath, mtimeMs, parsed };
  return parsed;
}

/** Test-only: drop the in-process cache so a freshly written fixture is picked up. */
export function clearRegistryCache(): void {
  cachedRegistry = null;
}

// ============================================================================
// Registry -> LLMClient config, with env-driven "is this provider usable
// right now" gating. This is the ONLY place that decision is made.
// ============================================================================

/**
 * A provider is enabled for THIS process iff:
 *   (a) the registry marks it enabled, AND
 *   (b) either it needs no key (api_key_env unset — e.g. ollama), or the
 *       named env var actually holds a non-empty value.
 *
 * (b) is new: the registry's static `enabled: true` on gemini/anthropic/
 * openai used to mean "an adapter gets constructed regardless of whether
 * a key exists", which let the router hand a request to a provider with
 * an empty key and get a real-but-confusing auth error deep in the
 * adapter instead of a clean "not configured" signal at the routing
 * layer. Gating here makes availability match reality.
 */
export function buildLlmConfigFromRegistry(
  registry: ProvidersRegistry,
  env: NodeJS.ProcessEnv = process.env,
): EnvLlmConfig {
  const providers: EnvLlmConfig['providers'] = {};

  for (const [providerId, pdef] of Object.entries(registry.providers)) {
    if (!pdef.enabled) continue;
    const hasKey = !pdef.api_key_env || !!env[pdef.api_key_env];
    if (!hasKey) continue;

    const models: EnvLlmConfig['providers'][string]['models'] = {};
    for (const [modelKey, mdef] of Object.entries(pdef.models)) {
      models[modelKey] = {
        id: mdef.id,
        tier: mdef.tier,
        costPer1kInput: mdef.cost_per_1k_input,
        costPer1kOutput: mdef.cost_per_1k_output,
      };
    }

    providers[providerId] = {
      enabled: true,
      models,
      fallbackOrder: pdef.fallback_order,
    };
  }

  const defaultProvider = providers[registry.default_provider]
    ? registry.default_provider
    : (Object.keys(providers)[0] || '');

  return { providers, defaultProvider };
}

/**
 * The single entry point every call site should use. Replaces the old
 * per-call-site `LLM_CONFIG_PATH ? require(...) : buildLlmConfigFromEnv()`
 * ternary. Never throws on a missing/malformed registry for callers that
 * can tolerate an empty config (mirrors the old graceful-degrade
 * behavior) — pass `strict: true` to opt into a hard failure instead
 * (used by setup-cli.ts, which wants to fail loudly).
 */
export function loadLlmConfig(opts: { strict?: boolean } = {}): EnvLlmConfig {
  try {
    const registry = loadProvidersRegistry();
    return buildLlmConfigFromRegistry(registry);
  } catch (err) {
    if (opts.strict) throw err;
    console.warn(`[llm/registry] falling back to empty config: ${(err as Error).message}`);
    return { providers: {}, defaultProvider: '' };
  }
}

// ============================================================================
// Bootstrap shim (fresh installs only)
// ============================================================================

/**
 * Writes config/providers.yaml ONLY if it is absent — a brand-new clone
 * with no tracked registry file at all (shouldn't happen in this repo,
 * since providers.yaml is committed, but keeps `npm run content:setup`
 * self-healing for forks/fresh scaffolds). Never overwrites the tracked
 * file, never writes secrets — the emitted file names which env var
 * holds each key, it does not embed key values.
 */
export function ensureProvidersYamlBootstrap(yamlPath: string = defaultProvidersYamlPath()): 'existing' | 'created' {
  if (existsSync(yamlPath)) return 'existing';

  const dir = path.dirname(yamlPath);
  mkdirSync(dir, { recursive: true });

  const bootstrap = `# Project Vidhya LLM Provider Registry (auto-bootstrapped — no tracked
# config/providers.yaml was found). Edit freely; this file is the single
# source of truth for provider/model/pricing data (CEO plan §8). Keys are
# NEVER stored here — api_key_env names which environment variable holds
# each provider's key.

version: "2.0"
default_provider: gemini

providers:
  gemini:
    enabled: true
    api_key_env: GEMINI_API_KEY
    priced_at: "${new Date().toISOString().slice(0, 10)}"
    models:
      flash:
        id: "gemini-2.0-flash"
        cost_per_1k_input: 0.000075
        cost_per_1k_output: 0.0003
        tier: routine
    fallback_order: [flash]

  anthropic:
    enabled: true
    api_key_env: ANTHROPIC_API_KEY
    priced_at: "${new Date().toISOString().slice(0, 10)}"
    models:
      sonnet:
        id: "claude-sonnet-4-20250514"
        cost_per_1k_input: 0.003
        cost_per_1k_output: 0.015
        tier: quality
    fallback_order: [sonnet]
`;
  writeFileSync(yamlPath, bootstrap, 'utf-8');
  return 'created';
}

// ============================================================================
// Price staleness (CEO plan §8.4 — "the cockpit shows staleness (>90
// days = amber)"; the cockpit itself is Phase 1, this is the pure
// function it will call).
// ============================================================================

export const PRICE_STALE_AFTER_DAYS = 90;

export interface PriceStaleness {
  provider: string;
  pricedAt: string | null;
  ageDays: number | null;
  stale: boolean;
}

export function checkPriceStaleness(
  registry: ProvidersRegistry,
  now: Date = new Date(),
): PriceStaleness[] {
  return Object.entries(registry.providers).map(([provider, pdef]) => {
    if (!pdef.priced_at) return { provider, pricedAt: null, ageDays: null, stale: true };
    const priced = new Date(pdef.priced_at);
    const ageDays = Math.floor((now.getTime() - priced.getTime()) / (1000 * 60 * 60 * 24));
    return { provider, pricedAt: pdef.priced_at, ageDays, stale: ageDays > PRICE_STALE_AFTER_DAYS };
  });
}

// ============================================================================
// Routing decision log — "a routing decision log line per call makes any
// future silent-rerouting visible in one grep" (CEO plan §8.1).
// ============================================================================

export function logRoutingDecision(entry: {
  requestedModel?: string;
  requestedProvider?: string;
  servedProvider: string;
  servedModel: string;
  taskType?: string;
}): void {
  console.log(
    `[llm-router] asked=${entry.requestedProvider || entry.requestedModel || 'auto'} ` +
    `served=${entry.servedProvider}/${entry.servedModel}` +
    (entry.taskType ? ` task=${entry.taskType}` : ''),
  );
}
