/**
 * Tests for VIDHYA_LLM_PROVIDER env-override path (buildEnvOverrideConfig).
 * No network, no YAML file needed — the override bypasses providers.yaml entirely.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildEnvOverrideConfig, loadLlmConfig, clearRegistryCache } from '../registry';

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

describe('buildEnvOverrideConfig', () => {
  it('returns null when VIDHYA_LLM_PROVIDER is not set', () => {
    withEnv({ VIDHYA_LLM_PROVIDER: undefined }, () => {
      expect(buildEnvOverrideConfig()).toBeNull();
    });
  });

  it('returns null and warns for an unrecognised provider id', () => {
    withEnv({ VIDHYA_LLM_PROVIDER: 'vertex-ai' }, () => {
      expect(buildEnvOverrideConfig()).toBeNull();
    });
  });

  it('builds a single-provider config for openai', () => {
    withEnv({
      VIDHYA_LLM_PROVIDER: 'openai',
      VIDHYA_LLM_API_KEY: 'sk-test',
      VIDHYA_LLM_BASE_URL: undefined,
      VIDHYA_LLM_MODEL: undefined,
    }, () => {
      const cfg = buildEnvOverrideConfig();
      expect(cfg).not.toBeNull();
      expect(cfg!.defaultProvider).toBe('openai');
      expect(cfg!.providers.openai.enabled).toBe(true);
      expect(cfg!.providers.openai.apiKey).toBe('sk-test');
      // model id falls back to 'default' when VIDHYA_LLM_MODEL is unset
      expect(cfg!.providers.openai.models.custom.id).toBe('default');
    });
  });

  it('respects VIDHYA_LLM_MODEL override', () => {
    withEnv({
      VIDHYA_LLM_PROVIDER: 'openai',
      VIDHYA_LLM_API_KEY: 'sk-test',
      VIDHYA_LLM_MODEL: 'gpt-4o',
    }, () => {
      const cfg = buildEnvOverrideConfig();
      expect(cfg!.providers.openai.models.custom.id).toBe('gpt-4o');
    });
  });

  it('passes baseUrl through for Azure OpenAI / custom endpoints', () => {
    withEnv({
      VIDHYA_LLM_PROVIDER: 'openai',
      VIDHYA_LLM_API_KEY: 'azure-key',
      VIDHYA_LLM_BASE_URL: 'https://company.openai.azure.com/openai/deployments/gpt-4o',
      VIDHYA_LLM_MODEL: 'gpt-4o',
    }, () => {
      const cfg = buildEnvOverrideConfig();
      expect(cfg!.providers.openai.baseUrl).toBe('https://company.openai.azure.com/openai/deployments/gpt-4o');
    });
  });

  it('does not set apiKey when VIDHYA_LLM_API_KEY is absent (keyless like ollama)', () => {
    withEnv({
      VIDHYA_LLM_PROVIDER: 'ollama',
      VIDHYA_LLM_API_KEY: undefined,
      VIDHYA_LLM_BASE_URL: undefined,
    }, () => {
      const cfg = buildEnvOverrideConfig();
      expect(cfg!.providers.ollama.apiKey).toBeUndefined();
    });
  });

  it('supports openrouter for cost-effective routing', () => {
    withEnv({
      VIDHYA_LLM_PROVIDER: 'openrouter',
      VIDHYA_LLM_API_KEY: 'sk-or-test',
      VIDHYA_LLM_MODEL: 'anthropic/claude-sonnet-4-5',
    }, () => {
      const cfg = buildEnvOverrideConfig();
      expect(cfg!.defaultProvider).toBe('openrouter');
      expect(cfg!.providers.openrouter.models.custom.id).toBe('anthropic/claude-sonnet-4-5');
    });
  });

  it('all valid adapter ids are accepted', () => {
    const validIds = ['gemini', 'learnlm', 'anthropic', 'openai', 'openrouter', 'ollama'];
    for (const pid of validIds) {
      withEnv({ VIDHYA_LLM_PROVIDER: pid, VIDHYA_LLM_API_KEY: 'k' }, () => {
        expect(buildEnvOverrideConfig()).not.toBeNull();
      });
    }
  });
});

describe('loadLlmConfig with env override', () => {
  beforeEach(() => clearRegistryCache());
  afterEach(() => clearRegistryCache());

  it('returns override config without touching providers.yaml when VIDHYA_LLM_PROVIDER is set', () => {
    withEnv({
      VIDHYA_LLM_PROVIDER: 'anthropic',
      VIDHYA_LLM_API_KEY: 'sk-ant-test',
      VIDHYA_LLM_MODEL: 'claude-sonnet-4-5',
      // Point LLM_CONFIG_PATH at a non-existent path — would throw if the YAML path ran
      LLM_CONFIG_PATH: '/tmp/definitely-does-not-exist-vidhya-test.yaml',
    }, () => {
      const cfg = loadLlmConfig();
      expect(cfg.defaultProvider).toBe('anthropic');
      expect(cfg.providers.anthropic.enabled).toBe(true);
    });
  });
});
