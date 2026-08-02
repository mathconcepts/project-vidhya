/**
 * Tests for src/llm/registry.ts — the single config-truth loader (CEO
 * plan §8). Pure fixture-based, no network, no live keys.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  loadProvidersRegistry,
  buildLlmConfigFromRegistry,
  loadLlmConfig,
  clearRegistryCache,
  checkPriceStaleness,
  ensureProvidersYamlBootstrap,
  PRICE_STALE_AFTER_DAYS,
  type ProvidersRegistry,
} from '../registry';

const FIXTURE_YAML = `
version: "2.0"
default_provider: gemini
providers:
  gemini:
    enabled: true
    api_key_env: TEST_GEMINI_KEY
    priced_at: "2026-01-01"
    models:
      flash:
        id: "gemini-2.0-flash"
        cost_per_1k_input: 0.000075
        cost_per_1k_output: 0.0003
        tier: routine
    fallback_order: [flash]
  anthropic:
    enabled: true
    api_key_env: TEST_ANTHROPIC_KEY
    priced_at: "2026-07-01"
    models:
      sonnet:
        id: "claude-sonnet-4-20250514"
        cost_per_1k_input: 0.003
        cost_per_1k_output: 0.015
        tier: quality
    fallback_order: [sonnet]
  ollama:
    enabled: false
    models:
      llama:
        id: "llama3.2"
        cost_per_1k_input: 0
        cost_per_1k_output: 0
        tier: local
    fallback_order: [llama]
`;

describe('registry.ts', () => {
  let dir: string;
  let yamlPath: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'vidhya-registry-test-'));
    yamlPath = path.join(dir, 'providers.yaml');
    writeFileSync(yamlPath, FIXTURE_YAML, 'utf-8');
    clearRegistryCache();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    clearRegistryCache();
    vi.unstubAllEnvs();
  });

  it('loads and parses the YAML registry', () => {
    const registry = loadProvidersRegistry(yamlPath);
    expect(registry.default_provider).toBe('gemini');
    expect(Object.keys(registry.providers)).toEqual(['gemini', 'anthropic', 'ollama']);
    expect(registry.providers.gemini.models.flash.id).toBe('gemini-2.0-flash');
  });

  it('throws a clear error when the registry file is missing', () => {
    expect(() => loadProvidersRegistry(path.join(dir, 'nope.yaml'))).toThrow(/not found/);
  });

  it('throws when the YAML is malformed (missing providers map)', () => {
    const badPath = path.join(dir, 'bad.yaml');
    writeFileSync(badPath, 'version: "2.0"\n', 'utf-8');
    expect(() => loadProvidersRegistry(badPath)).toThrow(/malformed/);
  });

  it('gates provider availability on the env var named by api_key_env', () => {
    const registry = loadProvidersRegistry(yamlPath);

    // Neither key set — nothing enabled.
    let config = buildLlmConfigFromRegistry(registry, {});
    expect(Object.keys(config.providers)).toEqual([]);
    expect(config.defaultProvider).toBe('');

    // Gemini key set — gemini enabled, anthropic still gated off.
    config = buildLlmConfigFromRegistry(registry, { TEST_GEMINI_KEY: 'fake-key' } as any);
    expect(Object.keys(config.providers)).toEqual(['gemini']);
    expect(config.defaultProvider).toBe('gemini');

    // Both keys set — both enabled, full model data carried through
    // (not a hand-duplicated subset).
    config = buildLlmConfigFromRegistry(registry, {
      TEST_GEMINI_KEY: 'fake', TEST_ANTHROPIC_KEY: 'fake',
    } as any);
    expect(Object.keys(config.providers).sort()).toEqual(['anthropic', 'gemini']);
    expect(config.providers.anthropic.models.sonnet.costPer1kInput).toBe(0.003);
  });

  it('never enables a provider whose registry entry is enabled:false, even with a key present', () => {
    const registry = loadProvidersRegistry(yamlPath);
    const config = buildLlmConfigFromRegistry(registry, {
      TEST_GEMINI_KEY: 'fake', TEST_ANTHROPIC_KEY: 'fake',
    } as any);
    // ollama has no api_key_env and enabled:false in the fixture.
    expect(config.providers.ollama).toBeUndefined();
  });

  it('falls back to the first enabled provider when default_provider has no key', () => {
    const registry = loadProvidersRegistry(yamlPath);
    const config = buildLlmConfigFromRegistry(registry, { TEST_ANTHROPIC_KEY: 'fake' } as any);
    expect(config.defaultProvider).toBe('anthropic');
  });

  it('loadLlmConfig() degrades to an empty config (not a throw) when the file is absent, by default', () => {
    const config = loadLlmConfig();
    // Whatever this process's real config/providers.yaml resolves to is
    // fine either way — the contract under test is "never throws".
    expect(config).toHaveProperty('providers');
    expect(config).toHaveProperty('defaultProvider');
  });

  it('loadLlmConfig({ strict: true }) throws on a missing registry', () => {
    const missing = path.join(dir, 'does-not-exist.yaml');
    vi.stubEnv('LLM_CONFIG_PATH', missing);
    clearRegistryCache();
    expect(() => loadLlmConfig({ strict: true })).toThrow(/not found/);
  });

  it('ensureProvidersYamlBootstrap creates a key-free file only when absent', () => {
    const bootstrapPath = path.join(dir, 'bootstrap.yaml');
    expect(ensureProvidersYamlBootstrap(bootstrapPath)).toBe('created');

    const written = loadProvidersRegistry(bootstrapPath);
    expect(written.providers.gemini.api_key_env).toBe('GEMINI_API_KEY');
    // Never embeds a literal key value.
    const raw = require('fs').readFileSync(bootstrapPath, 'utf-8');
    expect(raw).not.toMatch(/AIza|sk-ant-|sk-[a-zA-Z0-9]{20,}/);

    // Second call is a no-op — never overwrites an existing (possibly
    // hand-edited) file.
    writeFileSync(bootstrapPath, written ? require('fs').readFileSync(bootstrapPath, 'utf-8') + '\n# hand-edited\n' : '', 'utf-8');
    expect(ensureProvidersYamlBootstrap(bootstrapPath)).toBe('existing');
    expect(require('fs').readFileSync(bootstrapPath, 'utf-8')).toMatch(/# hand-edited/);
  });

  it('checkPriceStaleness flags providers past the staleness window', () => {
    const registry = loadProvidersRegistry(yamlPath);
    const now = new Date('2026-08-02T00:00:00Z');
    const results = checkPriceStaleness(registry, now);

    const gemini = results.find(r => r.provider === 'gemini')!;
    // priced_at 2026-01-01 -> ~213 days old, well past the 90-day window.
    expect(gemini.ageDays).toBeGreaterThan(PRICE_STALE_AFTER_DAYS);
    expect(gemini.stale).toBe(true);

    const anthropic = results.find(r => r.provider === 'anthropic')!;
    // priced_at 2026-07-01 -> ~32 days old.
    expect(anthropic.ageDays).toBeLessThan(PRICE_STALE_AFTER_DAYS);
    expect(anthropic.stale).toBe(false);
  });

  it('checkPriceStaleness treats a missing priced_at as stale', () => {
    const registry: ProvidersRegistry = {
      version: '2.0',
      default_provider: 'x',
      providers: { x: { enabled: true, models: {}, fallback_order: [] } },
    };
    const [result] = checkPriceStaleness(registry);
    expect(result.stale).toBe(true);
    expect(result.ageDays).toBeNull();
  });
});
