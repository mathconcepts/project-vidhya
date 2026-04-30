/**
 * Brand constants tests.
 *
 * Pin down the env-var fallback contract: env wins, default backs it up,
 * BRAND_NAME is always Vidhya.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('brand constants', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset module cache so re-imports pick up fresh env
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('exports BRAND_NAME = "Vidhya"', async () => {
    const { BRAND_NAME } = await import('../../../lib/brand');
    expect(BRAND_NAME).toBe('Vidhya');
  });

  it('uses default FROM_EMAIL when no env is set', async () => {
    delete process.env.FROM_EMAIL;
    const { FROM_EMAIL } = await import('../../../lib/brand');
    expect(FROM_EMAIL).toContain('Vidhya');
    expect(FROM_EMAIL).toContain('@vidhya.app');
  });

  it('FROM_EMAIL never contains "GATE Math" (regression guard)', async () => {
    delete process.env.FROM_EMAIL;
    const { FROM_EMAIL } = await import('../../../lib/brand');
    expect(FROM_EMAIL).not.toContain('GATE Math');
    expect(FROM_EMAIL).not.toContain('gatemath');
  });

  it('overrides FROM_EMAIL from env when set', async () => {
    process.env.FROM_EMAIL = 'Custom <a@b.com>';
    const { FROM_EMAIL } = await import('../../../lib/brand');
    expect(FROM_EMAIL).toBe('Custom <a@b.com>');
  });

  it('BASE_URL falls back to a default when env is unset', async () => {
    delete process.env.BASE_URL;
    const { BASE_URL } = await import('../../../lib/brand');
    expect(BASE_URL).toMatch(/^https?:\/\//);
  });

  it('overrides BASE_URL from env when set', async () => {
    process.env.BASE_URL = 'https://staging.example.com';
    const { BASE_URL } = await import('../../../lib/brand');
    expect(BASE_URL).toBe('https://staging.example.com');
  });
});
