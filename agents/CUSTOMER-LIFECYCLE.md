# Customer Lifecycle — agent ownership and interconnection

> **Status:** canonical reference · last reviewed 2026-04-24
> **Scope:** every touchpoint from "never heard of Vidhya" through
> "retained power user" through "churn + win-back"
> **Relationship to other docs:**
> - [`ORG-CHART.md`](./ORG-CHART.md) — *structural* org
> - [`_shared/constitution.md`](./_shared/constitution.md) — four core promises
> - [`_shared/gbrain-integration.md`](./_shared/gbrain-integration.md) — cognitive-spine contract
> - **this file** — *dynamic* lifecycle view over the same agents

This document answers: **"when a customer moves from X to Y, which
agent owns the transition, what data flows between agents, and what
breaks if the handoff is missing?"**

Every claim here is grounded in either a named agent manifest under
`agents/` or specific shipped code. Gaps — places where no agent
clearly owns a customer touchpoint today — are called out explicitly
as proposed roles under existing managers.

---

## The six lifecycle stages

```
      ┌────────────┐   ┌────────────┐   ┌────────────┐
      │ 1 AWARENESS│─▶ │ 2 CONSIDER │─▶ │  3 TRIAL   │
      │   (SEO)    │   │   (pitch)  │   │   (demo)   │
      └────────────┘   └────────────┘   └────────────┘
                                              │
                                              ▼
      ┌────────────┐   ┌────────────┐   ┌────────────┐
      │ 6 WIN-BACK │◀──│ 5 RETAIN/  │◀──│ 4 ACTIVATE │
      │  OFFBOARD  │   │    EXPAND  │   │  (1st win) │
      └────────────┘   └────────────┘   └────────────┘
```

These are the stages. Each section below maps: *entry signal → owning
agent(s) → what gets captured → handoff trigger → next stage.*

---

## Stage 1 — Awareness

**Entry.** Someone Googles *"BITSAT preparation"*, *"how to study for
JEE with limited time"*, or a specific concept like *"inverse of a
matrix"*. They land on a Vidhya public article, topic page, or
solution page.

**Public URLs that serve this stage.**

```
GET /topics/:slug              topic-page resolver
GET /solutions/:slug           solution landing page (SEO)
GET /blog/:slug                long-form article
GET /exams/:slug               exam-overview page
GET /sitemap.xml               crawlable catalogue
```

**Owning agent.** `seo-manager` (reports to `cmo`).

**Mission (from `agents/managers/seo-manager.yaml`).** *"Maintain public
articles that help students find Vidhya — keep them accurate against
the shipped product, retire the stale ones."*

**Signal captured.** None per-person at this stage — just page
analytics that the seo-manager aggregates into an *article-health*
view. No session, no user id, no PII. **The student is a browser, not
a person.**

**Constitutional guarantee.** Articles contain no false claims —
every claim either traces to shipped code or to `FEATURES.md`. The
seo-manager's `detect drift` skill runs periodically; articles whose
claims no longer match shipped behaviour are flagged for
`authoring-manager` refresh or retired.

**Handoff to Stage 2.** The student clicks a call-to-action on an
article: *"Try the demo"* → `/demo.html`, or *"Read the pitch"* →
`/pitch`. Handoff is a URL transition; no state moves.

---

## Stage 2 — Consideration

**Entry.** The student is on a Vidhya-owned page trying to decide
whether to engage further. `/pitch`, `/exams/bitsat`, the landing
page, a campaign-specific URL like `/try/bitsat-7-days`.

**Owning agent.** `outreach-manager` (reports to `cmo`).

**Mission (from manifest).** *"Execute campaigns — launch, monitor,
retire. Every campaign claim is traceable to shipped code or
FEATURES.md."*

**What outreach-manager does here.** Owns campaign URLs and their
content. If a campaign says *"60-minute diagnostic, free forever"*,
outreach-manager verifies that sentence is actually true in shipped
product before launching, and retires the campaign if it stops being
true.

**Signal captured.** Campaign-level click-through, not per-user. Any
per-user tracking at this stage would violate the Calm promise
("you are studied for, not studied on") before the student has
opted into anything.

**Handoff to Stage 3.** Click of a *"Try Vidhya free"* button →
`/demo.html`. The demo role-picker page is where the student first
encounters the product directly.

---

## Stage 3 — Trial (the Demo)

**Entry.** URL lands at `/demo.html`. Six role cards appear.

**Owning agents — this is a multi-agent stage.**

| Activity | Agent | Evidence |
|---|---|---|
| Demo infrastructure (seed, bootstrap page, JWT issuance) | *no existing agent* — **gap, proposed: `conversion-specialist` under `outreach-manager`** | See *Gap Analysis* below |
| Telemetry capture (`.data/demo-usage-log.json`) | `telemetry-manager` (cdo) | Constitutional for this — "opt-in anonymous aggregation" applies |
| Planning, practice, templates (the experience itself) | Same agents who own these for real users: `planner-manager`, `teaching-manager`, `assessment-manager` | Demo uses shipped routes |
| Role-hierarchy enforcement | `security-manager` (cto) indirectly via `auth/middleware.ts` | Role-gating is JWT-based and production code |

**What's captured.** Every demo session writes to
`.data/demo-usage-log.json` (see `demo/telemetry.ts`). The log is
owner-visible. Entries contain `{ timestamp, role, user_id
(demo-user), event, detail? }` — no free-text, no request bodies.

The demo-usage log is **explicit** — the role-picker page carries the
notice *"Heads up — this session is logged."* Constitutionally this
is aligned with the Calm promise because:
1. The tester is told
2. What's captured is event codes only (not content)
3. When they convert, the demo log entries are decoupled from their
   real account (see *Demo → paid conversion* worked scenario)

**Handoff to Stage 4.** Two paths:

1. **Explicit conversion trigger.** A CTA in the demo: *"Sign up to
   keep what you've practiced."* Clicking creates a real account.
2. **Implicit abandonment.** Tester closes the tab. Demo session
   data remains in `.data/` for the owner; the browser's localStorage
   still holds the demo JWT but expires at 30 days.

---

## Stage 4 — Activation (first real win)

**Entry.** The student has a real account (Google OAuth via
`upsertFromGoogle`, or — for channel users — a Telegram/WhatsApp
identity linked via `linkChannel`). They've registered at least one
exam and need to *feel the product work*.

**The activation milestone — concrete definition.**

> A student is **activated** the first time they complete a planned
> session and see their trailing-stats badge update from "0 minutes"
> to a positive number.

This is the first compounding moment — the first time the promise
*"every five minutes compounds"* becomes visible to the student as
visible evidence rather than marketing copy.

**Owning agents — the activation handoff chain.**

```
  student clicks Sign Up
          │
          ▼
  [planner-manager]          — shows onboarding walkthrough
          │                     (gap: no dedicated onboarding-specialist today)
          ▼
  [curriculum-manager]       — offers exam catalogue to register
          │
          ▼
  [student-model-manager]    — initialises GBrain profile
          │
          ▼
  [planner-manager]          — generates first session plan
          │
          ▼
  [teaching-manager]         — serves first lesson / practice problem
          │
          ▼
  [assessment-manager]       — captures first attempt
          │
          ▼
  [student-model-manager]    — records completion, updates trailing stats
          │
          ▼
  ✓ trailing-stats badge shows positive — ACTIVATED
```

**Data-flow specifics.**

| Step | Writes to | Read by |
|---|---|---|
| Onboarding | `src/auth/user-store.ts` (`.data/users.json`) | all role-gated routes |
| Exam registration | `src/session-planner/exam-profile-store.ts` | `planner.ts` |
| Profile init | `src/gbrain/student-model.ts` | `teaching-manager` for personalization |
| First plan | `src/session-planner/store.ts` | UI at `/gate/planned` |
| First attempt | `src/attention/store.ts` + `src/session-planner/practice-session-log.ts` | `sumTrailingMinutes()` |
| Trailing stats update | Both stores unioned | `/api/student/session/trailing-stats` |

**Gap.** No agent today owns *onboarding flow quality specifically*
— every manager owns their tool but no agent asks *"is the first-time
experience working, and if not, why?"* Proposed new specialist —
`onboarding-specialist`, under `planner-manager` — covered in the
Gap Analysis below.

**Handoff to Stage 5.** The student returns for session #2.
Activation is a one-shot milestone; retention/expansion is the
ongoing stage that follows.

---

## Stage 5 — Retention and Expansion

**Entry.** The student has been activated. They return, request more
plans, build the trailing-stats streak that isn't a streak.

**Owning agents.** This is where the product's main capacity of
agents shines — each interaction activates multiple agents:

```
  student requests a session plan
              │
              ▼
  planner-manager
     ├─ student-model-manager    (read topic-mastery)
     ├─ curriculum-manager       (read exam-concept map)
     ├─ llm-router-manager       (if explainer needed)
     └─ teaching-manager         (resolve content)
              │
  plan renders — student acts
              │
              ▼
  assessment-manager
     ├─ attempt-logger           (record)
     ├─ error-classifier         (categorize mistakes)
     └─ attempt-insight-specialist (GBrain write path)
              │
              ▼
  student-model-manager          (update mastery estimate)
              │
              ▼
  feedback-manager               (if student rates / flags)
              │
              ▼
  telemetry-manager              (anonymous cohort delta)
```

**The retention signals.**

`student-model-manager` watches for:

| Signal | Meaning | Action |
|---|---|---|
| `trailing_7d_minutes` dropping | Frequency loss | **Gap — no retention-specialist owns this today.** Proposed below. |
| `last_practice_date` > 7 days ago | At-risk | Same gap |
| `attempt.correct` declining over time | Topic regression | `student-model-manager` surfaces; `teaching-manager` reacts via re-explainer |
| Repeated misconceptions in same error class | Systemic gap | `feedback-manager` aggregates; `authoring-manager` rewrites the explainer |

**Expansion triggers.**

| Trigger | Owning agent | Response |
|---|---|---|
| Student's current exam date passes | `curriculum-manager` | Offer next-exam upgrade |
| Student adds a 2nd exam in exam-profile | `planner-manager` | Switches to multi-exam planner automatically |
| Student asks about a topic not in their curriculum | `curriculum-manager` | Surface cross-exam recommendation |
| Student's teacher (if assigned) promotes them to a harder track | `teaching-manager` + human teacher | Expand content difficulty |

**Handoff to Stage 6.** Either retention breaks (student stops
coming; see Stage 6) or the student self-churns explicitly (closes
account / deletes data).

---

## Stage 6 — Win-back or Offboard

**Entry.** Student signals disengagement — either implicit (`last_practice_date` > 14 days) or explicit (rating session as "not helpful", leaving feedback, requesting account deletion).

**Owning agents.**

| Activity | Agent | Evidence |
|---|---|---|
| Churn signal detection | *gap* — proposed `retention-specialist` under `telemetry-manager` | See below |
| Exit feedback collection | `feedback-manager` (cpo) | Existing manifest mission includes "collect student feedback" |
| Account deletion / data erasure | `security-manager` (cto) + existing `src/auth/user-store` | Data-rights is production code, not shipped today |
| Post-churn aggregation | `telemetry-manager` | Opt-in k-anon cohort analysis of churn reasons |

**Constitutional stance on win-back.** The Calm promise
(*"you study without the anxiety tax — no streaks, no guilt pings,
no pressure that was never going to teach you calculus anyway"*)
means Vidhya **cannot send guilt-tripping re-engagement pings**. A
legitimate win-back touch is:

- ✓ A periodic (max monthly) email summarising *what their cohort
  practiced this month*, aggregate-only, opt-out-by-default
- ✓ An end-of-exam-period letter congratulating them on what they
  studied
- ✗ "We miss you!" notifications
- ✗ "You haven't studied in 3 days" pushes
- ✗ Streaks, badges, loss-aversion gamification

The `retention-specialist` role (proposed) is bound by the
constitution: its win-back actions are limited to the allowed-list
above.

**Offboard done right.**

1. Student requests data deletion via `/gate/settings` → delete-account
2. `security-manager` confirms intent (24h cooling period)
3. `src/auth/user-store.ts` marks user as `deleted_at` set
4. All per-user flat-file entries (exam profile, plans, practice
   log, templates) are dropped
5. `telemetry-manager` retains only the aggregated anon-deltas the
   student previously opted into; nothing tied back to the student
6. If student was on a channel, `unlinkChannel` severs the
   Telegram/WhatsApp binding

---

## Agent × Lifecycle-stage responsibility matrix

Horizontal = lifecycle stage. Vertical = C-suite reporting chain. Cell
= which manager(s) own(s) the stage. `*` marks a role gap addressed
below.

| C-suite  | 1. Awareness | 2. Consider | 3. Trial | 4. Activate | 5. Retain/Expand | 6. Win-back/Offboard |
|---|---|---|---|---|---|---|
| **CMO**  | `seo-manager` | `outreach-manager` | `outreach-manager` + *`conversion-specialist`* \* | — | — | *`retention-specialist`* \* (win-back messaging) |
| **CPO**  | — | — | `planner-manager`, `teaching-manager`, `assessment-manager` (demo uses same surfaces as real product) | *`onboarding-specialist`* \* under `planner-manager` | `planner-manager`, `teaching-manager`, `assessment-manager`, `feedback-manager` | `feedback-manager` (exit feedback) |
| **CCO**  | `authoring-manager` (article quality) | — | — | `curriculum-manager` (give right syllabus) | `curriculum-manager`, `authoring-manager`, `verification-manager` | — |
| **CDO**  | — | — | `telemetry-manager` (demo-usage log) | `student-model-manager` (GBrain profile init) | `student-model-manager`, `telemetry-manager` | *`retention-specialist`* \* under `telemetry-manager` (detect churn) |
| **CTO**  | infrastructure via `infrastructure-manager` | same | same, + `security-manager` (JWT) | `security-manager` (auth wall) | `infrastructure-manager`, `llm-router-manager` | `security-manager` (data erasure) |
| **COO**  | `health-manager` (article-resolver liveness) | same | same | `task-manager` (onboarding cron) | `health-manager`, `task-manager` | `health-manager` |

Four roles marked \* don't exist today — see *Gap Analysis* below.

---

## Worked scenario 1 — Demo to paid conversion

This is the specific scenario the brief asked about. It is a real
hard case: we have demo data in flat files tied to a demo-user id
(`user_4DqgTqpf9rhk` — Nisha the demo owner), and the tester wants
their real account (with their Gmail address) to *inherit the work
they did in the demo session*.

### The conversion flow

```
  Browser state:
    localStorage["vidhya.auth.token.v1"] = <demo JWT — Priya>
    → student is currently signed in as "Priya Sharma (demo · active)"

  They click "Make this real" in the UI
    │
    ▼
  [conversion-specialist] — proposed agent under outreach-manager
    │
    ├─ Step 1. Present Google OAuth (real identity)
    │          src/auth/google-verify.ts
    │          src/auth/user-store.ts#upsertFromGoogle
    │          → mints real user_id (e.g. user_xyz123)
    │
    ├─ Step 2. Offer "carry over your demo work?" — explicit opt-in
    │          UI shows: 2 exams, 6 plans, 3 templates, 99 min history
    │
    │          If YES:
    │            migrateDemoToReal(from=demo_user_id, to=real_user_id)
    │
    │          If NO:
    │            real account starts empty
    │
    ├─ Step 3. Mark demo user as converted
    │          users.json: demo_user.converted_to = real_user_id
    │          (this is the only cross-account link ever drawn)
    │
    ├─ Step 4. Anonymise demo telemetry
    │          demo-usage-log.json: rewrite entries tied to demo_user_id
    │          user_id field set to null; event data preserved for
    │          cohort analysis only
    │
    ├─ Step 5. Replace JWT in browser
    │          localStorage["vidhya.auth.token.v1"] = <real JWT>
    │
    └─ Step 6. Redirect to /gate/planned — same surface, now real
```

### The migration function — what moves

`migrateDemoToReal(from, to)` is a proposed function under
`conversion-specialist` responsibility. It reads each flat-file
store, finds entries where `student_id === from`, and rewrites
them with `student_id = to`. Specifically:

| Store | Field | Action |
|---|---|---|
| `students-exam-profiles.json` | `student_id` | rename key `from` → `to` |
| `session-plans.json` | `request.student_id` per plan | rewrite each matching plan |
| `plan-templates.json` | `student_id` per template | rewrite |
| `practice-sessions.json` | `student_id` per entry | rewrite |
| `users.json` | `demo_user.converted_to` | set to `to` |
| `demo-usage-log.json` | entries with `user_id === from` | set `user_id = null` (but retain event codes for aggregate) |

Attention store entries are **not** migrated — attention records are
ephemeral by design (they inform the planner's short-term fatigue
model, not identity).

Channel links (`user.channels[]`) are migrated if the demo user had
any — e.g. a tester who linked Telegram during the demo keeps that
binding on the real account.

### Telemetry continuity — the honest shape

The user asked specifically about telemetry continuity across demo →
paid. Two truths must coexist:

1. **Product continuity.** The trailing-stats badge should still read
   "99 min across 6 sessions this week" after conversion, not reset
   to zero. Otherwise the product punishes the student for the very
   act of signing up.
2. **Demo-log anonymity.** The owner's demo-usage log shouldn't tie
   the real user's ongoing activity back to their demo-user id, or
   the explicit anonymity promise is broken.

The resolution:

- **Per-student stores** (exam profile, plans, templates, practice log)
  → migrated on opt-in. Trailing stats survive.
- **Demo usage log** (`.data/demo-usage-log.json`) → entries
  anonymised on conversion. The owner loses the link between the
  individual demo session and the real account — as promised — but
  retains the aggregate (*"this month, 40% of demo sessions converted
  within 3 days"*).

The two data surfaces are kept separate. The per-student stores are
about **serving the student**; the demo-usage log is about
**understanding cohorts**. The constitution's Compounding promise
lives in the first; the Calm promise's *"you are studied for, not
studied on"* lives in the second.

### Agent interconnection for this scenario

```
     conversion-specialist (proposed)
             │
             ├─▶ auth/user-store (via CTO's security-manager)
             ├─▶ exam-profile / plans / templates / practice (via CPO's planner-manager)
             ├─▶ demo-usage-log (via CDO's telemetry-manager)
             └─▶ student-model init (via CDO's student-model-manager)
```

No manager orchestrates this today. `outreach-manager` is the closest
existing home because campaign / conversion live on the CMO side. The
proposed `conversion-specialist` under `outreach-manager` would own
the entire flow.

---

## Worked scenario 2 — Content lifecycle (add / remove syllabus)

This is the second specific scenario the brief asked about. An admin
adds a new exam (say NEET Biology 2027). Or an exam adapter is
deprecated because the testing board restructured the syllabus. How
does this propagate to students?

### Adding a new syllabus

```
  Admin (via /gate/admin) creates: EXM-NEET-BIO-2027
          │
          ▼
  [curriculum-manager]
     │
     ├─ Step 1. Accept exam spec (name, date, concept list, weights)
     │          Writes: src/exams/ adapter YAML
     │                  src/curriculum/ concept-map update
     │
     ├─ Step 2. Identify missing concepts
     │          compare new concept list vs existing concept graph
     │          new_concepts = [...] (say 20 concepts)
     │
     ├─ Step 3. Dispatch to authoring
     │          emits signal: CONCEPT_NEEDED
     │          → authoring-manager receives
     │
     ▼
  [authoring-manager]
     │
     ├─ For each new concept:
     │    ├─ explainer-writer — draft explainer
     │    ├─ concept-reviewer — check pedagogical soundness
     │    ├─ verification-manager — verify any worked examples
     │    └─ emits signal: CONCEPT_READY
     │
     ▼
  [infrastructure-manager]
     │
     └─ cascade-tuner, bundle-builder
          → rebuilds the content bundle
          → new concepts now served in tier-0 cache
     │
     ▼
  [outreach-manager]
     │
     └─ Updates /exams/neet-bio-2027 landing page
          → article-health check auto-passes because the exam
            adapter is now shipped
     │
     ▼
  NEET BIO 2027 now appears in:
    - exam-profile picker (/gate/exam-profile)
    - admin exam registry view
    - student:list-exams MCP tool
    - public /exams/neet-bio-2027 URL

  Existing students: nothing changes. New exam is opt-in.

  New students discovering the exam via SEO: Stage 1 → 2 → 3 → 4
  flow starts.
```

**Interconnection.** `curriculum-manager` is the authoritative
source; it *fans out* to `authoring-manager` (writing new explainers),
`infrastructure-manager` (rebuilding bundles), and `outreach-manager`
(updating public pages). All of this is driven by the
`CONCEPT_NEEDED` signal published on the communication bus.

### Removing (deprecating) content

Harder case — removing content without breaking students who depended
on it.

```
  Admin marks EXM-LEGACY-2024 as deprecated
          │
          ▼
  [curriculum-manager]
     │
     ├─ Step 1. Check: any students have this exam in their profile?
     │          query: student-exam-profiles.json WHERE exam_id = 'EXM-LEGACY-2024'
     │          → result: say, 4 students
     │
     ├─ Step 2. Identify replacement — is there a successor exam?
     │          EXM-LEGACY-2024 → EXM-NEW-2027
     │          (if no successor: block deprecation, require manual decision)
     │
     ├─ Step 3. Queue migration — for each affected student:
     │          emit signal: STUDENT_EXAM_DEPRECATED
     │          → notifications-surface queues in-product banner
     │            (constitutionally NOT a push notification)
     │
     ▼
  [feedback-manager]
     │
     └─ Presents migration card in-product next time student opens /gate
          "Your exam (LEGACY-2024) is being retired.
           We recommend switching to NEW-2027 which covers the
           same material. Here's a mapping of your concepts →"
     │
     ▼
  Student opts in OR migrates manually OR ignores
  (no forced migration — constitutionally aligned with Calm)
     │
     ▼
  [student-model-manager]
     │
     ├─ If migrated: carry over mastery estimates per concept
     │              where old concept maps to new concept
     │              (curriculum-manager provides the map)
     │
     └─ If student opts out: profile remains on the deprecated exam
          until their exam_date passes, at which point
          curriculum-manager auto-archives their profile
     │
     ▼
  [authoring-manager]
     │
     └─ Removes deprecated-only concepts from the cold-path bundle
          (keeping any concept still referenced by active exams)
     │
     ▼
  [infrastructure-manager]
     │
     └─ Rebuilds bundle without orphaned content
```

**Interconnection.** `curriculum-manager` again orchestrates, but
now the fan-out includes `feedback-manager` (to surface the
migration to the student without surprise) and `student-model-manager`
(to carry mastery forward where the concept mapping allows it).

**Constitutional guarantees in this flow.**

- Calm: no forced migration; student opts in or out
- Strategy: if they migrate, their mastery travels with them where
  mapping allows; they don't restart
- Compounding: their practice history on shared concepts is
  preserved — the work they put in still compounds
- Focus: the deprecated content disappears from their view cleanly

---

## Gap analysis — proposed new roles

The existing 48 agents cover the platform's technical concerns well.
Four specific customer-lifecycle roles are unclear today:

### 1. `conversion-specialist` (under `outreach-manager`)

**Owns.** The demo → paid conversion flow (scenario 1 above).

**Why not a new manager?** Conversion fidelity is a campaign concern
— it's about ensuring the promise made at the landing page is the
experience on the other side of sign-up. That's outreach-manager's
existing remit, narrowed.

**Owned surface.** `migrateDemoToReal()` (proposed), the "Make this
real" CTA in the demo, the opt-in carryover UI.

**Signals in.** CTA click. Signals out. `CONVERSION_COMPLETED` with
{from_demo_user, to_real_user, carried_over_count}.

### 2. `onboarding-specialist` (under `planner-manager`)

**Owns.** The first-time-user experience. From real account creation
to first activated session. Lives under planner-manager because the
planner IS what a first-time user meets.

**Why this matters.** Activation (Stage 4) is the highest-impact
single handoff in the product; no agent today owns its quality. A
specialist with this mandate ensures the sequence `sign up → exam
registered → first plan → first attempt → trailing-stats > 0` is
measured as an end-to-end funnel.

**Owned surface.** The activation funnel metrics, the welcome sequence,
the empty-state copy when a user's first plan is generated.

### 3. `retention-specialist` (under `telemetry-manager`)

**Owns.** Detect disengagement early without violating the Calm
promise. Runs queries like *"students whose trailing_7d_minutes
has dropped by 50% week-over-week"* on cohort-anonymous data and
surfaces structural issues (not individual nudges).

**What it does NOT do.** Send "we miss you" emails. Build streak
shaming. Track per-user last-seen and trigger guilt notifications.
These violate the constitution.

**What it DOES do.** If it sees that **30% of students who register
BITSAT drop off in week 2**, it aggregates the signal and routes to
`feedback-manager` / `curriculum-manager` to investigate whether the
week-2 content is too hard, too slow, or structurally misaligned.

### 4. `data-rights-specialist` (under `security-manager`)

**Owns.** Account deletion, data export (GDPR-style rights), channel
unlinking on offboard. The product doesn't have this flow today —
account deletion requires manual intervention. For an adult product,
self-service data rights is non-negotiable.

**Owned surface.** `/api/me/delete`, `/api/me/export`, the 24h cooling
confirmation, the irreversibility warning UI.

---

## Interconnection diagram — the big picture

```
                    ┌─────────────────────────────────┐
                    │         the student             │
                    └──────────────┬──────────────────┘
                                   │
    ┌──────────────────────────────┼──────────────────────────────┐
    │                              │                              │
    ▼                              ▼                              ▼
  [CMO]                          [CPO]                          [CCO]
   ├─ seo-manager                 ├─ planner-manager             ├─ curriculum-manager
   │  (awareness)                 │  (activation,                │  (syllabus + exams)
   │                              │   retention)                 │
   ├─ outreach-manager            ├─ teaching-manager            ├─ authoring-manager
   │  (consideration,             │  (engagement)                │  (explainers)
   │   trial, conversion*)        │                              │
   │                              ├─ assessment-manager          ├─ verification-manager
   └──                            │  (attempts)                  │
                                  │                              └─ acquisition-manager
                                  └─ feedback-manager              (content scraping)
                                     (exit, clustering)
    [CDO]                          [CTO]                           [COO]
    ├─ student-model-manager       ├─ security-manager             ├─ health-manager
    │  (GBrain profile)            │  (auth, data-rights*)         │  (org liveness)
    │                              │                               │
    ├─ telemetry-manager           ├─ infrastructure-manager        ├─ task-manager
    │  (cohort anon analytics,     │  (bundles, cascade)            │  (cron, scheduled)
    │   retention*)                │                               │
    │                              └─ llm-router-manager           │
    └──                                                            └──

                           * = proposed new specialist under the indicated manager
```

**Reading this:** every customer touchpoint activates multiple branches
of the tree at once. The planner-manager serving a plan request is
NOT a single agent operating in isolation — it reads from
student-model-manager, consults curriculum-manager for concept
dependencies, routes through llm-router-manager if generation is
needed, and emits to assessment-manager when attempts come back. The
interconnection is structural, not decorative.

---

## How this doc stays honest

This document is cross-cutting. It references 15+ manager manifests
plus multiple specialists. If any agent's mandate changes in a way
that shifts lifecycle ownership, this doc must update in the same
commit. The `health-manager` (coo) is nominally responsible for
catching drift, but this is a human review responsibility in practice.

**Proposed review cadence:** when any of these events happens, this
doc is re-examined:

- A new agent is added to the org
- A manager's manifest changes its `mission` field
- A new lifecycle stage is proposed (e.g. "Referral" as a distinct
  stage from Expansion)
- A new MCP tool changes the data-flow between two stages

**The four proposed specialists** (conversion-specialist,
onboarding-specialist, retention-specialist, data-rights-specialist)
are not yet committed as manifest files under `agents/specialists/`.
Adding them is a conscious decision — each expands the surface the
validator checks. Until they are added, their responsibilities sit in
the "unowned" column of the matrix above, visible and honest rather
than papered over.
