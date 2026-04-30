export function computeFeatureFlags(env: Record<string, string | undefined> = process.env) {
  return {
    ai_chat: !!(env.GEMINI_API_KEY || env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY || env.VIDHYA_LLM_PRIMARY_KEY),
    wolfram: !!env.WOLFRAM_APP_ID,
    google_auth: !!env.GOOGLE_OAUTH_CLIENT_ID,
    analytics: !!env.POSTHOG_HOST,
    telegram: !!env.TELEGRAM_BOT_TOKEN,
    whatsapp: !!(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),
    database: !!(env.DATABASE_URL || env.SUPABASE_DB_URL),
  };
}
