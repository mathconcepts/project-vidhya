# PRODUCTION

> What's production-ready, what isn't, and what an operator should do before exposing this to real users. Honest assessment — not a marketing pitch.

---

## TL;DR

This is a **mature codebase running in development mode by default**. It has 169 unit tests, 9 regression gates, modular architecture, graceful degradation across all external dependencies, and a clear path from clone-to-deployed. It has NOT been observed at scale, NOT pen-tested, and has known gaps an operator should close before serious use.

If you're deploying for **a class of fifty students** with a trusted teacher operator: ready today, follow the checklist below.

If you're deploying for **a paying customer base of thousands**: the gaps in the second-half of this doc are real. Address them or accept the risk explicitly.

---

## What's already production-ready

These are claims I can defend with code or tests in the repo today.

### Type safety

- `npx tsc --noEmit` passes 0 errors on both backend and frontend
- Module barrels at `src/modules/<name>/index.ts` declare strict-typed public surfaces
- The body of each backend file uses `@ts-nocheck` (intentional — types are documentation, the barrels are enforcement)

### Test coverage

- 169 unit tests across 9 test files, all passing
- 49 stdio integration smoke tests
- 65 SDK compatibility smoke tests
- 14 multi-role demo verifications (`npm run demo:verify`)
- 10 end-to-end teaching-loop runtime tests (`npm run verify:teaching`)
- Each of the 56 agents in the org chart validated by `agents/validate-graph.py`
- Subrepo content validated by its own check script

Run the full regression with: `npm test && npm run smoke:stdio && npm run smoke:sdk-compat`. Expect 280+ tests/checks passing.

### Continuous integration

A complete CI workflow specification is provided at [`docs/operator-snippets/regression-workflow.yml.example`](./docs/operator-snippets/regression-workflow.yml.example). To enable:

```bash
mkdir -p .github/workflows
cp docs/operator-snippets/regression-workflow.yml.example .github/workflows/regression.yml
git add .github/workflows/regression.yml
git commit -m "ci: enable regression workflow"
git push
```

The push must come from a credential with `workflow` scope (a GitHub web push, an Action-installed GitHub App, or a PAT with workflow scope). Once enabled, the workflow runs on every push to main and every PR; it executes the same regression gates an operator runs locally before each commit. Branch protection should be configured to require this workflow before merge.

The workflow is provided as an example file rather than an active workflow because the maintainer's PAT used during this commit lacks `workflow` scope — a sensible GitHub safeguard against tokens silently introducing CI changes. An operator with proper credentials can enable it in one step.

### Graceful degradation

Every external dependency degrades cleanly when missing:

| Missing | Behaviour |
|---|---|
| `JWT_SECRET` | Fails fast at boot with a clear error |
| `GEMINI_API_KEY` | `/api/chat` returns 503 with a clear message; teaching turn records `degraded.reason='no-llm-available'` so admins can see the issue in the firehose |
| `WOLFRAM_APP_ID` | Wolfram source returns null; orchestrator continues to next source; chat path's verification badge stays off |
| `DATABASE_URL` | flat-file persistence used; only `attempt-insight` mastery-delta path is unavailable |
| `GOOGLE_OAUTH_CLIENT_ID` | `/auth/google` returns 503; JWT-based auth (demo seed, admin-created users) still works |
| Telegram / WhatsApp tokens | Channel shown as 'not configured', refuses to send. Web chat works regardless. |

This is verified by the existing test suite and the live probes during commit verification.

### Auth

- JWT signing with HS256, secret minimum 16 chars enforced at boot
- Layered authorization: 7 roles (owner / admin / institution / teacher / parent / student / public)
- Role hierarchy enforced in `requireRole()` middleware
- POST handlers always override client-supplied identity fields (`added_by`, `created_by`) with the actor's id
- Cross-student data leakage tested: students cannot read other students' turns, plans, or notes
- Demo users have `@vidhya.local` emails — clearly distinguishable from real users in admin views

### Persistence + backups

- Append-only JSONL for audit-trail data (turns, library additions, studio drafts) — corrupt lines skipped on read, no silent data loss
- Flat-file JSON for state data (users, plans, vectors) — atomic writes via `flat-file-store`
- Backup script: `npm run backup:create` produces a timestamped tarball of `.data/`
- Restore: extract tarball over `.data/`, restart server
- All persistence in `.data/` is gitignored

### Observability

- `/api/orchestrator/health` reports per-module health for all 13 modules
- `/api/orchestrator/features` lists all feature flags with default + enabled + overridden state
- `/api/turns` admin firehose shows every recent teaching interaction with full metadata
- `/api/content-library/concepts` exposes the served library
- Errors logged to stderr with module + handler context; suppressible via `VIDHYA_LOG_STDERR=off` for CI

### Documentation

- 14 master docs at the repo root (OVERVIEW, DESIGN, ARCHITECTURE, LAYOUT, AUTH, TEACHING, LIBRARY, CONTENT, EXAMS, MODULARISATION, DEPLOY, INSTALL, SECURITY, PRODUCTION)
- Per-module health probe descriptions in `modules.yaml`
- 13-module model fully described in MODULARISATION.md with per-module boundary justification
- CHANGELOG covers every shipped commit

---

## What's NOT production-ready

Honest gaps. Each is something a thoughtful operator should weigh before serious deployment.

### Single-process state

The flat-file persistence assumes single-process. Two replicas writing to the same `.data/` directory will produce torn writes and corrupted state.

**Mitigations:**
- Render's free tier deploys a single instance — naturally compatible
- For multi-instance deployment, either (a) put `DATABASE_URL` in env and re-architect the persistence (multi-week effort, currently not done), or (b) use a single instance with vertical scaling

### No moderation flow for user-contributed content

Content-library entries POSTed via API go live immediately. Content-studio drafts pending approval are gated correctly, but the library's direct POST path bypasses approval.

**Mitigations:**
- Default deployment has `content_library.user_authoring=false` — only admin can POST
- Operators in trusted-contributor mode (flag on) need an out-of-band trust model
- Future: add a moderation queue with timed review window before live promotion

### Rate limiting — partial

Rate limiting is in place on the LLM-spending surfaces, with one
known auth gap.

**What's protected:**
- `/api/chat` — 30/min per authenticated actor (`48b50ad`)
- `/api/content-studio/generate` — 10/hour per admin
- `/api/content-studio` LLM source — 5/hour separate bucket (`7578da9`)
- `/api/content-library` POST — 60/min
- `/api/attempt-insight` — 100/min
- `/api/gemini/classify-error` — 60/min per session-or-IP
- `/api/gemini/generate-problem` — 30/min per session-or-IP
- `/api/gemini/embed` — 100/min per session-or-IP
- `/api/gemini/vision-ocr` — 20/min per session-or-IP (vision is pricier)
- `/api/gemini/chat` — 30/min per session-or-IP
- `/api/verify-any` — 30/min per session-or-IP (rate-limit moved
  before the LLM call; previously the OCR ran first then the limit
  checked, which was strictly cosmetic)

The implementation is hand-rolled token-bucket at
`src/lib/rate-limit.ts` (~150 LOC, zero new deps). Per-actor
isolation, per-endpoint isolation, lazy refill. Override via
`VIDHYA_RATE_LIMIT_DISABLED=true` for load testing.

**What's NOT protected:**
- Non-LLM admin endpoints (admin user management, exam authoring,
  curriculum, etc.). These are admin-only so the surface is small;
  rate-limiting them would be belt-and-braces, not load-bearing.
- The `/api/gemini/*` endpoints are *unauthenticated*. Rate-limit
  alone doesn't fix the cost-leak fully — an attacker hitting from
  many IPs gets many buckets. Auth on these endpoints is a known
  gap documented in the next section.

**Multi-process gap:**
The rate limiter is in-memory and per-process. A multi-replica
deployment would need a shared store (Redis, the database). Vidhya
today is single-process anyway (flat-file persistence), so this is
the same gap as the persistence layer's.

### No retention policy on append-only logs

Three logs grow unbounded:
- `.data/teaching-turns.jsonl` (every chat turn + every attempt-insight call)
- `.data/content-library-additions.jsonl` (every runtime add)
- `.data/content-drafts.jsonl` (every studio draft + lifecycle event)

At ~100k records each, the linear-scan reads slow noticeably. Disk usage grows.

**Mitigations:**
- Run `npm run backup:create` periodically and rotate
- Implement monthly log rotation (PENDING.md §X — not done)
- Tie GDPR-style data deletion to clearing per-user records from these logs (PENDING.md §5 — partial)

### Limited observability

There's no APM, no request tracing, no per-endpoint latency histograms.

**Mitigations:**
- The `/api/orchestrator/health` endpoint is a coarse heartbeat; sufficient for liveness checks
- For deeper observability, wire up something like Datadog / Honeycomb / OpenTelemetry — not done

### No SLO / no incident response

There's no defined SLO, no on-call rotation, no documented incident response.

**Mitigations:**
- For a class-of-fifty deployment, treat outages as best-effort
- For paying customer deployments, write your own runbook

### Unauthenticated LLM proxy endpoints

The `/api/gemini/*` family of five endpoints (classify-error,
generate-problem, embed, vision-ocr, chat) calls Gemini directly
with no `getCurrentUser` / `requireAuth` check. Anyone hitting the
deployment URL can spend tokens on the operator's account.

This is partially mitigated by the rate-limit additions above, but
the underlying gap (no authentication) remains:

**Today's protections:**
- Per-session/IP rate limit on each endpoint (cap depends on
  endpoint cost)
- Different endpoints have separate buckets so a vision-OCR drain
  doesn't lock out classify-error

**What's still vulnerable:**
- A coordinated attacker rotating through IPs gets a fresh bucket
  per IP — total budget drainable proportional to IP count
- The `/api/gemini/chat` endpoint accepts an arbitrary
  `systemPrompt` from the body, so a hostile caller can override
  the system prompt to do anything — not just GATE math tutoring
- No `user_id` attribution means no per-user daily budget cap on
  these endpoints

**Mitigations:**
- The natural fix is `requireAuth` at the top of each handler.
  Whether to do this depends on whether these endpoints are
  intentionally public for a demo / preview flow. Operators
  doing real-user deployments should add auth.
- A pragmatic interim: add a deployment-wide IP allowlist (e.g.
  only the Netlify edge for the frontend) at the proxy / load
  balancer level. Render and Cloudflare both support this.
- Long-term: either add auth or remove these endpoints if they're
  no longer used (the protected `/api/chat` endpoint covers the
  same needs as `/api/gemini/chat` but with full instrumentation
  + auth).

### No security audit

The codebase has not been audited by a third party. Common vulnerabilities (XSS, SQL injection — N/A since no SQL today, CSRF, JWT flaws) have been considered but not formally reviewed.

**Mitigations:**
- SECURITY.md describes responsible disclosure
- Open issues for any concrete CVE-style vulnerability
- The auth model has been written to defend against the obvious attacks (signed JWTs, role-checks at every admin endpoint, identity overrides on POSTs)

### Frontend bundle size

The frontend ships a 22 MB WASM embedding model. On slow connections this is significant.

**Mitigations:**
- The model is cached aggressively after first load
- Code-splitting is partial — could be deeper
- Consider serving the model from a CDN if your users have slow connections

### LLM provider — pluggable

Vidhya is provider-agnostic. The runtime helper at `src/llm/runtime.ts`
resolves an LLM per request from one of:

  1. The `X-Vidhya-Llm-Config` header (per-request user config, set
     via the `/gate/llm-config` admin page)
  2. Explicit env vars `VIDHYA_LLM_PRIMARY_PROVIDER` +
     `VIDHYA_LLM_PRIMARY_KEY`
  3. Legacy provider env vars (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`,
     `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`,
     `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`)
  4. null → callers graceful-degrade

All authenticated LLM-spending paths go through this layer. Four
provider API shapes are supported: `google-gemini`, `anthropic`,
`openai-compatible` (OpenAI / Groq / OpenRouter / DeepSeek / Mistral),
`ollama`. Each exposes `generate()`, `generateStream()`, and (for the
helper's `embedText()`) embedding.

**What this fixes:** previously, ~12 hot-path files imported
`@google/generative-ai` directly and were locked to Gemini. The
provider field in the per-request config was ignored on those paths.

**What it deliberately keeps thin:** no retry, no fallback, no health
tracking, no per-call cost accounting. Those belong at the LLMClient
layer (still available via YAML config for code paths that want them).
Hot paths get a simple "give me an LLM, call it, get text" contract.

**What's still pinned to Gemini today:** embeddings (Gemini's
`text-embedding-004`) with OpenAI's `text-embedding-3-small` as
fallback. Other providers don't expose first-class embeddings or use
incompatible vector dimensions; cross-provider embedding compatibility
is a separate concern.

**Migration status — complete:**

Every direct `@google/generative-ai` import in the codebase has been
replaced with `getLlmForRole()` / `embedText()` from `src/llm/runtime`.
The system is genuinely LLM-agnostic — operators set their preferred
provider once (env var or `/gate/llm-config`), and every code path
that spends LLM tokens flows through that choice.

Files migrated across two commits:

In `3f7e164` (commit 1):
- `src/api/chat-routes.ts` (streaming chat path)
- `src/api/gemini-proxy.ts` (5 endpoints — URL stays `/api/gemini/*`
  for back-compat, but the URL no longer dictates the provider)
- `src/content-studio/sources/llm.ts`
- `src/content/resolver.ts` (router cascade tier-2)

In this commit:
- `src/gate-server.ts` (boot-time embedder + dual-solve verifiers;
  the `setGeminiModel` injection that used to push a Gemini SDK
  instance into gate-routes was removed — verify-any uses the
  runtime helper directly now)
- `src/api/gate-routes.ts` (verify-any image OCR)
- `src/gbrain/error-taxonomy.ts` (`classifyError` +
  `generateMisconceptionExplanation`)
- `src/gbrain/operations/moat-operations.ts` (health probe renamed
  `gemini_api` → `llm_provider`, reports `provider_id/model_id`;
  `seedRagCache` uses the `embedText` helper with graceful "no
  provider" handling; `verifySweep` uses the chat role)
- `src/gbrain/problem-generator.ts` (`generateProblem` +
  `selfVerifyProblem`)
- `src/gbrain/task-reasoner.ts` (`runGeminiReasoner` renamed to
  `runLlmReasoner`; the upstream env-var precondition was removed
  since the runtime helper handles it internally)
- `src/jobs/content-flywheel.ts` (3 sites: `generateProblem`,
  `generateSocialContent`, `generateBlogPost`)
- `src/multimodal/intent-analyzer.ts` (the function still accepts
  the legacy `LLMConfig` parameter for back-compat, but encodes it
  into the runtime helper's header format internally — caller in
  `multimodal-routes.ts` unchanged)
- `src/multimodal/diagnostic-analyzer.ts`

The only remaining `@google/generative-ai` imports in `src/` are
inside `src/llm/adapters/gemini.ts` (the Gemini-specific provider
adapter, which is correct — that's where Gemini-specific logic
belongs).

### LLM cost controls — partial

If a deployment has any LLM provider configured (Gemini, Anthropic,
OpenAI, etc.), every LLM request consumes API credit. Per-user
budget caps are wired into the authenticated LLM-spending surfaces.

**What's protected:**
- `/api/chat` — per-user daily token budget via `tryReserveTokens` /
  `recordUsage` / `cancelReservation` (`48b50ad`)
- `/api/content-studio` LLM source — same per-user budget,
  6000-token reservation per generation, reconciled to actuals
  post-call (`7578da9`)

**What's NOT protected:**
- `/api/gemini/*` endpoints (classify-error, generate-problem,
  embed, vision-ocr, chat) — these are unauthenticated, so there's
  no `user_id` to attribute per-user budget to. Rate-limit alone
  protects against single-client spam, but a coordinated multi-IP
  attacker can drain budget. Adding auth to these endpoints (and
  thus enabling per-user budget) is a known follow-up.
- Other LLM helpers in `src/gbrain/` and `src/content/resolver.ts`
  are called *through* the protected surfaces above, so their
  cost is captured at the entrypoint level. But a future direct-
  helper handler would bypass the cap. New endpoints must opt in.

**Configuration:**
- Default OFF (no cap). Opt in via `VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER`
  env var, denominated in tokens
- Daily UTC midnight reset
- Cost math (Gemini 2.5 Flash mixed pricing): 100k tokens/day cap
  ≈ $0.013/user/day ≈ $0.40/user/month

**Provider-side defense in depth:**
- Gemini's free tier is generous; for paid-tier set provider-side
  spending limits in the Google Cloud Console
- These caps are denominated in tokens, not dollars; an operator
  needing dollar caps would need a wrapper layer that knows
  per-model pricing

### No PII redaction in logs

Console logs include user IDs, occasionally email addresses, and concept IDs. These end up in container stdout / stderr, which on Render means viewable in the dashboard.

**Mitigations:**
- Operators with FERPA / GDPR concerns: rotate logs frequently, restrict dashboard access
- Future: structured logging with PII tags + automatic redaction — not implemented

---

## Setup checklist for a real deployment

Before exposing this to actual users, run through this checklist. Each item maps to one of the gaps above.

```
[ ] Set JWT_SECRET to a 32+ character random string (NOT the placeholder)
[ ] Decide on LLM provider: GEMINI_API_KEY (cheapest) or rotate via src/llm/
[ ] Decide on Wolfram: WOLFRAM_APP_ID for math verification (free tier OK)
[ ] If multi-process: put DATABASE_URL in env AND understand the gaps above
[ ] If using Google sign-in: set GOOGLE_OAUTH_CLIENT_ID
[ ] Enable GitHub branch protection requiring the regression workflow to pass
[ ] Set up a deployment URL (Render's render.yaml does this in one click)
[ ] Run `npm run backup:create` on a cron or systemd timer
[ ] Decide log retention policy (rotate .jsonl files monthly OR set up log shipping)
[ ] Document YOUR incident response — even "post on Slack and email me" is better than nothing
[ ] If serving regulated population (under-18s, EU, healthcare): get a real legal review
[ ] Test the recovery path: delete .data/, restore from a recent backup, verify the demo still works
[ ] Hit /api/orchestrator/health from your monitoring (UptimeRobot / Pingdom / etc.)
[ ] Configure a status page so users have somewhere to look when things break
```

The first 7 items take ~30 minutes total. The last 6 are operational discipline that compounds over time.

---

## What "production grade" means and what it doesn't

I want to be honest about the gap between "this code is well-tested" and "this system is production grade":

**Production grade is a property of an observed system, not a property of code.** A codebase can have 10000 unit tests and still fall over under real load if a code path no test exercised meets a workload no test simulated. Real production maturity comes from:

1. Observed behaviour under real load (not present here — no live deployment yet)
2. Battle-testing against actual abuse patterns (not present)
3. Recovery from real incidents (not present)
4. Iteration on real user feedback (the teaching loop is wired but has no real student data)

What this PR can deliver is **production-readiness work** — checklists, gates, docs, fixes — not production maturity itself. The system is closer to ready today than it was yesterday. Real readiness arrives only after deployment and observation.

If you're using this to decide whether to put it in front of users: read the gaps section above, decide which ones matter for your context, and close the ones that do.

---

## Where this doc fits

- [OVERVIEW.md](./OVERVIEW.md) — what Vidhya is and who for
- [DESIGN.md](./DESIGN.md) — why the architecture is shaped this way
- [ARCHITECTURE.md](./ARCHITECTURE.md) — modules + topology + data flow
- [DEPLOY.md](./DEPLOY.md) — the deployment paths
- [SECURITY.md](./SECURITY.md) — vulnerability disclosure
- **PRODUCTION.md (this file)** — honest production-readiness assessment
