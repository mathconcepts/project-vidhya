# Render `DATABASE_URL` — ops runbook

**T16 (plan §OV2 correction #10, decision D4).** This is the deliverable for
"turn Supabase's `DATABASE_URL` on for the Render demo" — the connection
audit, the code consolidation that made it safe, and the operator checklist.
Setting the env var itself is operator-side (Render dashboard); this doc is
what the operator reads before doing that, and what anyone reads afterward to
verify it worked.

---

## 1. Why this was a sized task, not "paste a connection string"

Before this pass, `src/` (plus `demo/`, `scripts/`) had **~65 files** that
imported `pg` directly, and of those, **~53 call sites constructed their own
`new Pool(...)`** — most as a per-module lazy singleton (`if (_pool) return
_pool`), a handful as genuine per-*call* pools rebuilt on every invocation.
Nothing coordinated the total. On Supabase's free/small tier, **direct
Postgres connections are capped in the low tens** (check the current number
in Supabase's dashboard under Database → Connection info — it changes across
plans, so treat the number here as "order of magnitude," not gospel).
Pointing `DATABASE_URL` at that tier with ~53 independent pools, each willing
to open 2–5 connections (a few default to `pg`'s built-in `max: 10`), risked
exhausting the ceiling the moment more than a handful of request paths were
touched in the same process — not a hypothetical, since Render's free-tier
service is a single process and the whole point of turning `DATABASE_URL` on
is to make more of the app hit the database at once.

## 2. What changed

`src/storage/pool.ts` already existed (an earlier "CEO plan Phase 0" pass)
as the one shared, lazily-created, process-wide pool — `getSharedPool()`,
capped at `SHARED_POOL_MAX = 10`. This pass:

1. **Fixed the two worst per-call offenders outright** (not memoized —
   rebuilt, and in one case never freed, on every relevant request):
   - `src/gbrain/gbrain-routes.ts`'s `handleAttempt` built a fresh,
     never-closed `new pg.Pool(...)` on **every attempt that carried a
     confidence rating** — the highest-volume offender found, since a busy
     exam-prep session logs confidence on most attempts. This was the one
     the original per-call bug report didn't know about yet; found by
     broadening the connection-budget heuristic past "must be an exported
     function" (see §4).
   - `src/readiness/warmup-onboarding.ts`'s `applyWarmupPriors` built a
     fresh `new Pool({max:3})` on every warmup-priors persist and closed it
     with `.end()` on the way out — which is *worse* than merely wasteful
     once you also route it through the shared pool: an early version of
     the fix that forgot to drop the `.end()` call would have shut the
     shared pool down for the entire process on the very next warmup
     completion. (Caught and fixed before landing — noted here because it's
     the kind of mistake this migration pattern invites if copied
     carelessly elsewhere.)
   - `src/gbrain/operations/student-audit.ts`'s `auditStudent` built (and
     `.end()`-ed) a `new Pool({...})` on every audit call — but nothing in
     the function ever queried it; every real read goes through
     `getOrCreateStudentModel`/`getErrorPatternReport`, each with its own
     pool. Removed outright rather than migrated.
2. **Migrated the highest-traffic remaining lazy singletons onto the shared
   pool** — the request-path modules named in the task brief (readiness,
   scoring, gbrain student model, quiz/xp stores) plus two boot-time pools
   worth folding in while touching this code:
   - `src/readiness/due-cards.ts`
   - `src/scoring/quiz-store-pg.ts`
   - `src/scoring/teacher-queue-pg.ts`
   - `src/scoring/learning-object-catalog-pg.ts`
   - `src/gbrain/student-model-pg.ts` (the 100x-blueprint Elo/FSRS model)
   - `src/gbrain/student-model.ts` (the legacy model — still the
     highest-traffic single module in the codebase; every route that calls
     `getOrCreateStudentModel`/`saveStudentModel` goes through it)
   - `src/gbrain/xp-store.ts`
   - `src/teaching/motivation-source-pg.ts`
   - `src/jobs/scheduler.ts`'s nightly `resonanceScorer` job (was rebuilt +
     closed every run; now borrows the shared pool, no `.end()`)
   - `src/server.ts`'s vector-store pool, which `PgVectorStore` holds for
     the process lifetime and queries on every Tier-1 RAG verification
     lookup — one of the hottest paths in the app
3. **Extended `src/storage/pool.ts`'s doc comment into a documented
   exception policy** — which modules may legitimately keep their own pool
   (today: none need to; `src/generation/batch/pg-persistence.ts` uses the
   shared pool correctly for its advisory lock, see §3) and why
   `checkConnectivity()`'s own throwaway pool is deliberate.
4. **Left the remaining ~35 lazy singletons as-is** (auth-middleware,
   gate-routes, chat-routes, the content-orchestrator modules, the
   personalization scorers, etc.) — each already follows the safe
   memoized-singleton pattern, so none of them leak per request; they're
   just not yet sharing the one pool. Migrating all of them in the same
   pass this task shipped in would have been unreviewable diff size for
   what the task brief explicitly asked to scope down. Full list in §5.
5. **Flagged, rather than silently fixed, six more real findings** the new
   connection-budget script surfaced that fall outside the readiness/
   scoring/gbrain/quiz-xp priority list — three near-identical top-level
   `const pool = new pg.Pool(...)` singletons in `blog-routes.ts`,
   `funnel-routes.ts`, `notification-routes.ts`, plus `server.ts`'s
   `ssrPool` and boot-time `migratePool`, plus `session-store.ts`'s
   `PostgresStore` (a genuine singleton whose memoization guard lives in a
   *different* function than its constructor — same shape
   `motivation-source-pg.ts` had before it was fixed). Recorded with
   reasoning in `scripts/connection-budget-allowlist.json` and priority-
   ordered in §5 — `session-store.ts` is the top follow-up: no `max` set
   (pg default: 10) and it's on every session read/write.

## 3. Connection-string choice: session-mode pooler, not transaction-mode

Supabase (and any Supavisor/PgBouncer-fronted Postgres) offers three shapes
for the same database:

| Mode | What it is | Session state (advisory locks, `SET`, prepared statements) |
|---|---|---|
| **Direct** | Straight to Postgres, no pooler | Fully preserved |
| **Session-mode pooler** | Pooler assigns one backend connection per client connection for its whole session | Fully preserved |
| **Transaction-mode pooler** | Pooler may reassign the backend connection between transactions, even mid-session | **Broken** |

**Recommendation: session-mode pooler.**

The reason is `src/generation/batch/pg-persistence.ts`, the one module in
this codebase that uses `pg_try_advisory_lock`/`pg_advisory_unlock` (keyed
by `FNV-1a(run_id)`, so two batch-generation pollers can't race). It does
this correctly at the `pg.Pool` level — `pool.connect()` checks out one
dedicated `PoolClient` and pins that *same* client across the lock/unlock
pair (`lockClients` map in that file), never letting it back into the pool
until the run releases it. That is exactly right for a direct connection or
a session-mode pooler. It silently stops working under a transaction-mode
pooler: the pooler can hand the client's next statement to a *different*
physical Postgres backend even though node-postgres still thinks it's
holding one stable connection, and advisory locks are tied to the Postgres
backend session, not to the app's TCP socket. The failure mode is not an
error — it's `pg_try_advisory_lock` silently locking (or unlocking) the
wrong session's lock, which is the one thing this mechanism exists to
prevent.

Session-mode pooling gives up some of transaction-mode's connection-
multiplexing efficiency, but that's the right tradeoff here: `SHARED_POOL_MAX
= 10` already keeps this process's own footprint small, and the module that
actually needs strict session semantics is exactly the one where "it looks
like it works" but silently corrupts locking behavior is the failure to
avoid at all costs. If a future pass adds more `LISTEN`/`NOTIFY` or session-
variable-dependent code, it inherits the same requirement — see
`src/storage/pool.ts`'s exception-policy doc comment, which is the canonical
place this rule lives in code.

**Practical implication for the connection string Render gets:** use
Supabase's "Session" pooler connection string (port `5432` on the pooler
host, or whatever Supabase's dashboard currently labels "Session mode" —
check the Connect panel, since exact port numbers have moved across Supabase
product revisions), not the "Transaction" one (commonly port `6543`). Direct
connection also works correctly for locking; the pooler is still preferable
on Render because Supabase's pooler is what's designed to absorb a
single-process app's connection churn without hitting Postgres's own
`max_connections` — a lone `DATABASE_URL` pointed straight at Postgres works
fine at this codebase's current connection count, but the pooler has more
headroom if the remaining ~35 un-migrated singletons (§5) are ever touched
in the same request burst.

## 4. Verification script: `npm run ci:connection-budget`

`scripts/check-connection-budget.ts` (wired into `.github/workflows/ci.yml`
right after the existing `ci:pg-allowlist` step) statically greps every
`.ts`/`.tsx` file under `src/` for `new ...Pool(` call sites that are **not**
immediately preceded by the codebase's lazy-singleton memoization guard
(`if (_pool) return _pool`, `if (_atomPool) return _atomPool`,
`this.pool`/`_instance` variants). A match with no guard nearby fails CI.

This complements, and does not replace, the pre-existing
`scripts/check-pg-allowlist.ts` (which gates *whether* a file may import
`pg` at all). The two catch different failure modes:

| Check | Catches | Misses |
|---|---|---|
| `ci:pg-allowlist` | A NEW file starting to import `pg` outside `src/storage/` without review | A file that already imports `pg` legitimately, but constructs a Pool per call instead of once |
| `ci:connection-budget` | A `new Pool(...)` rebuilt on every call — whether the import was static (`import pg from 'pg'`) or dynamic (`await import('pg')`) | A construction pattern too unusual for the regex heuristic to recognize (rare in this codebase; every current safe pattern is one of a handful of shapes) |

`warmup-onboarding.ts`'s original bug is the reason `ci:connection-budget`
matches on the *construction call site*, not the import: that file reached
`pg` via `await import('pg')`, invisible to `ci:pg-allowlist`'s static
import regex.

Known, reviewed exceptions live in `scripts/connection-budget-allowlist.json`
— same ratchet shape as the pg-allowlist file: an addition must explain, in
its own entry, why the flagged call site is actually safe. Six entries are
there today (§2 item 5 / §5's follow-up list) — none of them a false
positive from the heuristic, all of them a real "safe today only because it
happens to run once per process" pattern that should still be migrated in a
follow-up pass rather than silently ignored forever.

Run locally: `npx tsx scripts/check-connection-budget.ts`

## 5. Full audit table

Every `new Pool(...)` construction site found under `src/`, `demo/`, and
`scripts/`, its `max`, its lifecycle, and this pass's verdict.

**Legend:** ✅ migrated to shared pool this pass · 🗑 removed (dead code) ·
🔒 lazy singleton, left as-is (safe, just not consolidated yet) ·
⚠️ real finding, allowlisted + flagged for follow-up · 📜 one-shot CLI
script (exempt by design) · 🔐 advisory-lock exception (documented in
`src/storage/pool.ts`)

| Module | Prior `max` | Lifecycle | Verdict |
|---|---|---|---|
| `src/gbrain/gbrain-routes.ts` (`handleAttempt`) | none (pg default 10) | **per-call, never closed** | ✅ migrated |
| `src/readiness/warmup-onboarding.ts` | 3 | **per-call, `.end()`-ed each time** | ✅ migrated |
| `src/gbrain/operations/student-audit.ts` | none (pg default 10) | per-call, `.end()`-ed, **never queried** | 🗑 removed |
| `src/readiness/due-cards.ts` | 5 | lazy singleton | ✅ migrated |
| `src/scoring/quiz-store-pg.ts` | 5 | lazy singleton | ✅ migrated |
| `src/scoring/teacher-queue-pg.ts` | 5 | lazy singleton | ✅ migrated |
| `src/scoring/learning-object-catalog-pg.ts` | 5 | class singleton (via `getLearningObjectCatalog()`) | ✅ migrated |
| `src/gbrain/student-model-pg.ts` | 5 | lazy singleton (uses `pool.connect()` for its Elo/FSRS transaction — safe on the shared pool) | ✅ migrated |
| `src/gbrain/student-model.ts` | 5 | lazy singleton (legacy, highest call volume) | ✅ migrated |
| `src/gbrain/xp-store.ts` | 5 | lazy singleton | ✅ migrated |
| `src/teaching/motivation-source-pg.ts` | 2 | class singleton (via `getMotivationSource()`) | ✅ migrated |
| `src/jobs/scheduler.ts` (`resonanceScorer`) | 3 | built + `.end()`-ed every nightly run | ✅ migrated |
| `src/server.ts` (vector-store pool) | 5 | boot-once, held for process lifetime by `PgVectorStore`, queried on every Tier-1 RAG check | ✅ migrated |
| `src/generation/batch/pg-persistence.ts` | — (already shared) | uses `pool.connect()` to pin one client across `pg_try_advisory_lock`/`pg_advisory_unlock` | 🔐 advisory-lock exception, documented |
| `src/api/auth-middleware.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/api/gate-routes.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/api/chat-routes.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/api/commander-routes.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/api/lesson-routes.ts` (`_atomPool`) | 5 | lazy singleton | 🔒 left as-is |
| `src/api/notebook-routes.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/api/social-routes.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/api/streak-routes.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/api/topic-pages.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/api/interest-routes.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/api/admin-routes.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/api/admin-cohort-routes.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/api/admin-resonance-routes.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/api/admin-decisions-routes.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/api/admin-exam-packs-routes.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/api/admin-holdout-routes.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/api/admin-journey-routes.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/api/admin-ledger-routes.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/blueprints/persistence.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/blueprints/rulesets.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/content/atom-loader.ts` (`_enrichmentPool`) | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/ab-tester.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/atom-versions.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/concept-cost.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/media-artifacts.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/personalized-regen.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/prompt-patterns.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/pyq-grounding.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/content/concept-orchestrator/queue.ts` | 3 | lazy singleton | 🔒 left as-is |
| `src/curriculum/exam-loader.ts` (`_dbPool`) | 2 | lazy singleton | 🔒 left as-is |
| `src/experiments/db.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/gbrain/error-taxonomy.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/gbrain/fsrs-shadow.ts` | 2 | lazy singleton (shadow-mode logging, fire-and-forget) | 🔒 left as-is |
| `src/gbrain/mock-exam-store.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/gbrain/operations/moat-operations.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/gbrain/problem-generator.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/gbrain/task-reasoner.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/personalization/dedup.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/personalization/lesson-wire.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/personalization/scorers/cohort-lift.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/personalization/scorers/user-error-match.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/personalization/scorers/user-mastery-match.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/personalization/student-context.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/scenarios/persona-seeder.ts` | 2 | lazy singleton | 🔒 left as-is |
| `src/sessions/thinking-gap-service.ts` | 5 | lazy singleton | 🔒 left as-is |
| `src/api/blog-routes.ts` | none (pg default 10) | **module-top-level singleton** (built once at import, but no memoization *pattern* — nothing to review-gate a future edit that turns it per-call) | ⚠️ allowlisted, follow-up |
| `src/api/funnel-routes.ts` | none (pg default 10) | module-top-level singleton | ⚠️ allowlisted, follow-up |
| `src/api/notification-routes.ts` | none (pg default 10) | module-top-level singleton | ⚠️ allowlisted, follow-up |
| `src/server.ts` (`ssrPool`) | none (pg default 10) | module-top-level singleton | ⚠️ allowlisted, follow-up |
| `src/server.ts` (`migratePool`) | 2 | boot-once inside `main()`, never `.end()`-ed | ⚠️ allowlisted, follow-up (low severity — tiny, boot-only) |
| `src/sessions/session-store.ts` (`PostgresStore`) | none (pg default 10) | singleton via `getSessionStore()`, but the guard lives in a different function than the constructor | ⚠️ allowlisted, **top follow-up priority** — every session read/write |
| `demo/seed-history.ts` | 2 | one-shot CLI, exits after run | 📜 exempt |
| `scripts/embed-pyq-corpus.ts` | 5 | one-shot CLI | 📜 exempt |
| `scripts/export-bundles.ts` | 2 | one-shot CLI | 📜 exempt |
| `scripts/provision-tenant.ts` | 3 | one-shot CLI | 📜 exempt |
| `scripts/seed-pyq-holdout.ts` | 3 | one-shot CLI | 📜 exempt |
| `scripts/vidhya-data.ts` | none (pg default 10) | one-shot CLI (export/import/verify) | 📜 exempt |

**Not a `new Pool(...)` site, but related:** `GET /health` in `src/server.ts`
opens a `pg.Client` (not a pooled `Pool`) and calls `.connect()` +
`.query('SELECT 1')` + `.end()` on every health-check hit. A single
short-lived client per health check is a reasonable pattern (Render's health
checker doesn't fire faster than the deploy-time interval), but it's worth
knowing about if Render's health-check frequency ever increases, since
`healthCheckPath: /health` in `render.yaml` is what drives it.

## 6. Env vars to set on Render

Both are already declared in `render.yaml` as `sync: false` (Render prompts
for them in the dashboard; they are not baked into the blueprint):

| Var | Value |
|---|---|
| `DATABASE_URL` | Supabase's **session-mode pooler** connection string (see §3) |
| `SUPABASE_DB_URL` | Same value, or omit — `src/api/feature-flags.ts` and a few older modules (`funnel-routes.ts`, `notification-routes.ts`, `blog-routes.ts`, `server.ts`'s `ssrPool`) check `SUPABASE_DB_URL \|\| DATABASE_URL`, so setting `DATABASE_URL` alone is sufficient; setting both is harmless and slightly more explicit |

No other env var changes this pass requires. `SHARED_POOL_MAX` (10, in
`src/storage/pool.ts`) is a code constant, not an env var — it bounds this
one Render process's connections against the shared pool specifically; it
does not bound the ~35 modules in §5 still on their own pools.

## 7. Deploy-time verification checklist

1. **Deploy completes and `/health` returns non-5xx.**
   ```bash
   curl -sI https://vidhya-demo.onrender.com/health
   ```

2. **`/health`'s `database_status` reads `connected`**, not an `error: ...`
   string (the route degrades honestly rather than crashing on a bad
   connection string — see §5's note on `GET /health`).
   ```bash
   curl -s https://vidhya-demo.onrender.com/health | python3 -m json.tool
   ```

3. **Connection-count check** — run against the Supabase SQL editor (or
   `psql` if you have the direct connection string) shortly after a normal
   burst of demo traffic (a few students working through lessons, an admin
   on `/admin/content-rd`):
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
   ```
   Expect a number well under whatever Supabase's dashboard currently shows
   as the tier's connection ceiling — with the shared pool capped at 10 and
   most of the remaining ~35 modules in §5 capped at 2–5 each, a healthy
   reading during light demo traffic should be in the low tens, not
   climbing toward the ceiling. If it's climbing steadily rather than
   settling, that's a sign either a pool isn't releasing clients (check for
   a stray `pool.connect()` without a matching `.release()` — the codebase
   convention is `try { ... } finally { client.release(); }`, see
   `src/gbrain/student-model-pg.ts`'s `update()` for the canonical shape)
   or that the §5 follow-up list needs to move up in priority.

4. **Acceptance test from the plan (T16's actual "did this work" bar):** a
   seeded persona attempt shows `recorded: true` on the deployed URL —
   i.e., `StudentModel.update()` actually reached Postgres, not the
   DB-less honest-degrade path.
   ```bash
   # Seed a persona (if not already present on this deploy):
   #   npm run demo:scenario -- priya-cbse-12-anxious eigenvalues
   # Then, as that persona (or any authenticated demo user), submit a
   # practice attempt and check the response body:
   curl -s -X POST https://vidhya-demo.onrender.com/api/practice/attempt \
     -H 'Content-Type: application/json' \
     -H "Authorization: Bearer $DEMO_TOKEN" \
     -d '{"objectId": "<a real generated_problems id>", "response": {...}, "ts": <epoch-ms>}' \
     | python3 -m json.tool
   # Look for: "recorded": true
   ```
   `recorded: false` with no error means `DATABASE_URL` isn't reaching the
   process (check the Render env var actually saved) or the grading path
   hit a caught exception (check Render's live logs for
   `[student-model-pg]` / `[scoring]` prefixed lines).

5. **No new connection-budget or pg-allowlist regressions** — these already
   run in CI (`.github/workflows/ci.yml`) on every push to `main`, but
   worth a manual sanity check right after this kind of change:
   ```bash
   npx tsx scripts/check-pg-allowlist.ts
   npx tsx scripts/check-connection-budget.ts
   ```
