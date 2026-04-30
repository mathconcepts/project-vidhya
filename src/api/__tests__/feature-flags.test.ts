import { describe, it, expect } from 'vitest';
import { computeFeatureFlags } from '../feature-flags';

describe('computeFeatureFlags', () => {
  it('all false when no env vars set', () => {
    const flags = computeFeatureFlags({});
    expect(flags).toEqual({
      ai_chat: false,
      wolfram: false,
      google_auth: false,
      analytics: false,
      telegram: false,
      whatsapp: false,
      database: false,
    });
  });

  it('ai_chat true for GEMINI_API_KEY', () => {
    expect(computeFeatureFlags({ GEMINI_API_KEY: 'key' }).ai_chat).toBe(true);
  });

  it('ai_chat true for ANTHROPIC_API_KEY', () => {
    expect(computeFeatureFlags({ ANTHROPIC_API_KEY: 'key' }).ai_chat).toBe(true);
  });

  it('ai_chat true for OPENAI_API_KEY', () => {
    expect(computeFeatureFlags({ OPENAI_API_KEY: 'key' }).ai_chat).toBe(true);
  });

  it('ai_chat true for VIDHYA_LLM_PRIMARY_KEY', () => {
    expect(computeFeatureFlags({ VIDHYA_LLM_PRIMARY_KEY: 'key' }).ai_chat).toBe(true);
  });

  it('whatsapp requires both tokens', () => {
    expect(computeFeatureFlags({ WHATSAPP_ACCESS_TOKEN: 't' }).whatsapp).toBe(false);
    expect(computeFeatureFlags({ WHATSAPP_PHONE_NUMBER_ID: 'p' }).whatsapp).toBe(false);
    expect(computeFeatureFlags({ WHATSAPP_ACCESS_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: 'p' }).whatsapp).toBe(true);
  });

  it('database true for DATABASE_URL or SUPABASE_DB_URL', () => {
    expect(computeFeatureFlags({ DATABASE_URL: 'postgres://...' }).database).toBe(true);
    expect(computeFeatureFlags({ SUPABASE_DB_URL: 'postgres://...' }).database).toBe(true);
  });

  it('wolfram, google_auth, analytics, telegram each need their own key', () => {
    const flags = computeFeatureFlags({
      WOLFRAM_APP_ID: 'w',
      GOOGLE_OAUTH_CLIENT_ID: 'g',
      POSTHOG_HOST: 'https://ph',
      TELEGRAM_BOT_TOKEN: 'tg',
    });
    expect(flags.wolfram).toBe(true);
    expect(flags.google_auth).toBe(true);
    expect(flags.analytics).toBe(true);
    expect(flags.telegram).toBe(true);
  });
});
