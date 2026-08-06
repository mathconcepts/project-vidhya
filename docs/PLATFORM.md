# Platform Team Guide

Vidhya is designed to drop into any edtech stack. This guide covers the three integration points that platform teams typically care about: **auth**, **LLM routing**, and **database provisioning**.

---

## 1. Authentication

### Default (Supabase / HS256)

Out of the box, Vidhya signs JWTs with `JWT_SECRET` (HS256). This is fine for self-contained deployments where Vidhya also handles sign-in.

### External IdP (Auth0, Cognito, Clerk, etc.)

Platform teams that already issue their own JWTs can plug in via JWKS:

```env
VIDHYA_AUTH_MODE=external-jwks
VIDHYA_JWKS_URI=https://company.auth0.com/.well-known/jwks.json

# Dot-notation path to the role claim in the JWT payload.
# Default: 'role'. Examples: 'app_metadata.role', 'https://vidhya.app/role'
VIDHYA_ROLE_CLAIM_PATH=role

# Skip the user_profiles DB lookup and trust the IdP role claim directly.
# Use when your IdP is the authoritative source of roles.
VIDHYA_SKIP_DB_ROLE_LOOKUP=true
```

**How it works:**
- RS256 JWTs are verified using your IdP's public keys fetched from `VIDHYA_JWKS_URI`.
- Keys are cached for 5 minutes; a `kid` miss triggers an immediate refresh.
- Role values `owner` and `superadmin` are normalised to `admin`. Unknown roles default to `student`.
- CRON_SECRET still works regardless of auth mode (for cron and webhook callers).
- No new runtime dependencies — uses Node.js built-in `crypto` (requires Node ≥ 20).

**Role mapping:**

| IdP role | Vidhya role |
|---|---|
| `admin`, `owner`, `superadmin` | `admin` |
| `teacher`, `instructor`, `educator` | `teacher` |
| `student`, `learner` | `student` |
| anything else | `student` |

---

## 2. LLM Routing

Vidhya is LLM-agnostic. It ships with `config/providers.yaml` that configures available providers via API key environment variables. Platform teams can override this entirely with three env vars:

```env
# Adapter ID — one of: gemini, anthropic, openai, openrouter, ollama, learnlm
VIDHYA_LLM_PROVIDER=openai

# API key for the chosen provider (omit for keyless providers like ollama)
VIDHYA_LLM_API_KEY=<your-key>

# Custom endpoint — required for Azure OpenAI, Vertex AI, private gateways
VIDHYA_LLM_BASE_URL=https://company.openai.azure.com/openai/deployments/gpt-4o

# Model ID to request (defaults to the provider's built-in default)
VIDHYA_LLM_MODEL=gpt-4o
```

When `VIDHYA_LLM_PROVIDER` is set, `config/providers.yaml` is bypassed entirely — no YAML editing needed.

**Common configurations:**

```env
# Azure OpenAI
VIDHYA_LLM_PROVIDER=openai
VIDHYA_LLM_API_KEY=<azure-key>
VIDHYA_LLM_BASE_URL=https://company.openai.azure.com/openai/deployments/gpt-4o
VIDHYA_LLM_MODEL=gpt-4o

# Anthropic (direct)
VIDHYA_LLM_PROVIDER=anthropic
VIDHYA_LLM_API_KEY=sk-ant-...
VIDHYA_LLM_MODEL=claude-sonnet-4-5

# OpenRouter (routes to any model via one key)
VIDHYA_LLM_PROVIDER=openrouter
VIDHYA_LLM_API_KEY=sk-or-...
VIDHYA_LLM_MODEL=anthropic/claude-sonnet-4-5

# Ollama (local, keyless)
VIDHYA_LLM_PROVIDER=ollama
VIDHYA_LLM_BASE_URL=http://localhost:11434
VIDHYA_LLM_MODEL=llama3.2

# Vertex AI (OpenAI-compat endpoint)
VIDHYA_LLM_PROVIDER=openai
VIDHYA_LLM_API_KEY=<vertex-key>
VIDHYA_LLM_BASE_URL=https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT/locations/us-central1/endpoints/ENDPOINT
VIDHYA_LLM_MODEL=gemini-2.5-flash
```

**Provider-neutral API endpoints:**

All LLM proxy endpoints are available at both `/api/gemini/*` (legacy) and `/api/llm/*` (preferred for new integrations):

| Endpoint | Description |
|---|---|
| `POST /api/llm/classify-error` | Classify a wrong answer into an error taxonomy |
| `POST /api/llm/generate-problem` | Generate + self-verify a problem |
| `POST /api/llm/embed` | Get an embedding vector |
| `POST /api/llm/vision-ocr` | OCR handwritten notes/work |
| `POST /api/llm/chat` | SSE streaming chat |

---

## 3. Database Provisioning

### One deployment per tenant

Vidhya's recommended model for platform teams is **one Postgres database per school/tenant**, not a multi-tenant schema. This avoids RLS complexity and lets each tenant upgrade independently.

To provision a new tenant:

```bash
npx tsx scripts/provision-tenant.ts \
  --db-url  postgres://user:pass@host:5432/mydb \
  --tenant-id  acme-school \
  --admin-email  admin@acme.com \
  [--admin-role  admin]   # default: admin
  [--dry-run]             # print env stub only, no DB writes
```

What this does:
1. Runs all pending migrations (idempotent — safe to re-run).
2. Creates an admin user row so the first human can log in.
3. Prints a ready-to-use `.env` stub for this tenant's deployment.

**Re-run safety:** migrations track their own applied state; the admin upsert is `ON CONFLICT DO NOTHING`.

### pgvector (optional)

Tier 1 RAG search uses pgvector for cosine similarity. It's **optional** — all migrations apply cleanly without it:

- Without pgvector: `CREATE EXTENSION IF NOT EXISTS vector` is silently skipped. Vector columns and search functions are not created. The server starts normally; Tier 1 RAG returns empty results and the cascade falls through to Tier 2 (LLM) and Tier 3 (Wolfram).
- With pgvector: full semantic search, HNSW/IVFFlat indexes, and the `match_rag_cache` / `match_chunks` / `match_pyqs` functions are available.

To install pgvector on a plain Postgres instance:
```bash
# Ubuntu/Debian
apt-get install postgresql-16-pgvector

# Docker
docker run -e POSTGRES_PASSWORD=... ankane/pgvector
```

### Supabase

On Supabase, pgvector is enabled by default in the `vector` extension. No setup needed — migration 001 enables it automatically.

On Supabase, `auth.users` and related functions (`auth.role()`, `auth.uid()`, `auth.jwt()`) are provided by the platform. Migration `000_local_auth_stub.sql` provides a no-op stub on plain Postgres (all `IF NOT EXISTS` / `pg_proc` guards) so it's safe to run regardless.

---

## 4. Minimum required env vars

| Env var | Required | Notes |
|---|---|---|
| `JWT_SECRET` | Yes (non-demo) | Min 16 chars. Skipped if `VIDHYA_AUTH_MODE=external-jwks`. |
| At least one LLM key | For chat/generation | `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`. |
| `DATABASE_URL` | For persistence | Optional — degrades to flat-file `.data/` without it. |

Everything else degrades gracefully — the dependent feature returns a clear error rather than crashing.

---

## 5. Feature flags

All flags are read once at boot; server restart required to flip them.

| Flag | Default | Effect |
|---|---|---|
| `VIDHYA_AUTH_MODE` | `supabase` | `external-jwks` enables RS256 JWT verification |
| `VIDHYA_JWKS_URI` | — | Required when `VIDHYA_AUTH_MODE=external-jwks` |
| `VIDHYA_ROLE_CLAIM_PATH` | `role` | Dot-notation path to the role in the JWT |
| `VIDHYA_SKIP_DB_ROLE_LOOKUP` | — | `true` trusts IdP role claim, skips DB lookup |
| `VIDHYA_LLM_PROVIDER` | — | Overrides providers.yaml entirely |
| `VIDHYA_LLM_API_KEY` | — | Key for the override provider |
| `VIDHYA_LLM_BASE_URL` | — | Custom endpoint (Azure, Vertex, etc.) |
| `VIDHYA_LLM_MODEL` | — | Model ID for the override provider |
| `VIDHYA_PEDAGOGY_GATE` | `off` | `on` to gate atom generation on pedagogy score |
| `VIDHYA_LEDGER_PR` | `off` | `on` to open weekly digest PRs |
| `WOLFRAM_APP_ID` | — | Enables Tier 3 Wolfram verification |
| `PORT` | `8080` | Server bind port |
| `PUBLIC_URL` | — | Public backend URL (for CORS) |
