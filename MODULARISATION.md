# Modularisation & tiered orchestration

> **Status:** canonical reference · last reviewed 2026-04-24
> **Source:** *the ideas in the uploaded design note* — modular, tiered,
> monetizable, each module a candidate GitHub subrepo, a master
> orchestrator composing tiers.

This document is the authoritative architecture for turning Project
Vidhya from a single-repo Node service into a **modular platform**
with:

- **8 named modules** with strict boundaries
- **A master orchestrator** that composes deployments by selecting tiers
- **Declarative `modules.yaml`** as the single source of truth for
  module metadata
- **Deployment profiles** ("minimal", "full", "channel-only",
  "institutional-b2b") that prescribe tier mixes
- **A migration plan** for splitting each module into an independent
  GitHub repo while keeping main in sync
- **A monetization model** treating every exam bundle as a sellable
  asset
- **B2B institutional mode** with a new role tier above owner
- **8 further use cases** identified from the design note + analysis

---

## The vision — module vs tier

Two concepts, intentionally separated:

### Module

A **module** is a code boundary — a directory tree that could be
extracted into its own GitHub repository and imported back by SHA.
Modules declare inputs, outputs, and dependencies. The main repo
knows what modules exist via `modules.yaml`.

### Tier

A **tier** is a composable capability a deployment can activate. A
tier may draw on one or more modules. Tiers are what the master
orchestrator selects from when composing a deployment.

Examples:

| Tier | Draws from modules |
|---|---|
| `web-app` | `rendering` (frontend) + `core` |
| `telegram-channel` | `channels` + `content` + `core` |
| `wolfram-verification` | `exams` + `content` + `core` |
| `institutional-b2b` | `lifecycle` + `learning` + every student-facing tier |
| `manim-animation` | (new) `visualization` module — future |

The orchestrator reads `modules.yaml` + a `deployment-profile.yaml`
and decides which tiers to wire up on a given instance.

---

## The 13 modules — current natural boundaries

Grounded in `src/` directory audit. Total ~21,000 LOC.

> **Note:** Until commit `ebdf23c` this section listed 8 modules with
> auth nested inside `core`. As of that commit, `auth` is its own
> first-class module with feature flags and a barrel boundary at
> `src/modules/auth/`. The current count is 9.

### 1. `core` — shared library layer (foundation)

**What's in it:** `src/lib`, `src/utils`, `src/events`,
`src/constants`, `src/services` (Wolfram wrapper + LLM wrapper stubs).

**Boundary:** generic shared utilities. Response helpers (`sendJSON`,
`sendError`), event bus, time/string utils. No domain logic, no
identity logic.

**Why it can't be split:** everything else needs it. This stays in
the main repo permanently. Marked `foundation: true` in `modules.yaml` —
implicit dependency for every other module.

### 2. `auth` — identity + sessions (foundation)

**What's in it:** `src/auth/` (the implementation files), with public
surface at `src/modules/auth/index.ts` (a barrel re-export).

**LOC:** ~1,400 (auth + middleware + user-store + types + jwt + google-verify)

**Boundary:** user identity, role model, JWT, Google OIDC, the
flat-file user store. The barrel is the only place outside the module
that should be imported from.

**Owning agents:** `identity-specialist`, `permissions-specialist`,
`data-rights-specialist`.

**Subrepo candidate:** No, deliberately. The brainstorm in commit
`ebdf23c` argued against extraction: no external contributor surface,
unstable API (institutional-b2b changes pending), tight coupling with
every protected route. The barrel-as-boundary keeps the door open
without paying the extraction cost now.

**Feature flags:** 4 (`auth.google_oidc`, `auth.demo_seed`,
`auth.parent_role`, `auth.institution_role`). See [AUTH.md](./AUTH.md).

### 3. `content` — accumulation + delivery (the notes' first example)

**What's in it:** `src/content`, `src/content-pipeline`,
`src/curriculum`, `src/syllabus`, `src/exam-builder`, `src/samples`,
`src/sample-check`.

**LOC:** ~3,500 (content) + ~2,500 (exam-builder) + ~300 (curriculum) ≈ 6,300

**Boundary:** sources → acquisition → authoring → verification →
representation → routing (per [`CONTENT.md`](./CONTENT.md)).

**Owning agents:** `curriculum-manager`, `acquisition-manager`,
`authoring-manager`, `verification-manager`, `content-router` (from
[`CUSTOMER-LIFECYCLE.md`](./agents/CUSTOMER-LIFECYCLE.md)).

**Independently monetizable as:** per-exam bundles
(BITSAT-quality-2026, JEE-Main-calc-core, NEET-bio-2027).

**Subrepo candidate:** `mathconcepts/project-vidhya-content` (already
scaffolded — see [`CONTENT.md`](./CONTENT.md) for the sync model).

### 4. `rendering` — the frontend layer (the notes' second example)

**What's in it:** `frontend/`, `src/api` (the HTTP surface),
`src/marketing`, `src/rendering`, `src/multimodal`, `src/notebook`,
`src/deployment`.

**LOC:** ~1,800 (marketing) + frontend (~8,000) + api (~4,000) ≈ 14,000

**Boundary:** how students, teachers, and admins see content. Web
app + SEO + blog/video (future) + Manim animation (future) +
interactive surfaces.

**Owning agents:** `seo-manager`, `outreach-manager`
(for campaigns), plus all the gate-page UI.

**Independently monetizable as:** white-labelled deployments for
institutions (different branding, same modules under the hood).

**Subrepo candidate:** `mathconcepts/project-vidhya-web` (frontend only,
consumes the API via the same HTTP surface).

### 5. `channels` — non-web delivery (Telegram, WhatsApp, more)

**What's in it:** `src/bot-telegram`, `src/bot-whatsapp`,
`src/channels`.

**Boundary:** delivering planning, content, and attempts via
third-party messaging channels. Each channel has its own adapter
but a common `ChannelDelivery` interface.

**Owning agent:** (no specific manager today — part of infrastructure
or a new `channel-manager` if split further).

**Independently monetizable as:** per-channel licenses (institution
wants Telegram delivery → they pay for the channel tier).

**Subrepo candidate:** `mathconcepts/project-vidhya-channels`.

### 6. `learning` — the cognitive core

**What's in it:** `src/gbrain`, `src/session-planner`, `src/attention`,
`src/onboarding`, `src/retention`, `src/engine`, `src/templates`,
`src/course`.

**LOC:** ~5,000 (gbrain) + ~1,800 (planner) + others ≈ ~8,000

**Boundary:** how the product actually teaches — GBrain cognitive
spine, session planning, activation funnel, retention analysis,
plan templates.

**Owning agents:** `planner-manager`, `student-model-manager`,
`teaching-manager`, `assessment-manager`, plus specialists.

**Constitutional keystone:** this module holds the four promises
(Calm, Strategy, Focus, Compounding) — they're enforced in code here.

**Subrepo candidate:** NOT recommended. This module is the product's
core IP. Keeping it in main repo protects it.

### 7. `exams` — exam adapters + verification

**What's in it:** `src/exams`, `src/exams/adapters` (BITSAT, JEE
Main, UGEE), `src/verification` (Wolfram), `src/services/wolfram-service`.

**LOC:** ~2,500 (exams) + ~2,400 (verification) ≈ 5,000

**Boundary:** per-exam logic — adapter interface, topic weights,
mock paper generation, verification of numerics.

**Owning agents:** `curriculum-manager` (owns exam shape),
`verification-manager`, `wolfram-verifier`.

**Independently monetizable as:** selling per-exam coverage. A
cohort doing only BITSAT → they pay only for BITSAT adapter.

**Subrepo candidate:** `mathconcepts/project-vidhya-exams`. Each
adapter is self-contained (see [`EXAMS.md`](./EXAMS.md)'s "how to
add a new exam" recipe).

### 8. `lifecycle` — customer journey

**What's in it:** `src/conversion`, `src/data-rights`,
`src/feedback`, `src/teacher`.

**Boundary:** demo-to-paid conversion, self-service data rights,
feedback loops, teacher roster management. Described fully in
[`agents/CUSTOMER-LIFECYCLE.md`](./agents/CUSTOMER-LIFECYCLE.md).

**Owning agents:** `conversion-specialist`, `data-rights-specialist`,
`onboarding-specialist`, `retention-specialist`, `feedback-manager`.

**Subrepo candidate:** NOT recommended. Lifecycle touches auth,
payments (future), analytics — too cross-cutting to split cleanly.

### 9. `teaching` — the loop's legibility layer

**What's in it:** `src/teaching/turn-store.ts` (TeachingTurn schema +
persistence), `src/modules/teaching/index.ts` (public barrel),
`src/api/turns-routes.ts` (read API).

**LOC:** ~500 (turn-store + barrel + routes + frontend page)

**Boundary:** the teaching module is a passive observer. Every
content-generation-and-delivery interaction (chat, attempt-insight,
etc.) opens a TeachingTurn at the start and closes it at the end.
The record carries pre-state (mastery snapshot + scenario flags),
what got served, what happened, mastery delta. Persisted as
append-only JSONL at `.data/teaching-turns.jsonl`.

The module does NOT generate content, update student models, or
decide pedagogy — those stay in content/, gbrain/, and rendering/.
Teaching is the layer that makes the existing loop *visible*.

**Why it earns a separate module:** legibility is a cross-cutting
concern. Putting the turn-store in any one of content/rendering/gbrain
would create circular dependency pressure. Living in its own module
keeps the consumers (any handler that wants to instrument) decoupled
from the implementation.

**Owning agents:** `student-model-manager`, `mastery-estimator`.

**Subrepo candidate:** NOT recommended. The audit-trail data is
deployment-specific; sharing across repos would require a stable
schema across versions which we don't currently guarantee.

**Contract reference:** [TEACHING.md](./TEACHING.md). Seven scenarios
listed there; four currently detected (cold start, ZPD candidate,
repeated error, no-LLM degraded), three deferred (plateau, stale
content, verification failure).

### 10. `content-library` — runtime-augmentable content store

**What's in it:** `src/content-library/types.ts` (LibraryEntry schema),
`src/content-library/store.ts` (two-source loader + in-memory index +
add API), `src/modules/content-library/index.ts` (public barrel),
`src/modules/content-library/feature-flags.ts` (one flag),
`src/api/content-library-routes.ts` (3 HTTP endpoints),
`data/content-library/seed/<concept_id>/{meta.yaml, explainer.md,
worked-example.md}` (committed seed concepts).

**LOC:** ~750 (types + store + barrel + flags + routes + tests)

**Boundary:** the content-library is a passive data store of teaching
materials keyed by concept_id. Two sources: seeds committed in
`data/content-library/seed/` (ships with the repo) and additions
appended to `.data/content-library-additions.jsonl` at runtime via
POST. In-memory Map index built at boot, O(1) lookup.

The library does NOT generate content (that's the LLM in the
`generated` cascade tier), does NOT decide which content to serve a
student (that's the gbrain task-reasoner), and does NOT own routing
(that's `src/content/router.ts`). It plugs into the router cascade as
the second tier:

```
1. uploads / wolfram → 2. subscription → 3. library → 4. bundle →
5. community → 6. generated → 7. declined
```

**Why it earns a separate module:** the user originally asked for
"GBrain to contain predefined teaching materials." Pushed back —
content is a different concern from the cognitive layer (mastery,
motivation, error patterns). Putting them in the same module would
couple two things that are clean today, make GBrain harder to swap,
and violate the modular boundary DESIGN.md argued for. The cleaner
shape is "GBrain consults content-library at decision time." Today
the consult happens at the router layer; future work could let the
task-reasoner consult the library directly.

**Owning agents:** `content-curator-manager`, `tier-0-bundle-specialist`.

**Subrepo candidate:** NOT recommended. The two surfaces (this module
+ `modules/project-vidhya-content/`) serve different purposes — one
is runtime-augmentable starter content shipped with the deployment;
the other is the community git-contribution surface. They use the
same file format so concepts can move between them.

**Contract reference:** [LIBRARY.md](./LIBRARY.md). Three endpoints,
one feature flag (`content_library.user_authoring`, default off),
seed-vs-additions override semantics, and the worked-example-vs-
explainer selection rule for `practice-problem` and
`walkthrough-problem` intents.

### 11. `content-studio` — admin-driven content authoring

**What's in it:** `src/content-studio/types.ts`,
`src/content-studio/store.ts` (orchestrator + persistence),
`src/content-studio/sources/{uploads,wolfram,url-extract,llm}.ts`
(four source adapters), `src/modules/content-studio/index.ts`
(public barrel). Persistence at `.data/content-drafts.jsonl`.

**LOC:** ~900 (types + orchestrator + 4 adapters + barrel + tests)

**Boundary:** the studio is a CREATION workflow that feeds the
content library. Drafts go through review → approve before being
promoted into library entries. The four source adapters cascade
in admin-chosen priority order; first non-null result wins; later
sources are recorded as 'skipped' for audit.

The studio depends on the library (calls addEntry on approve);
the library doesn't know about the studio. One-way dependency.

**Why a separate module from content-library:** the library is
the SERVED content store — what cascade tier 3 reads. The studio
is the draft-and-review surface. Conflating them would mix
LibraryEntry (no draft state) and ContentDraft (no concept of
being live) in one schema. The two-module split keeps each one's
responsibility clean.

**Owning agents:** `content-curator-manager`.

**Subrepo candidate:** NOT recommended. Studio drafts are
deployment-specific runtime state, not content to commit.

**Contract reference:** module barrel at
`src/modules/content-studio/index.ts`. STUDIO.md is a planned
follow-up master doc; until then the inline comments in
`src/content-studio/store.ts` are the contract.

### 12. `operator` — solo-founder business surface

**What's in it:** `src/operator/types.ts`,
`src/operator/payments.ts` (local-JSONL adapter),
`src/operator/analytics.ts` (local-JSONL adapter),
`src/operator/dashboard.ts` (aggregator),
`src/api/operator-routes.ts` (4 endpoints). Persistence at
`.data/payments.jsonl` and `.data/analytics.jsonl`.

**LOC:** ~600 (types + 2 adapters + dashboard + routes + tests)

**Boundary:** the operator module is a small set of integration
points for the external tools a solo founder uses to run the
business. The module is NOT trying to replicate Stripe / Plausible
/ etc. — it's the seam where they plug in.

The dashboard reads from existing modules (user store, payments
adapter, teaching turn store, content-studio drafts, budget
module, health probes). It introduces no new persistence beyond
the two append-logs.

**Why this earns a module:** without it, founder-side work
(payments tracking, analytics, dashboard) sprawls across handlers
and ad-hoc files. Concentrating it in one module gives the
founder one place to look — matches the "easily traceable"
constraint stated when the module was scoped.

**Why this is NOT a marketing/sales/support module:** those
concerns live in external tools (Stripe, Plausible, ConvertKit,
etc.), not in this codebase. FOUNDER.md is the runbook for which
external tools to use; the operator module is the seam.

**Owning agents:** `infrastructure-manager`, `acquisition-manager`.

**Subrepo candidate:** NOT recommended. Tightly coupled to the
deployment's auth + persistence.

**Contract reference:** [FOUNDER.md](./FOUNDER.md) for the runbook.
Module surface in `modules.yaml` and `src/operator/types.ts`.

### 13. `orchestrator` — the master

**What's in it (new):** `src/orchestrator/registry.ts`,
`src/orchestrator/composer.ts`, `src/orchestrator/health.ts`.

**Boundary:** reads `modules.yaml`, resolves dependencies, composes
the active tiers on boot, exposes introspection and health endpoints.

**Owning agent:** **new** `orchestrator-specialist` under `coo`'s
`task-manager` (see "new specialist" section below).

**Subrepo candidate:** NOT recommended. The orchestrator IS the
main repo's raison d'être.

---

## Tier catalog

Tiers are activatable capabilities. A deployment profile declares
which tiers to light up.

### Student-facing tiers

| Tier | Purpose | Depends on modules |
|---|---|---|
| `web-app` | Student uses the web UI | `rendering`, `core`, `learning`, `content`, `exams` |
| `telegram-channel` | Student uses Telegram bot | `channels`, `core`, `content`, `learning` |
| `whatsapp-channel` | Student uses WhatsApp | `channels`, `core`, `content`, `learning` |
| `web-seo` | SEO-driven article surfaces | `rendering`, `content`, `core` |
| `blog-video` *(future)* | Long-form + video explainers | `rendering` + new `media` module |
| `manim-animation` *(future)* | Animated math using Manim | `rendering` + new `animation` module |
| `wolfram-live` | Live Wolfram computation | `exams`, `content`, `core` |

### Institutional tiers

| Tier | Purpose | Depends on modules |
|---|---|---|
| `institutional-b2b` | Org-level management | `lifecycle`, `learning`, + web tiers |
| `proctored-exam` *(future)* | Formal exam delivery | `exams` + new `proctor` module |
| `reporting-dashboard` *(future)* | Institution-scoped analytics | `lifecycle`, `rendering` |

### Operator tiers

| Tier | Purpose | Depends on modules |
|---|---|---|
| `admin-dashboard` | Owner views | `rendering`, `core`, all |
| `agent-org-health` | Agent-org health checks | `core`, every module's health endpoints |

### Content-operation tiers

| Tier | Purpose | Depends on modules |
|---|---|---|
| `content-create` | Content authoring pipeline | `content`, `core` |
| `content-verify` | Content verification | `content`, `exams`, `core` |
| `content-sync` | Sync from community repo | `content`, `core` |

---

## Deployment profiles

A deployment profile is a named tier mix. Shipped with the repo.

### `profile:minimal` — lightest baseline

```yaml
profile: minimal
tiers:
  - web-app
  - admin-dashboard
```

Just the web surface + owner admin. No channels, no Wolfram. Fits
the free-tier Render deploy described in [`DEPLOY.md`](./DEPLOY.md).

### `profile:full` — everything shipped today

```yaml
profile: full
tiers:
  - web-app
  - telegram-channel
  - whatsapp-channel
  - web-seo
  - wolfram-live
  - admin-dashboard
  - agent-org-health
  - content-create
  - content-verify
```

Today's default when all env vars are set. The current demo (post-keys)
matches this.

### `profile:channel-only` — no web

```yaml
profile: channel-only
tiers:
  - telegram-channel
  - whatsapp-channel
  - admin-dashboard
```

An institution wants students in WhatsApp, doesn't want a web app.
Minimal server, minimal attack surface.

### `profile:institutional-b2b` — multi-tenant

```yaml
profile: institutional-b2b
tiers:
  - web-app
  - institutional-b2b
  - proctored-exam
  - reporting-dashboard
  - admin-dashboard
  - wolfram-live
```

For a college deploying Vidhya. Institutional-b2b tier adds the new
`institution` role above owner — see B2B section below.

---

## Feature flags — within-module toggles

Profiles compose tiers; tiers compose modules. **Feature flags are a finer layer**: per-module toggles that flip behaviour within an active module without changing what modules are loaded.

Currently the only module with feature flags is `auth`, declared in [`src/modules/auth/feature-flags.ts`](./src/modules/auth/feature-flags.ts) and the `feature_flags:` block of `auth` in `modules.yaml`.

Mechanics:
- Each flag has an env var (e.g. `VIDHYA_AUTH_GOOGLE_OIDC`) and a default
- The flag module reads `process.env` once at boot
- Flipping a flag requires a server restart — by design, not a runtime API
- State surfaced at `GET /api/orchestrator/features` (admin-only)
- Operator UI at `/admin/features`

The auth flags are documented in [AUTH.md](./AUTH.md). When other modules grow flag surfaces, the same pattern applies — a `feature-flags.ts` in the module barrel directory + a `feature_flags:` block in `modules.yaml`.

**Why flags are intentionally restart-required, not API-flippable:** runtime mutation of auth-related toggles is the kind of feature that turns into a CVE. Operator oversight matters more than zero-downtime here. See [DESIGN.md](./DESIGN.md) §"4. Feature flags as env-var toggles, read once at boot".

---

## The orchestrator — what it does

`src/orchestrator/` is the new module shipped in this commit.

### `registry.ts` — module discovery

Reads `modules.yaml` at startup. Validates every module's:
- Name
- Source path in the repo
- Declared dependencies
- Exported tiers
- Health-check hook

If a module declares a dependency that isn't present, orchestrator
refuses to boot and emits a clear error.

### `composer.ts` — tier composition

Given a deployment profile (name or explicit tier list), resolves:
1. Which tiers to activate
2. Transitive module dependencies
3. Load order (topological sort of deps)
4. Which HTTP routes to register
5. Which agents from the agent-org to activate

### `health.ts` — per-module health

Each module declares a health-check hook. Orchestrator aggregates
these into an org-level health response. `GET /api/orchestrator/health`
returns the full tree — which modules are up, which have degraded
dependencies.

### HTTP surface

| Route | Purpose | Access |
|---|---|---|
| `GET /api/orchestrator/modules` | List all modules | admin+ |
| `GET /api/orchestrator/tiers` | List active tiers | admin+ |
| `GET /api/orchestrator/profile` | Current deployment profile | admin+ |
| `GET /api/orchestrator/health` | Per-module health | public (no PII) |
| `GET /api/orchestrator/graph` | Dependency graph (DOT format) | admin+ |

---

## Subrepo migration — how to actually split

When the time comes to extract a module into its own GitHub repo,
the process is:

### Step 1 — Freeze the interface

For the target module, document every symbol the main repo imports.
Those become the module's **public API**. Anything else is private.

### Step 2 — Create the subrepo

```bash
# Example for content module
gh repo create mathconcepts/project-vidhya-content --private
```

### Step 3 — Use `git subtree split`

```bash
git subtree split -P src/content -b content-split
git push git@github.com:mathconcepts/project-vidhya-content.git content-split:main
```

Preserves full history of the split files.

### Step 4 — Replace in main repo

```bash
# Remove the local copy
git rm -rf src/content
# Add the subrepo as a git submodule pinned to a SHA
git submodule add git@github.com:mathconcepts/project-vidhya-content.git modules/content
cd modules/content && git checkout <pinned-sha>
```

### Step 5 — Update `modules.yaml`

```yaml
modules:
  - name: content
    source: submodule:modules/content   # was: src/content
    pinned_sha: abc123def456
```

### Step 6 — Update imports

`src/api/content-lifecycle-routes.ts` imports from `modules/content`
instead of `src/content`. The orchestrator's path-resolver handles
both (src/ or modules/) transparently.

### Step 7 — Sync protocol

When the subrepo cuts a new release:

```bash
cd modules/content && git pull
git add modules/content        # bumps the pinned SHA
git commit -m "bump content to <new-sha>"
```

This is effectively the same model as [`content.pin`](./content.pin)
but formalised as a git submodule.

### Recommended split order

1. **`exams`** — smallest, most self-contained, clearest public
   interface (the ExamAdapter registry). Split first.
2. **`content`** — already scaffolded with `content.pin`; natural
   second split.
3. **`channels`** — independent enough, has per-channel licensing
   concerns that benefit from repo separation.
4. **`rendering` / frontend** — bigger effort, frontend builds need
   coordination with backend API SHA.

Not recommended for splitting: `core`, `learning`, `lifecycle`,
`orchestrator`. These are the product's core and stay atomic.

---

## Monetization model — exams as sellable assets

The user's note: *"each examination/syllabus can be monetizable asset"*.

Proposed implementation:

### Asset catalog

Every exam adapter declares a `monetization` block:

```yaml
# src/exams/adapters/bitsat-mathematics.meta.yaml
exam_id: EXM-BITSAT-MATH-SAMPLE
monetization:
  tier: free-sample           # free | paid-basic | paid-premium
  price_inr: 0                # or 499, 999, etc.
  bundle: bitsat-prep-2026    # grouping
  licensor: Project Vidhya
  revenue_share: null         # or { author: "...", percent: 20 } for community
```

### Bundle catalog

```yaml
# bundles.yaml (new)
bundles:
  - id: bitsat-prep-2026
    name: "BITSAT Preparation 2026"
    description: "Full BITSAT Math prep with mock tests"
    exams: [EXM-BITSAT-MATH-SAMPLE]
    tier: paid-basic
    price_inr: 999
    valid_until: 2026-07-01

  - id: bitsat-plus-jeemain-2026
    name: "Dual track — BITSAT + JEE Main"
    exams: [EXM-BITSAT-MATH-SAMPLE, EXM-JEEMAIN-MATH-SAMPLE]
    tier: paid-basic
    price_inr: 1499
    valid_until: 2026-07-01
```

### Entitlements

User → exam_id mapping in `.data/entitlements.json`:

```json
{
  "users": {
    "user_xyz": {
      "active_bundles": ["bitsat-prep-2026"],
      "expires_at": { "bitsat-prep-2026": "2026-07-01" }
    }
  }
}
```

Content-router checks entitlements before routing paid content.
Free tiers (`paid-basic`, `paid-premium`) are refused to users
without entitlements — router declines with *"this content requires
a [bundle] subscription — sign up at /billing"*.

**Not implemented in this commit** — payment rails (Stripe / Razorpay),
purchase UI, refund flow. The catalog + entitlements schema is
defined; the runtime is a follow-up.

---

## B2B institutional mode

The user's note: *"the other use case could be having the b2b window
where institutional users can be benefited"*.

### New role tier

Current role hierarchy (see `src/auth/middleware.ts`):

```
owner > admin > teacher > student
```

Proposed (new):

```
institution > owner > admin > teacher > student
```

**`institution` role** sits above `owner`. It represents the entity
(a school, a coaching centre) rather than a person. An institution
can:

- Provision owners (one per branch/campus)
- Set institution-wide policies (which exams, which channels, which
  monetization tiers are active)
- Run institution-wide reporting
- Pay the institution-level bill (not per-student)

### Tenant isolation

Every per-student store gets an `institution_id` column (flat-file
equivalent: nested keyed store). Queries scope to the current
institution. A student belonging to institution A cannot be seen by
institution B's owner.

### Shared content, isolated data

- Content (explainers, exams, GBrain algorithms) is **shared** across
  institutions — it's the asset.
- Student data is **isolated** — institution-scoped.
- Teacher rosters are **institution-scoped** — a teacher belongs to
  one institution.

### Migration path

Implementing B2B requires:

1. Schema migration to add `institution_id` to all per-user stores
2. New `institution` role in auth middleware
3. Orchestrator tier `institutional-b2b` that activates the above
4. Per-institution admin UI

**Not implemented in this commit** — documented as a tier in
`modules.yaml`, activation stubbed out (orchestrator knows about it;
the role itself is a future migration).

---

## 8 further use cases — identified from the notes + analysis

The user asked for further use cases. Here are 8 with honest
assessments of fit:

### 1. API-as-a-service

Expose Vidhya's intent-routing + content as a **paid API** for third-party
EdTech products. They send `{ intent, concept_id, user_context }`;
Vidhya returns a content result. Revenue from per-call pricing.

- **Fit:** strong; the router already has this shape.
- **Effort:** API key management + rate limiting + billing.

### 2. Language tier (Hindi / Tamil / regional)

Each language is a new content bundle (same adapter pattern). Router
resolves per user's language preference.

- **Fit:** natural extension of content subscriptions.
- **Effort:** authoring cost is the bottleneck, not code.

### 3. Accessibility tier

Screen-reader-optimised rendering, large-text, high-contrast mode,
text-to-speech for explainers. Activated per user or per institution.

- **Fit:** a new tier under rendering module.
- **Effort:** frontend work; backend already delivers accessible
  content structurally.

### 4. Content marketplace

Community authors publish bundles via the content repo; users
subscribe; revenue share. Already scaffolded by
[`CONTENT.md`](./CONTENT.md) + monetization model above.

- **Fit:** excellent; community-content-specialist manifest already exists.
- **Effort:** revenue-share mechanics + author verification.

### 5. Teacher-as-a-service

Independent teachers publish their own content + offer live tutoring
using Vidhya's surfaces. Each teacher is effectively a micro-tenant.

- **Fit:** leverages the institutional-b2b tier model.
- **Effort:** teacher onboarding flow + monetization.

### 6. Research tier

Opt-in, anonymised aggregate data as a research API for academic
researchers studying learning patterns. k-anonymity enforced per
`retention-specialist`'s existing rules.

- **Fit:** `telemetry-manager` already aggregates; expose via API
  with stricter gating.
- **Effort:** research-IRB documentation + API key management.

### 7. Parent / guardian view

Parents subscribe to a student's progress view — weekly digest,
no per-minute surveillance (Calm promise). Opt-in by student.

- **Fit:** a new role (`parent`) below student but with read-only scope.
- **Effort:** auth change + one new page.

### 8. Assessment tier — proctored exams

For institutions: deliver formal proctored exams via Vidhya. Would
need new infrastructure (webcam proctoring, lockdown browser).

- **Fit:** documented as a tier; activation requires a new
  `proctor` module not yet in scope.
- **Effort:** high; real-time monitoring infrastructure is substantial.

---

## This commit ships

- `MODULARISATION.md` (this file)
- `modules.yaml` — declarative module + tier + profile manifest
- `src/orchestrator/registry.ts` — reads modules.yaml
- `src/orchestrator/composer.ts` — profile → tier → module resolution
- `src/orchestrator/health.ts` — per-module health aggregation
- `src/api/orchestrator-routes.ts` — admin introspection routes
- Five admin endpoints proven end-to-end
- One new specialist added to the agent org: `orchestrator-specialist`

## What this commit does NOT ship (honest list)

- Actual GitHub subrepo splits — documented with step-by-step commands.
- Monetization runtime (Stripe / Razorpay wiring) — catalog shape defined.
- B2B institutional role — documented; adding the role is a separate migration.
- Manim / video rendering — documented as a future `animation` module.
- Proctored exam infrastructure — documented as a future tier.
- Parent / guardian view — documented; trivial role addition when needed.

Each of these has a clear migration path in the sections above. None
are papered over.
