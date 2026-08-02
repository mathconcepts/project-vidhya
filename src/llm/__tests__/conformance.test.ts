/**
 * Tests for the adapter conformance suite itself (CEO plan §8.2). Runs
 * against the real config/providers.yaml so this doubles as a smoke test
 * that the tracked registry stays adapter-conformant — the exact
 * guarantee this suite exists to give CI.
 */

import { describe, it, expect } from 'vitest';
import { loadProvidersRegistry, resolveProvidersYamlPath } from '../registry';
import { runAdapterConformance, runAllAdapterConformance, CONFORMANCE_PROVIDERS } from '../conformance';
import { AdapterConformanceError } from '../errors';

const registry = loadProvidersRegistry(resolveProvidersYamlPath());

describe('conformance.ts', () => {
  it.each(CONFORMANCE_PROVIDERS)('provider "%s" passes all 5 conformance checks against the tracked registry', async (providerId) => {
    const report = await runAdapterConformance(registry, providerId);
    if (!report.pass) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(report, null, 2));
    }
    expect(report.pass).toBe(true);
    expect(report.checks.map(c => c.name).sort()).toEqual(
      ['cost-report', 'generate', 'model-listing', 'refuse', 'timeout'].sort(),
    );
  });

  it('runAllAdapterConformance resolves with one report per provider when everything passes', async () => {
    const reports = await runAllAdapterConformance(registry);
    expect(reports).toHaveLength(CONFORMANCE_PROVIDERS.length);
    expect(reports.every(r => r.pass)).toBe(true);
  });

  it('runAllAdapterConformance throws AdapterConformanceError naming the failing checks when a fixture is broken', async () => {
    // Registry entry for a provider that has no matching fixture at all —
    // exercises the "no conformance fixture" failure path deterministically.
    const brokenRegistry = {
      ...registry,
      providers: { ...registry.providers, gemini: { ...registry.providers.gemini, models: {} } },
    };
    await expect(runAllAdapterConformance(brokenRegistry as any)).rejects.toThrow(AdapterConformanceError);
  });

  it('restores globalThis.fetch after running, even when a check fails', async () => {
    const original = globalThis.fetch;
    await runAdapterConformance(registry, 'gemini');
    expect(globalThis.fetch).toBe(original);
  });
});
