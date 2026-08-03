/**
 * Unit tests for SetupWizardPage's pure derivation logic (live-result
 * merging, per-provider tone, overall readiness tone). The interactive
 * parts (fetching status, the "test providers now" button) are exercised
 * manually / by the backend's own admin-setup-routes.test.ts — these tests
 * pin the pure functions so a refactor can't silently change what an
 * operator sees.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from './SetupWizardPage';
import type { ProviderStatus, ProviderTestResult, SetupStatus } from '@/api/admin/setup';

const { mergeLiveResult, providerTone, overallTone } = __testing;

function provider(overrides: Partial<ProviderStatus> = {}): ProviderStatus {
  return {
    provider: 'gemini',
    enabled: true,
    api_key_env: 'GEMINI_API_KEY',
    key_present: true,
    model_count: 2,
    required: true,
    ...overrides,
  };
}

describe('SetupWizardPage.mergeLiveResult', () => {
  it('returns null when no live results exist yet', () => {
    expect(mergeLiveResult(provider(), null)).toBeNull();
  });

  it('finds the matching provider by id', () => {
    const results: ProviderTestResult[] = [
      { provider: 'anthropic', ok: false, error: 'bad key' },
      { provider: 'gemini', ok: true },
    ];
    expect(mergeLiveResult(provider({ provider: 'gemini' }), results)).toEqual({ provider: 'gemini', ok: true });
  });

  it('returns null when live results exist but this provider was not tested', () => {
    const results: ProviderTestResult[] = [{ provider: 'anthropic', ok: true }];
    expect(mergeLiveResult(provider({ provider: 'gemini' }), results)).toBeNull();
  });
});

describe('SetupWizardPage.providerTone', () => {
  it('a live result always wins, regardless of static config', () => {
    expect(providerTone(provider({ key_present: false }), { provider: 'gemini', ok: true })).toBe('good');
    expect(providerTone(provider({ key_present: true }), { provider: 'gemini', ok: false, error: 'expired' })).toBe('bad');
  });

  it('a disabled provider is neutral when not live-tested', () => {
    expect(providerTone(provider({ enabled: false }), null)).toBe('neutral');
  });

  it('a missing key on the required provider is bad; on an optional provider is a warning', () => {
    expect(providerTone(provider({ required: true, key_present: false }), null)).toBe('bad');
    expect(providerTone(provider({ required: false, key_present: false }), null)).toBe('warn');
  });

  it('a configured-but-untested provider is neutral', () => {
    expect(providerTone(provider({ key_present: true }), null)).toBe('neutral');
  });
});

describe('SetupWizardPage.overallTone', () => {
  it('is neutral before status has loaded', () => {
    expect(overallTone(null)).toBe('neutral');
  });

  it('is good when the hard requirement (Gemini) is met', () => {
    const status = { hard_requirement_met: true } as SetupStatus;
    expect(overallTone(status)).toBe('good');
  });

  it('is bad when the hard requirement is not met', () => {
    const status = { hard_requirement_met: false } as SetupStatus;
    expect(overallTone(status)).toBe('bad');
  });
});
