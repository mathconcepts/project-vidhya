# LLM Configuration Guide

Vidhya is **LLM-agnostic**. You bring your own API key from any supported provider, and the system adapts. This guide covers setup, troubleshooting, and the underlying architecture.

---

## Quick start — 30 seconds

1. Open Vidhya in your browser
2. Navigate to `/llm-config`
3. Pick a provider (we recommend **Google Gemini** — generous free tier)
4. Paste your API key
5. Click **Test & save**

Done. Vidhya now uses your chosen AI for chat, image understanding, and structured generation. No server-side storage, no account required.

---

## Supported providers

| Provider | Free tier | Vision | Best for |
|----------|-----------|--------|----------|
| **Google Gemini** | Yes, generous | ✓ | Most users — cheap, fast, multimodal |
| **Anthropic Claude** | Pay-as-you-go | ✓ | Reasoning-heavy tasks, careful outputs |
| **OpenAI** | Credit-based | ✓ | Broad model selection |
| **OpenRouter** | Pay-as-you-go | ✓ | Experimenting across providers |
| **Groq** | Yes, rate-limited | ✗ | Ultra-fast chat, no image input |
| **DeepSeek** | Cheap | ✗ | Chain-of-thought reasoning, very cheap |
| **Mistral** | Pay-as-you-go | ✓ (Pixtral) | European-hosted |
| **Ollama (local)** | Free | ✓ (LLaVA) | Privacy-critical, fully offline |

Full provider definitions with pricing tiers and model lists live in `src/llm/provider-registry.ts`. Adding a provider is a data change, not a code change.

---

## How cascading defaults work

When you pick a primary provider, Vidhya auto-fills three dependent roles:

| Role | What it's for | Default rule |
|------|--------------|--------------|
| **Chat** | Conversational tutor responses | Primary provider's best general-purpose model |
| **Vision** | Photos of math problems, handwriting | Primary provider's vision model (if supported) |
| **Structured (JSON)** | Intent detection, explainer generation | Primary provider's cheapest capable model |

**Example — you pick Google Gemini:**
- Chat: Gemini 2.5 Flash
- Vision: Gemini 2.5 Flash
- JSON: Gemini 2.5 Flash-Lite (3× cheaper, plenty smart for structured output)

**Example — you pick Groq (no vision support):**
- Chat: Llama 3.3 70B Versatile
- Vision: (unsupported — falls through to bundle-only mode for images)
- JSON: Llama 3.1 8B Instant

Every default is overridable via the **Advanced** accordion on `/llm-config`. You can mix providers — e.g., Anthropic Claude for chat, Gemini for vision, DeepSeek for structured output — each with its own key if needed.

---

## Privacy model

**Keys never leave your browser except as authentication headers.**

- Stored in `localStorage` under the key `vidhya.llm.config.v1`
- Sent in the `X-Vidhya-Llm-Config` header (base64-encoded JSON) on API requests that need LLM capability
- The server uses the config for that single request and discards it
- Nothing is persisted server-side — inspect `src/api/llm-config-routes.ts`

**To clear keys:**
- Visit `/llm-config` and click "Clear all config from this browser"
- Or clear your browser's site data for the domain

**For shared/team deployments**, you can set environment variables server-side as a fallback (see `src/llm/config-resolver.ts` → `loadConfigFromEnv`). Supported env vars:

```
VIDHYA_LLM_PRIMARY_PROVIDER   # e.g. "google-gemini"
VIDHYA_LLM_PRIMARY_KEY        # the key value

# Or legacy provider-specific vars (auto-detected):
GEMINI_API_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
OPENROUTER_API_KEY
GROQ_API_KEY
DEEPSEEK_API_KEY
MISTRAL_API_KEY
```

The client's header config always wins over env vars when both are present.

---

## Getting an API key

| Provider | Where |
|----------|-------|
| Google Gemini | https://aistudio.google.com/app/apikey |
| Anthropic | https://console.anthropic.com/settings/keys |
| OpenAI | https://platform.openai.com/api-keys |
| OpenRouter | https://openrouter.ai/keys |
| Groq | https://console.groq.com/keys |
| DeepSeek | https://platform.deepseek.com/api_keys |
| Mistral | https://console.mistral.ai/api-keys |
| Ollama | https://ollama.com/download (install, then run `ollama serve`) |

Each provider's key docs URL is also one click away from the config page.

---

## Troubleshooting

### "Key didn't validate"

- Check the key has no leading/trailing whitespace (especially if copy-pasted from email)
- Verify the key is active at the provider's dashboard
- Some providers require a credit card on file before keys work even if free tier is available
- If behind a corporate proxy, try **Custom endpoint** (OpenRouter and Ollama support this)

### "Vision isn't working"

- Groq and DeepSeek don't support vision at all — pick a vision-capable provider as primary, OR set a vision-specific override in the Advanced section
- If using Ollama, make sure you've pulled a vision model: `ollama pull llava:34b`

### "Config works in one tab, not another"

- The store uses `localStorage` + synthetic storage events for cross-tab sync
- If you just set up, refresh the other tab once — should pick up after that

### Using Ollama (local)

1. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
2. Pull a model: `ollama pull llama3.2:3b` (or `llava:34b` for vision)
3. Run the server: `ollama serve` (listens on `http://localhost:11434`)
4. On `/llm-config`, pick **Ollama (local)**, leave endpoint as default
5. No key needed

Note: local models are slower than cloud. Expect 5-15s per response on a laptop. Use for privacy, not speed.

### OpenRouter custom endpoint

If you're running a self-hosted OpenRouter-compatible proxy, select OpenRouter as the provider and override the endpoint in the config field. The default is `https://openrouter.ai/api/v1`.

---

## Architecture reference

### Request flow

```
browser: user makes a request (chat, image analysis, etc.)
  ↓
frontend/src/lib/llm/config-store.ts → fetchWithConfig()
  adds X-Vidhya-Llm-Config header (base64 JSON)
  ↓
server: src/api/*-routes.ts handler
  calls getConfigFromRequest(req.headers)
  ↓
src/llm/config-resolver.ts → resolveConfig(llm_config)
  returns per-role ResolvedRoleConfig
  ↓
src/api/llm-config-routes.ts → callChat(resolved)
  dispatches on provider.api_shape:
    google-gemini → REST /v1beta/models/:model:generateContent
    anthropic     → POST /v1/messages
    openai-*      → POST /v1/chat/completions
    ollama        → POST /v1/chat/completions (local)
  ↓
  provider → response → server → browser
```

### Adding a new provider

Edit `src/llm/provider-registry.ts` and append to the `PROVIDERS` array. Required fields:

```typescript
{
  id: 'your-provider',
  name: 'Display Name',
  description: 'One-sentence pitch',
  icon: '🎯',
  homepage: 'https://...',
  key_docs_url: 'https://.../api-keys',
  key_format: { prefix: 'sk-', min_length: 40 },  // optional sanity check
  default_endpoint: 'https://api.yourprovider.com/v1',
  endpoint_overridable: false,  // true for proxy-type providers
  requires_key: true,           // false for local-only like Ollama
  models: [
    { id: 'model-1', label: 'Model 1', roles: ['chat', 'json'],
      context_window: 128_000, cost_tier: 'cheap' },
  ],
  default_models: {
    chat: 'model-1',
    json: 'model-1',
    // vision: 'model-2',  // optional, omit if not supported
  },
  capabilities: {
    streaming: true,
    json_mode: true,
    image_input: false,  // true if any model supports vision
    system_prompt: true,
  },
  auth: {
    header_name: 'Authorization',
    header_value_template: 'Bearer {key}',
  },
  api_shape: 'openai-compatible',  // one of: openai-compatible | anthropic | google-gemini | ollama
}
```

If the provider's API shape doesn't match one of the four existing shapes, add a new branch in `src/api/llm-config-routes.ts` → `callChat()`.

That's it. No other files need to change. The new provider appears in `/llm-config` automatically because the frontend loads providers via `GET /api/llm/providers`.

---

## What this framework explicitly does NOT do

- **Not a proxy rewriter.** Requests go directly from the Vidhya server to the LLM provider. The server doesn't inspect or modify prompts beyond what the feature requires.
- **Not a key escrow.** We never see or store your keys.
- **Not a billing abstraction.** You pay the provider directly; Vidhya has no billing relationship.
- **Not a model benchmark.** Vidhya doesn't recommend models based on performance metrics. The recommended defaults are based on cost/capability balance for the typical student.
