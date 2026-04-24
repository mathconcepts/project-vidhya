# Content subsystem — architecture

> **Status:** canonical reference · last reviewed 2026-04-24
> **Relationship to other docs:**
> - [`agents/ORG-CHART.md`](./agents/ORG-CHART.md) — structural org
> - [`agents/CUSTOMER-LIFECYCLE.md`](./agents/CUSTOMER-LIFECYCLE.md) — dynamic lifecycle
> - [`EXAMS.md`](./EXAMS.md) — exam adapters that drive curriculum shape
> - [`agents/_shared/constitution.md`](./agents/_shared/constitution.md) — the four promises
> - **this file** — how content is sourced, stored, routed, and delivered

Content is the substance of Vidhya — every explainer a student reads,
every worked example they practise, every walkthrough a teacher shows.
This document is the **authoritative architecture** for how content
is acquired, verified, stored, routed, and delivered. It names which
agents own which layer, where new specialists were added, and how the
subsystem connects to the rest of the org.

---

## Content pipeline — the seven layers

```
  ┌─────────────────────────────────────────────────────────────────┐
  │ 7. DELIVERY           bundle ▸ IndexedDB ▸ server cache ▸ live │
  │    infrastructure-manager + cascade-tuner + bundle-builder     │
  └─────────────────────────────────────────────────────────────────┘
                                  ▲
  ┌─────────────────────────────────────────────────────────────────┐
  │ 6. ROUTING            intent → source selection → retrieve     │
  │    content-router (new) under teaching-manager                 │
  └─────────────────────────────────────────────────────────────────┘
                                  ▲
  ┌─────────────────────────────────────────────────────────────────┐
  │ 5. REPRESENTATION     concept DAG, concept ↔ content linkage  │
  │    curriculum-manager                                          │
  └─────────────────────────────────────────────────────────────────┘
                                  ▲
  ┌─────────────────────────────────────────────────────────────────┐
  │ 4. VERIFICATION       maths-correct, pedagogically sound, licensed │
  │    verification-manager + wolfram-verifier + concept-reviewer  │
  └─────────────────────────────────────────────────────────────────┘
                                  ▲
  ┌─────────────────────────────────────────────────────────────────┐
  │ 3. AUTHORING          LLM-drafted, human-reviewed explainers  │
  │    authoring-manager + explainer-writer                        │
  └─────────────────────────────────────────────────────────────────┘
                                  ▲
  ┌─────────────────────────────────────────────────────────────────┐
  │ 2. ACQUISITION        scraped / official / live / user / community │
  │    acquisition-manager + (three new specialists)               │
  └─────────────────────────────────────────────────────────────────┘
                                  ▲
  ┌─────────────────────────────────────────────────────────────────┐
  │ 1. SOURCES            where content originates                  │
  │    (external — not an agent, but the feed)                     │
  └─────────────────────────────────────────────────────────────────┘
```

Each layer is owned by a specific agent. Each layer's output is the
next layer's input. A content request from a student walks the stack
downward (routing → representation → verification → authoring →
acquisition → source), but the **creation** of content walks upward
(source → acquisition → authoring → verification → representation →
delivery).

---

## Layer 1 — Sources

Five categories of content can enter the system:

### 1a. Scraped open-licence sources

**Owner:** `acquisition-manager` + `scraper-operator` (existing)

OpenStax, MIT OpenCourseWare, past exam papers where licensing
permits, Stack Exchange (CC-BY-SA). Every source has its licence
terms checked by `licence-checker` before ingestion. Sources whose
terms change to non-permissive trigger retirement.

### 1b. Official sources

**Owner:** `acquisition-manager` (existing)

NCERT textbooks, official exam syllabi, government-published past
papers. Treated as authoritative for curriculum shape. Licensing
varies per source; `licence-checker` enforces.

### 1c. Wolfram Alpha (live + verified)

**Owner:** existing `wolfram-verifier` (for stored-content verification)
+ extended mandate for live queries routed through `content-router`

Used in two distinct modes:

- **Verification mode** — any stored worked example, numerical answer,
  or computed expression is submitted to Wolfram and checked against
  the source. Gates content before it reaches students.
- **Live-query mode** — when the student's intent requires a
  computation beyond stored content ("solve this integral",
  "factorise this polynomial"), `content-router` routes the request
  directly to Wolfram's API and returns the result inline. No storage,
  no caching — the answer is per-request.

### 1d. User uploads (new)

**Owner:** `upload-specialist` (new, under `acquisition-manager`)

A student snaps a photo of a textbook page, uploads a PDF of class
notes, or writes out a problem by hand. The upload is stored
**privately** (keyed by user_id, accessible only to that user) and
can be referenced by the router when the student asks a question
tied to the uploaded material.

**Constitutional constraints:**
- Uploads never leave the owner's account.
- Uploads are never mixed into cohort telemetry or community content.
- Uploads are never submitted to external APIs (LLM, Wolfram) without
  explicit per-request consent from the user.
- Uploads are deleted when the account is deleted
  (covered by `data-rights-specialist`'s hard-delete path).

### 1e. Community-contributed content (new)

**Owner:** `community-content-specialist` (new, under `acquisition-manager`)

The Vidhya content-repo proposal: content lives in a **separate
GitHub repository** (`mathconcepts/project-vidhya-content`), with
the main repo pinning a content version by commit SHA. Contributions
come as PRs to the content repo, not the code repo. This design is
detailed in the **"Content as a separate GitHub project"** section
below.

---

## Layer 2 — Acquisition

Transforms raw sources into structured records ready for verification.

```
  scraped page ────▶ scraper-operator   ──┐
  official doc ────▶ acquisition-manager ─┤
  Wolfram API ─────▶ wolfram-verifier    ─├──▶  verification-manager
  user upload ─────▶ upload-specialist   ─┤      (next layer)
  community PR ────▶ community-content   ─┘
                       -specialist
```

Each acquisition path produces a **content record** with a common
shape:

```ts
interface ContentRecord {
  id:            string;            // e.g. "CNT-openstax-calc-derivatives-01"
  concept_id:    string;            // the concept this attaches to
  kind:          'explainer' | 'worked-example' | 'walkthrough' | 'problem';
  source:        ContentSource;     // scraped | official | wolfram | user | community | generated
  source_ref:    string;            // URL, textbook+page, user_upload_id, community-repo SHA
  licence:       string;            // 'CC-BY-SA', 'CC-BY', 'user-private', 'community-mit', ...
  body:          string;            // the teachable content
  worked_steps?: string[];
  verified:      { by: string; at: string; confidence: number } | null;
  ingested_at:   string;
}
```

The `source` field is authoritative — every downstream surface
(verification, routing, delivery) reads it to know what's safe to do
with the content.

---

## Layer 3 — Authoring

**Owner:** `authoring-manager` + `explainer-writer` + `concept-reviewer`

Existing. For concepts where acquired content is absent, inadequate,
or needs rewrite, the authoring layer produces LLM-drafted explainers
that are then human-reviewed by `concept-reviewer`.

**New coupling with community content:** when a community contribution
lands in the content repo with an explainer for a concept that
`authoring-manager` previously generated, the authoring-manager can
**retire its generated version** in favour of the human-authored
community version — keeping the system biased toward human-curated
content.

---

## Layer 4 — Verification

**Owner:** `verification-manager` + `wolfram-verifier` + `sample-reviewer`

Existing. Gates every maths-bearing piece of content:

- **Wolfram verification** — numerical answers, symbolic expressions,
  computed integrals, solved equations. Disagreement with Wolfram
  blocks promotion to production content.
- **Sample review** — periodic random sampling of verified content
  for human re-check. Catches Wolfram-agreement-but-pedagogically-
  wrong cases.
- **Licence verification** — `licence-checker` confirms the source's
  licence still allows our use at verification time (not just at
  acquisition).

**New:** the `content-router` (layer 6) respects the `verified` field
on every record. Unverified content cannot be routed to production
surfaces unless the student has explicitly opted into a "preview" mode.

---

## Layer 5 — Representation

**Owner:** `curriculum-manager` (existing)

The concept DAG. Each verified content record attaches to one or
more `concept_id`s via the representation layer. Routing in layer 6
walks the concept graph (e.g. if BITSAT calculus content isn't
available, follow the DAG to find adjacent concepts whose content
covers the gap).

---

## Layer 6 — Routing — **the new core decision**

**Owner:** `content-router` (new specialist, under `teaching-manager`)

This is the new piece this design adds. Every student content
request passes through the router. Its job is **intent classification
plus source selection**.

### Intent classification

Student input falls into a small number of intents:

| Intent | Example | Route |
|---|---|---|
| `explain-concept` | "explain derivatives" | prefer stored explainer; fall back to generated |
| `walkthrough-problem` | "walk me through this integral" | prefer stored walkthrough; fall back to LLM |
| `verify-answer` | "is my answer 7π correct?" | Wolfram live |
| `solve-for-me` | "solve this equation" (with explicit opt-in) | Wolfram live + LLM explanation |
| `find-in-uploads` | "what did I upload about this topic?" | user's private uploads index |
| `practice-problem` | "give me a hard problem on limits" | problem-generator-specialist (existing) |

The classifier uses a small LLM call with a strict JSON schema. Fails
closed — ambiguous input routes to the most conservative option
(stored explainer).

### Source selection

Given `{ intent, concept_id, user_context }`, the router chooses a
source in this priority order:

```
  1. USER SUBSCRIPTIONS     user has explicitly subscribed to a content
                            bundle (e.g. "BITSAT-quality-2026"); prefer it
  2. SHIPPED BUNDLE         in the tier-0 bundle; free, fast, verified
  3. SERVER CACHE           recently fetched / generated; verified
  4. USER UPLOADS           if intent is find-in-uploads OR user has
                            tagged uploads relevant to concept_id
  5. COMMUNITY REPO         if the concept has a community-contributed
                            explainer pinned in the current content repo version
  6. LIVE GENERATION        LLM call via llm-router-manager
  7. WOLFRAM LIVE           for verify / solve / compute intents
  8. DECLINE + EXPLAIN      if none available, tell the student
                            honestly (constitutional honesty)
```

The router emits a `CONTENT_ROUTED` signal per decision containing
`{ chosen_source, alternatives_considered, rejected_because }`. This
signal flows to `telemetry-manager` for cohort analysis (opt-in,
k-anon as per existing rules).

### Source disclosure

Every returned content record carries its source disclosed to the
student. A card saying *"generated by LLM, unverified by Wolfram"*
is distinguishable from *"CC-BY-SA from OpenStax, Wolfram-verified"*.
Users can filter by source class in settings (e.g. "never show me
ungenerated content").

This honors the Calm promise (*"you study without confusion about
what you're reading"*) and the Strategy promise (*"you know how
confident to be about the answer"*).

---

## Layer 7 — Delivery

**Owner:** `infrastructure-manager` + `cascade-tuner` + `bundle-builder` (existing)

The four-tier cascade already shipped in `src/content/resolver.ts`:

```
  tier 0: process-resident bundle     (hot cache, ~50 concepts)
  tier 1: local filesystem cache      (~2000 concepts, compressed)
  tier 2: remote origin / generation  (catch-all)
```

Plus a planned browser-side tier:

```
  tier -1: IndexedDB in the student's browser
           (served offline; infrastructure-manager owns the schema)
```

The content-router sits above tier-0 and decides whether to ask the
cascade or to bypass it (e.g. for Wolfram live queries, which skip
the cascade entirely and return fresh).

---

## The three new specialists

### 1. `content-router` (under `teaching-manager`) — **new**

**Mission:** Classify student content intent and route to the best
available source, disclosing the source to the student in the response.

**Skills:**
- Parse a student's natural-language content request into a
  structured `{ intent, concept_id, modifiers }`.
- Walk the source priority list respecting user subscriptions,
  bundle availability, and verified status.
- Emit `CONTENT_ROUTED` signals capturing the decision.

**Owned tools:**
- `src/content/router.ts` — the routing module.
- `POST /api/student/content/request` — HTTP surface.

**Connections:**
- Upstream: `teaching-manager`
- Peers: `curriculum-manager` (concept graph), `wolfram-verifier`
  (live queries), `llm-router-manager` (generation fallback),
  `upload-specialist` (user uploads), `community-content-specialist`
  (community pulls)

### 2. `upload-specialist` (under `acquisition-manager`) — **new**

**Mission:** Ingest and index user-uploaded material (photos, PDFs,
handwritten notes) privately. Never mix with cohort data.

**Skills:**
- Store uploads under `.data/user-uploads/{user_id}/`.
- Extract text (OCR for images, PDF-text for PDFs) and index by
  concept where possible.
- Respect deletion on account-close (hard-delete path owned by
  `data-rights-specialist`).

**Owned tools:**
- `src/content/uploads.ts` — the upload handler.
- `POST /api/student/uploads` — HTTP upload endpoint.
- `GET /api/student/uploads` — list user's uploads.
- `DELETE /api/student/uploads/:id` — per-upload removal.

**Constitutional constraints:**
- Uploads are user-private; never in cohort telemetry.
- LLM or Wolfram calls on an upload require explicit per-request
  user consent.
- Uploads are deleted on hard-delete (chained through
  `data-rights-specialist`).

### 3. `community-content-specialist` (under `acquisition-manager`) — **new**

**Mission:** Manage the link between this repo and the separate
community content repo. Pull community-contributed content by
pinned SHA, register it with `content-router`, and surface user
subscriptions.

**Skills:**
- Read `content.pin` — the pinned commit SHA of the content repo.
- On build/deploy, sync the pinned version into `.data/community-content/`.
- Maintain per-user subscriptions in `.data/content-subscriptions.json`.
- Expose the content repo's manifest to `content-router` so user
  requests can be routed to community content.

**Owned tools:**
- `src/content/community.ts` — the sync + subscription layer.
- `GET /api/student/content/subscriptions` — user's current subscriptions.
- `POST /api/student/content/subscribe` — subscribe to a content bundle.

---

## Content as a separate GitHub project

**Recommendation:** yes, a separate content repo is the right design
for multi-user contribution. Here is the concrete proposal.

### Repository structure

```
  mathconcepts/project-vidhya          — the code repo (this one)
  mathconcepts/project-vidhya-content  — the content repo (proposed new)
```

Content repo layout:

```
  project-vidhya-content/
    ├── concepts/
    │   ├── calculus-derivatives/
    │   │   ├── explainer.md
    │   │   ├── worked-example-1.md
    │   │   └── meta.yaml            (concept_id, licence, contributor)
    │   ├── linear-algebra-eigenvalues/
    │   │   └── ...
    ├── bundles/
    │   ├── bitsat-quality-2026.yaml   (list of concept-content pairs)
    │   ├── jeemain-calc-core.yaml
    │   └── community-algebra.yaml
    ├── LICENCE-MANIFEST.md            (per-bundle licensing)
    └── VERSION                         (semver + SHA, cut on releases)
```

### Sync model — pinned SHA

The main repo includes a file `content.pin`:

```
# content.pin — which version of project-vidhya-content this
# deployment uses. Bumped manually by a maintainer after reviewing
# content-repo changes.
repo: mathconcepts/project-vidhya-content
sha: abc123def456...
pinned_at: 2026-04-24
```

On build (via a new `scripts/content-sync.ts`), the build script:
1. Reads `content.pin`
2. Clones or fetches the content repo at the pinned SHA
3. Copies `bundles/` and `concepts/` into `.data/community-content/`
4. Generates a manifest for `content-router` to consult

This gives two properties:
- **Atomic correctness**: main-repo code and content are aligned
  to known-good versions. A broken content update can't crash
  production until the maintainer bumps the pin.
- **Independent cadence**: content contributors PR to the content
  repo without touching code. Content repo can ship 20 bundles a
  week; main repo ships code on its own schedule.

### Contribution flow

1. A teacher spots a weak explainer on `calculus-derivatives`
2. They fork `project-vidhya-content`, edit `concepts/calculus-derivatives/explainer.md`, open a PR
3. The content repo's PR checks run: markdown syntax, Wolfram verify
   on any numerics, licence-file presence
4. A content-repo maintainer reviews and merges
5. When the content repo cuts a new VERSION, a main-repo maintainer
   bumps `content.pin` — deploys pull the new content on next build

### Per-user content routing

User subscriptions live in `.data/content-subscriptions.json`:

```json
{
  "users": {
    "user_xyz123": {
      "bundles": ["bitsat-quality-2026", "community-algebra"],
      "exclude_sources": ["generated"],
      "subscribed_at": "2026-04-24T02:30:00Z"
    }
  }
}
```

Routing behaviour:
- A user subscribed to `bitsat-quality-2026` → router prefers
  explainers from that bundle over the shipped default.
- A user with `exclude_sources: ["generated"]` → router never
  returns LLM-generated content, falling back to decline+explain
  if no human-authored content is available.

This is the "selected content / all content can be routed to a
particular Project Vidhya user" the brief asked for.

**Today's shipping status:** The subrepo has been **built** — see
[`modules/project-vidhya-content/`](./modules/project-vidhya-content/)
in this repo. It contains 3 seed concepts (derivatives, eigenvalues,
complex numbers) with explainers + worked examples, 2 bundle
manifests, its own `check.js` PR validator, GitHub Actions CI config,
README, CONTRIBUTING, and LICENSE.

Three `content.pin` modes are now supported:

| Mode | `sha:` value | Source of content |
|---|---|---|
| **stub** | `pending` | No community content; falls back to shipped default |
| **local** | `local` | Reads from `modules/project-vidhya-content/` in this repo |
| **live** | `<40-char SHA>` | Reads from `.data/community-content/` after content-sync clones the pinned GitHub SHA |

The pin is currently set to `local`, so the router serves community
content end-to-end today. Proven: subscribe to `bitsat-quality-2026`
→ ask *"explain derivatives"* → router returns the human-authored
explainer from `modules/project-vidhya-content/concepts/calculus-derivatives/explainer.md`
with `source: "subscription"`, `licence: "MIT"`, and appropriate
disclosure.

**When the operator is ready to go live:**

1. Create `github.com/mathconcepts/project-vidhya-content` (empty repo)
2. `git subtree push --prefix modules/project-vidhya-content/ <repo-url> main`
3. Bump `content.pin` — change `sha: local` to `sha: <commit-SHA>`
4. Run `npx tsx scripts/content-sync.ts` — clones the SHA to `.data/community-content/`
5. Deploy. Content now served from the real subrepo.

Community PRs thereafter go to the subrepo; a main-repo maintainer
bumps the pin at each release cadence.

---

## How content connects to the rest of the org

Content isn't a silo. Every customer-lifecycle stage (see
[`agents/CUSTOMER-LIFECYCLE.md`](./agents/CUSTOMER-LIFECYCLE.md))
touches content:

| Stage | Content role |
|---|---|
| 1. Awareness | `seo-manager` surfaces `authoring-manager`'s explainers as SEO articles |
| 2. Consideration | `outreach-manager`'s campaign URLs link to concept pages |
| 3. Trial | Demo users get the baseline shipped bundle, no subscriptions |
| 4. Activation | Student picks a concept → `content-router` delivers; first success is the activation moment |
| 5. Retain/Expand | `feedback-manager` signals weak explainers → `authoring-manager` rewrites or pulls community alternative |
| 6. Win-back/Offboard | Uploads are deleted on hard-delete (owned by `data-rights-specialist`) |

Content agents also connect vertically:

- `student-model-manager` reads `CONTENT_ROUTED` signals to
  understand what material a student consumes (for personalization).
- `feedback-manager` connects student ratings to specific content
  records, routing low-rated content back to `authoring-manager`.
- `retention-specialist` can correlate cohort disengagement with
  specific content bundles (*"cohorts using bundle X retain 2×
  better than baseline"*).

---

## GBrain integration

The cognitive spine (`src/gbrain/`) uses content in three ways:

### 1. Topic-mastery input

When a student completes a walkthrough from `content-router`, the
completion event carries `{ content_id, source, concept_id, outcome }`
to `attempt-insight-specialist`, which updates topic mastery in
GBrain. Source-aware — mastery built from Wolfram-verified content
carries higher confidence than mastery from user uploads.

### 2. Error-pattern clustering

`error-classifier` clusters student mistakes. Each cluster can be
traced back to the content that preceded it — helping
`authoring-manager` identify which explainer created the
misconception.

### 3. Problem generation

`problem-generator-specialist` consults `student-model-manager`
(mastery state) + `content-router` (available content) before
generating a practice problem. Respects user subscriptions.

See [`agents/_shared/gbrain-integration.md`](./agents/_shared/gbrain-integration.md)
for the full GBrain contract.

---

## Updated core-layer responsibility matrix

| Layer | Lead agent | Specialists involved | New in this design |
|---|---|---|---|
| 1. Sources | (external) | — | — |
| 2. Acquisition | `acquisition-manager` | `scraper-operator`, `licence-checker`, `upload-specialist`, `community-content-specialist` | **upload + community** |
| 3. Authoring | `authoring-manager` | `explainer-writer`, `concept-reviewer` | — |
| 4. Verification | `verification-manager` | `wolfram-verifier`, `sample-reviewer` | — |
| 5. Representation | `curriculum-manager` | — | — |
| 6. Routing | `teaching-manager` | `content-resolver` (existing tier-cascade), `content-router` (new) | **content-router** |
| 7. Delivery | `infrastructure-manager` | `bundle-builder`, `cascade-tuner` | — |

---

## Summary — what this commit ships

- **3 new specialists** added to the org: `content-router`,
  `upload-specialist`, `community-content-specialist`
- **`src/content/router.ts`** — intent classification + source
  selection
- **`src/content/uploads.ts`** — user-upload handler with privacy
  guarantees and account-close integration
- **`src/content/community.ts`** — community-repo sync (stub until
  the separate repo exists) + user subscription system
- **HTTP routes** for intent-based content requests, uploads, and
  subscriptions
- **`content.pin` file** + `scripts/content-sync.ts` scaffold for
  when the content repo gets created
- **This document** as the authoritative reference

Total agent count: 52 → 55.
