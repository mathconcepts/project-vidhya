# TEACHING — The Teaching Loop

> The framework that ties content generation, delivery, and student modelling into one observable cycle. This doc is the *contract*: what a teaching turn is, when it opens, when it closes, what fields it carries, and how to extend the loop. Read [ARCHITECTURE.md](./ARCHITECTURE.md) first for the modules; this is one layer deeper.

---

## The loop in one sentence

A student gets better when the system shows them something at the edge of what they can do, observes their attempt, updates its model of them, and uses the updated model to choose what comes next. **A teaching turn is one round of that loop made visible.**

## The two-phase turn

```
                    ┌──────────────────────────────────────────────┐
                    │                                              │
   Student asks     │     openTurn()                               │
   for content      │       │                                      │
        │           │       ▼                                      │
        ▼           │   ┌──────────────────────────────┐           │
  ┌──────────────┐  │   │   Pre-state captured         │           │
  │ /api/chat,   │  │   │   - mastery_before           │           │
  │ /api/gbrain/ │──┼──▶│   - zpd_concept              │           │
  │   attempt-   │  │   │   - is_cold_start?           │           │
  │   insight,   │  │   │   - is_zpd_candidate?        │           │
  │ /api/snap-   │  │   │   - repeated_error_pattern?  │           │
  │   solve,     │  │   │   - degraded.reason?         │           │
  │ etc.         │  │   └──────────────────────────────┘           │
  └──────────────┘  │       │                                      │
                    │       ▼                                      │
                    │   ┌──────────────────────────────┐           │
                    │   │   Content delivered          │           │
                    │   │   - LLM streams response     │           │
                    │   │   - Wolfram verifies         │           │
                    │   │   - explainer renders        │           │
                    │   │   - student attempts         │           │
                    │   └──────────────────────────────┘           │
                    │       │                                      │
                    │       ▼                                      │
                    │   ┌──────────────────────────────┐           │
                    │   │   Post-state observed        │           │
                    │   │   - attempt_outcome          │           │
                    │   │   - insight                  │           │
                    │   │   - mastery_delta            │           │
                    │   │   - duration_ms              │           │
                    │   └──────────────────────────────┘           │
                    │       │                                      │
                    │       ▼                                      │
                    │     closeTurn()                              │
                    │       │                                      │
                    │       ▼                                      │
                    │   .data/teaching-turns.jsonl                 │
                    │   (append-only log)                          │
                    └──────────────────────────────────────────────┘
```

A turn that never gets a `closeTurn` stays `status='open'` — that's not a bug, it's data. It tells us the student bounced or the request crashed silently.

## The TeachingTurn record

Defined in [`src/teaching/turn-store.ts`](./src/teaching/turn-store.ts). Public re-export at [`src/modules/teaching/index.ts`](./src/modules/teaching/index.ts). Persisted as JSONL at `.data/teaching-turns.jsonl` via the append-only log helper at [`src/lib/append-log.ts`](./src/lib/append-log.ts).

A reconciled turn has these fields:

| Field | Source | Notes |
|---|---|---|
| `turn_id` | generated at open | unique per interaction |
| `student_id` | auth or `anon_<sessionId>` | follows existing convention |
| `initiated_at` / `closed_at` | open / close | ISO 8601 |
| `status` | reconcile | `open` if no close event yet, `closed` otherwise |
| `intent` | `classifyIntent(message)` | content-router vocab (6 values) |
| `student_intent` | gbrain task reasoner | richer vocab (8 values incl. confusion/frustration) — populated when GBrain is in the loop |
| `pedagogical_action` | gbrain task reasoner | what the reasoner decided |
| `delivery_channel` | handler | `web` / `telegram` / `whatsapp` / etc. |
| `routed_source` | content-router output | `bundle` / `cache` / `generated` / `wolfram` / etc. |
| `generated_content` | handler | `{type, summary, content_id?, content_version?}` |
| `pre_state` | gbrain student model | mastery snapshot — see scenario fields below |
| `degraded.reason` | handler | `no-llm-available` / `verification-failed` / `stale-content-detected` / etc. |
| `attempt_outcome` | close handler | `{correct, response_time_ms, response_text?}` — text truncated to 200 chars |
| `insight` | `computeInsight()` output | only on `attempt-insight` path |
| `mastery_delta` | close handler | `{before, after, delta_pct}` |
| `duration_ms` | close handler | total wall time |

## The seven scenarios

The brainstorm enumerated thirteen scenarios where the loop should respond differently. Seven are targeted in this work; six are deferred. Status as of the latest commit:

| # | Scenario | Status | Detection mechanism |
|---|---|---|---|
| 1 | Cold start | **detected** | `pre_state.is_cold_start = true` when total attempts across mastery vector < 3 |
| 2 | Repeated error pattern | **detected** | `pre_state.repeated_error_pattern = true` when `studentModel.consecutive_failures >= 3` |
| 3 | Concept readiness (ZPD) | **detected** | `pre_state.is_zpd_candidate = true` when GBrain reasoner picked the concept |
| 4 | Plateau | **deferred** | needs cross-turn analytics; no detection logic yet |
| 5 | Stale content | **deferred** | needs content_version + syllabus_version registry |
| 6 | No LLM available | **detected** | `degraded.reason = 'no-llm-available'` on early-exit at chat handler |
| 7 | Verification failure | **deferred** | needs hook into rendering-routes Wolfram cross-check |

The other six brainstormed scenarios (mastery drift, regression, cross-exam transfer, channel mismatch, privacy boundary, multi-student aggregation) are scaffolded by the schema but not detected. Each is a clean follow-up.

### Detected scenarios — what they mean

**Cold start.** A student with under 3 attempts across all concepts is in cold start. The system has effectively no model of them yet. The right pedagogy is calibration ("let's see where you are") rather than personalisation ("based on what I know about you, try this"). The flag exists so future logic can branch on it; today the chat handler doesn't change behaviour, but the flag is recorded so an admin reviewing turns can see "this student was in cold start when this happened."

**Repeated error pattern.** When `studentModel.consecutive_failures >= 3` GBrain has already concluded the student is struggling on the current concept. The reasoner may shift to `expressing_frustration` intent and choose a remediation `pedagogical_action`. The turn record carries this so improvement summaries can later compute "did the remediation work?".

**Concept readiness (ZPD).** When GBrain's task reasoner picks a concept via `getZPDConcept`, the concept is in the student's Zone of Proximal Development — prereqs met, mastery low, ready to learn. This is the most pedagogically valuable signal in the system; turns flagged `is_zpd_candidate` are the ones that should produce the largest mastery deltas.

**No LLM available.** The simplest possible degraded mode. When `GEMINI_API_KEY` is missing, the chat handler returns 503 immediately. Pre-instrumentation, this was an invisible failure ("why isn't the chat working?"). Now every degraded request produces a turn with `degraded.reason='no-llm-available'`, visible to admins debugging deployment health.

### Deferred scenarios — why and what's needed

**Plateau detection** needs to look at the last N turns and notice that mastery deltas are clustering near zero. The `summariseStudent` helper computes a `trend` field that approximates this, but per-turn flagging would require a separate pass over recent turns at open time. Defer until there's a UX consumer that needs the flag.

**Stale content detection** needs the content registry to carry a `syllabus_version` parallel to the existing `content_version`. The schema field on the turn (`generated_content.content_version`) is ready; the comparison logic isn't. Tied to PENDING.md §4 (content engine evolution).

**Verification failure** is the most concrete of the deferred set. Wolfram cross-check is wired through rendering-routes; instrumenting it to label turns `degraded.reason='verification-failed'` is a clean ~20-line PR. Not done in this commit because rendering-routes wasn't part of this PR's instrumentation pass; commit chain stayed focused on chat + notebook-insight.

## Where openTurn / closeTurn live in the code

Currently instrumented:

- **`src/api/chat-routes.ts`** — `handleChat`. Three call paths covered:
  - `getChatModel()` returns null → open + immediate close with `degraded.reason='no-llm-available'`
  - main streaming path → open after GBrain reasoner runs (so `student_intent` and `pedagogical_action` are populated), close after SSE stream completes
  - stream-error catch → close with whatever duration we have
- **`src/api/notebook-insight-routes.ts`** — `handleAttemptInsight`. Open before model_after read, close after `computeInsight()` returns. This is the highest-fidelity turn record: real `mastery_delta`, real `attempt_outcome`, real `insight` payload.

Not yet instrumented (clean follow-ups):

- `src/api/snap-solve-routes.ts` — snap-a-photo solve
- `src/api/bitsat-sample-routes.ts` — sample exam runner
- `src/api/rendering-routes.ts` — lesson rendering (the right place to label verification failures, scenario 7)

Each is a pattern-copy from chat-routes — open at handler entry, close at success and on error, degraded.reason on known failure paths.

## Pattern: how to instrument a new handler

```ts
import { openTurn, closeTurn, type MasterySnapshot } from '../modules/teaching';
import { getCurrentUser } from '../auth/middleware';

async function handleX(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await getCurrentUser(req);
  const student_id = auth ? auth.user.id : `anon_${sessionId}`;
  const turn_started_at = Date.now();
  let turn_id: string | null = null;

  try {
    // 1. Open the turn early — capture pre_state from whatever state
    //    you have access to. If you don't have a student model handy,
    //    leave scenario fields undefined; that's better than fabricating.
    const pre_state: MasterySnapshot = {
      concept_id: /* from request */ null,
      topic: null,
      mastery_before: null,
      attempts_so_far: null,
      zpd_concept: null,
    };
    turn_id = openTurn({
      student_id,
      intent: 'explain-concept',  // pick from content-router Intent vocab
      delivery_channel: 'web',
      routed_source: 'generated',
      generated_content: { type: 'explanation', summary: '...' },
      pre_state,
    });

    // 2. Do the work.
    const result = await doWork();

    // 3. Close the turn with whatever you observed.
    closeTurn({
      turn_id,
      attempt_outcome: result.correct !== undefined
        ? { correct: result.correct, response_time_ms: result.time_ms }
        : undefined,
      mastery_delta: result.delta,
      duration_ms: Date.now() - turn_started_at,
    });

    sendJSON(res, result);
  } catch (err) {
    // 4. Close the turn on the error path — even an empty close is
    //    better than leaving the turn open forever.
    if (turn_id) {
      try { closeTurn({ turn_id, duration_ms: Date.now() - turn_started_at }); }
      catch { /* swallow */ }
    }
    sendError(res, 500, 'something failed');
  }
}
```

Three rules:

1. **Turn instrumentation must never break the request.** Every `openTurn` and `closeTurn` is wrapped in try/catch that logs and continues. The chat path still works if the turn store is broken.
2. **Open early, close on every exit path.** Including the error path, including degraded modes. A turn left open is technically valid (status will be `open`) but reduces the legibility benefit.
3. **Don't fabricate detection signals.** If you don't have a student model, leave `is_cold_start` undefined rather than setting it to false. The schema treats absent and false differently — false would be a claim, undefined is honest.

## Reading turns

Three endpoints, all in [`src/api/turns-routes.ts`](./src/api/turns-routes.ts):

| Endpoint | Auth | Use |
|---|---|---|
| `GET /api/turns/me` | any authenticated user | own turn history |
| `GET /api/turns/student/:id` | admin / teacher (roster) / parent (guardian_of) / self | another student's turn history |
| `GET /api/turns` | admin only | full firehose |

Frontend page at `/gate/turns` (own) and `/gate/turns/:id` (admin/teacher/parent view).

Per-student response includes a `summary` block with `total_turns`, `closed_turns`, `total_attempts`, `correct_attempts`, `avg_mastery_delta_pct`, and `trend` ∈ `improving | flat | declining | insufficient-data`.

## Privacy and access control

Three concerns the turn log creates and how they're addressed:

- **Cross-student leakage.** A student must never see another student's turns. Authorization layered in `turns-routes.ts`:
  - Self-read always allowed
  - admin/owner/institution: full access
  - teacher: only roster (target in `actor.teacher_of`)
  - parent: only `guardian_of`
  - student-to-student: 403
  Verified end-to-end in `scripts/verify-teaching-loop.ts`.

- **Response text leakage.** `attempt_outcome.response_text` is truncated to 200 chars at write time, not stored full. The chat path doesn't currently record response text on close (it's not pedagogically interesting); only the attempt-insight path might.

- **Anonymous session traceability.** Anonymous chat traffic uses `anon_<sessionId>`. The sessionId is browser-generated, not a stable identity, so `/api/turns/me` can't reach an anon's history without a JWT. Anon turns are visible only to admins via `/api/turns` firehose, for ops debugging — not for browsing student data.

Per-user data deletion (PENDING.md §5 data-rights flow) does **not** currently clear that user's turn log. Open follow-up — when `finaliseExpiredDeletions` runs, it should also remove turns where `student_id === user_id`.

## Append-only log: durability properties

The `.jsonl` format means:
- Records are immutable — once a turn is logged, the line is never edited
- Order matters — later records describe what happened later
- Corrupt lines (e.g. a torn write at the tail) are skipped silently on read; the next read returns valid records minus the corruption
- Earliest-wins on duplicates — if a turn somehow gets two close events, the first is the truth, the second is an audit-trail anomaly worth keeping in the log but not surfacing

These properties matter because the turn log is *audit data*: an admin investigating "what happened" needs to trust what they see. Editing or rewriting would break that trust.

## Scaling

Linear scan on read — fine up to ~100k turns per file. Beyond that, log rotation by month is the obvious follow-up:

```
.data/teaching-turns.jsonl                  # current month
.data/teaching-turns-2026-04.jsonl          # archived
.data/teaching-turns-2026-03.jsonl          # archived
```

The read API would need to know which files to scan based on a date range query parameter. Not implemented today; the deployment scale doesn't need it yet.

## Where this doc fits

- [OVERVIEW.md](./OVERVIEW.md) — what Vidhya is and who for
- [DESIGN.md](./DESIGN.md) — why the architecture is shaped this way
- [ARCHITECTURE.md](./ARCHITECTURE.md) — modules + topology + data flow
- [LAYOUT.md](./LAYOUT.md) — file map
- [AUTH.md](./AUTH.md) — auth module surface
- **TEACHING.md (this file)** — the teaching loop's contract

If a code change makes this doc inconsistent with the running system, the running system wins; this doc has a bug.
