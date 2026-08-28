---
name: verify-sweep
description: |
  Re-verify content-bundle problems against Wolfram|Alpha, catching model drift,
  prompt changes, or edge cases that slipped through initial verification.
  Checkpointed and rate-limited; safe to interrupt and resume.
triggers:
  - verify sweep
  - re-verify problems
  - check problem correctness
  - verification audit
allowed-tools:
  - Bash
---

# Verification Sweep (Wolfram Batch Verification)

Background job that walks `frontend/public/data/content-bundle.json` and asks
Wolfram|Alpha to solve each problem independently, marking agreement.

## What this actually is

This wraps `src/jobs/wolfram-verify-job.ts` (job name `wolfram-verify`),
registered on `src/jobs/job-runner.ts` — the persistent, checkpointed,
single-flight background job runner (NOT the older
`scripts/verify-wolfram-batch.ts`, which is kept only as
`npm run content:verify:legacy` for reference and is not what this skill
drives).

- **Scope:** `frontend/public/data/content-bundle.json`'s `problems[]`
  array — bundle-file scope, not a `generated_problems` DB table.
- **Not scope:** anything in `data/practice-items/*.json` (the practice-item
  factory's banks — that's `scripts/check-practice-items.ts`'s job, a
  schema/re-grade CI gate, not a Wolfram re-verification pass).

## Preflight (honest refusal, not a silent no-op)

The job refuses to start — cleanly, with a message, exit code 1 — when
`WOLFRAM_APP_ID` is unset:

```
WOLFRAM_APP_ID is not set — the wolfram-verify job refuses to start.
Set WOLFRAM_APP_ID (Wolfram|Alpha Full Results API app id) and retry.
```

There is no degraded mode here. Either the key is present and the job runs
for real, or it does not run at all.

## Invocation

```bash
# Foreground CLI (loads .env automatically, runs the real job, exits 0/1)
npm run content:verify

# Equivalent direct form
npx tsx src/jobs/job-cli.ts wolfram-verify
```

Or via the admin job-control REST surface (same runner, same checkpoint —
requires the admin/owner/institution role, or `CRON_SECRET`):

```
POST /api/admin/jobs/wolfram-verify/start
GET  /api/admin/jobs/wolfram-verify/status
POST /api/admin/jobs/wolfram-verify/cancel
```

## Checkpointed flow (what actually happens)

1. Load the bundle. Build the candidate list: skip anything already
   `wolfram_verified`, and pre-skip anything `shouldSkipProblem()` flags —
   no `correct_answer`, an empty/too-long answer, or a narrative-style
   answer nothing can numerically compare (`no-correct-answer`,
   `empty-answer`, `answer-too-long`, `narrative-answer`, `mcq-narrative`).
2. `ctx.processItems(...)` walks the candidates one at a time, rate-limited
   between calls, with an atomic JSONL checkpoint per problem under
   `.data/jobs/wolfram-verify.checkpoint.jsonl` (write-temp-then-rename —
   survives a crash mid-run).
3. Per problem: call `verifyProblemWithWolfram`. Three outcomes, all
   recorded distinctly (never collapsed into one status):
   - **verified** — `wolfram_verified: true` + `wolfram_verified_at` stamped
     on the bundle problem; the bundle file is saved immediately
     (write-temp-then-rename), not batched to the end.
   - **failed** — Wolfram disagreed with `correct_answer`. Recorded as
     `outcome: 'failed'` with `wolfram_answer`; the item stays unverified
     and is a candidate again next run (there is no separate
     quarantine/demotion table — see "What this is NOT" below).
   - **inconclusive** — the arbiter had no opinion (outage, no key mid-run,
     empty result, a timeout that slipped through). Recorded as
     `outcome: 'inconclusive'`, distinct from `failed` — this is "the judge
     didn't answer," not "the judge said no." Also a candidate next run.
   - A genuine provider **timeout** throws `ProviderTimeoutError`, which the
     runner retries ×2, then skips-and-records that item — the run itself
     keeps going.
4. **Step harvest** — for every problem that verifies THIS run, also request
   Wolfram's step-by-step solution (`show_steps`) and cache it to
   `.data/wolfram-steps/<problem_id>.json` with provenance
   `{source: "wolfram", query_id, fetched_at}`. Capped separately (see
   below); a step-harvest failure never undoes the verification.
5. Hitting the call cap mid-run throws `QuotaExhaustedError` — the job
   **pauses** (not fails) with a resumable checkpoint. Re-running the same
   command resumes from where it left off; the provider is never asked to
   redo work it already did this run.

## The real env caps (verified against `src/jobs/job-runner.ts`)

```bash
WOLFRAM_APP_ID=...                  # required — no default, no fallback
WOLFRAM_RATE_MS=1200                # default: ms between Wolfram calls
WOLFRAM_MAX_CALLS_PER_RUN=200       # default: verification + step calls SHARE this cap
WOLFRAM_STEPS_MAX_PER_RUN=50        # default: step-harvest calls, capped separately
```

Global kill switch (refuses ALL job starts, not just this one):
`CONTENT_JOBS_DISABLED=true`.

## Result / exit codes (`npm run content:verify`)

- `0` — completed, or **paused** on quota (resumable — rerun to continue).
- `1` — refused (missing `WOLFRAM_APP_ID`, kill switch, corrupt checkpoint,
  already running) or failed outright.

A paused run is not a failure. Re-run the same command; it resumes.

## What this is NOT

The following do not exist in this codebase. If you see them referenced
anywhere else, that reference is stale — file an issue rather than trusting
it:

- `src/gbrain/operations/verify-sweep.ts` — no such operation file. The real
  entry point is the job above, via `job-cli.ts` / the admin routes.
- `verification_audit_log` — no such table. Per-item outcomes live in the
  job's own checkpoint (`.data/jobs/wolfram-verify.checkpoint.jsonl`) and on
  the bundle problem itself (`wolfram_verified`, `wolfram_verified_at`).
- `quarantine_problems` — no such table, no 3-strikes demotion policy. A
  problem that fails or comes back inconclusive simply stays unverified and
  is a candidate on the next sweep; there is nothing to "restore" it from.

## Why this matters

Static question banks rot silently — nobody notices a wrong answer until a
student complains. This job re-checks bundle problems against a live CAS on
a recurring basis, catching model/content drift instead of trusting a
one-time verification forever.
