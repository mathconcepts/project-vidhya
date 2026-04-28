# STUDIO — Content Studio

> The content-studio module: an admin-driven content authoring workflow with four generation sources, a draft → review → approve lifecycle, and a manual-trigger feedback loop from teaching observations. This doc is the contract: what gets generated how, where drafts live, who can do what, and how approved drafts become live library entries.

Read [LIBRARY.md](./LIBRARY.md) first if you haven't — the studio feeds the library, and the library is the served end of the cascade. Studio without library is a draft system with nowhere to publish.

---

## What this module is

A **creation workflow**. Three concrete things:

1. A `ContentDraft` schema with status (`draft | approved | rejected | archived`) and a generation audit trail
2. Four source adapters — uploads, Wolfram, URL-extract, LLM — that produce draft bodies, cascading in admin-chosen priority
3. A promotion path that ships approved drafts into the content library via the library's existing `addEntry` API

What the studio is **not**:

- Not the served content store (the library is)
- Not a moderation queue for runtime contributions (no such queue exists; the library's POST goes live immediately)
- Not a CMS — there's no rich editor, no media handling, no version diff
- Not a multi-tenant authoring tool — admin-only, single-process

The studio depends on the library; the library doesn't know about the studio. One-way dependency, no coupling for the library.

## The four sources

Each source is a clean adapter at `src/content-studio/sources/*.ts` following the same contract:

```ts
async (req: GenerationRequest, actor_id?: string) => AdapterResult | null
```

Returns `null` when the source has nothing to offer. The orchestrator walks `sources_to_try` in order; first non-null result wins; later sources are recorded as `'skipped'` for the audit trail.

| Source | What it does | When it returns null |
|---|---|---|
| `uploads` | Pulls extracted_text from previously-uploaded files tagged with concept_id (or a specific upload_id) | No matching uploads, or uploads have no `extracted_text` (unprocessed PDFs/images) |
| `wolfram` | Sends a math query to Wolfram Alpha; wraps the answer in markdown with reviewer notes | No `WOLFRAM_APP_ID`, query unrecognised, timeout (8s) |
| `url-extract` | Fetches admin-supplied URL, strips HTML, extracts main content. Bounded — single URL, no crawling, no allowlist | No URL provided, fetch fails, response > 5 MB, extracted < 100 chars, non-http(s) URL |
| `llm` | Last-resort generation via Gemini. Goes through the same rate-limit + budget-cap protections as chat | No `GEMINI_API_KEY`, rate-limited (5/hour for studio), per-user budget exceeded, empty response, SDK error |

### Cascade order (admin's choice)

The admin picks `sources_to_try` per request. Default in the UI: `uploads → wolfram → url-extract → llm`. Reasoning:

- **uploads** is free + highest fidelity if a relevant upload exists
- **wolfram** is verified-correct math, but produces concise output not pedagogical narrative
- **url-extract** is admin-curated (the admin chose the URL), heuristic extraction, brittleness acceptable because admin reviews
- **llm** is last-resort, lowest trust because the LLM has no source-of-truth

This isn't enforced — the admin can re-order or remove any source for a given generation. The default is what most concepts will use.

### URL-extract scope (deliberate)

The admin-supplied URL is fetched once. We do NOT crawl. We do NOT follow links. We do NOT have an allowlist (the admin is trusted to paste URLs they have rights to). The HTML is processed by hand-rolled regex extraction:

- Strip `<head>`, `<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<form>`, `<noscript>`, HTML comments
- Prefer `<article>` or `<main>` if present
- Convert block-level tags to newlines, headings to markdown-style
- Strip remaining tags
- Decode common HTML entities

Limits: 10s fetch timeout, 5 MB max response, 100k char max extracted text.

The extraction is intentionally brittle. Admins review every draft. A bad extraction gets rejected, not shipped to students. The trade-off: zero new dependencies (no jsdom, no readability) — vs richer extraction. Documented as a known follow-up; jsdom + readability is a ~30 MB dep we deliberately deferred.

### LLM source — production protections

Wired through the same rate-limit + budget-cap protections that the chat path uses:

- **Rate limit**: 5/hour per actor on `content-studio.llm` endpoint (separate bucket from chat)
- **Budget**: ~6000 token reservation (3k input + 3k output estimate); reconciled to actuals via `recordUsage` after the call
- **Cancel reservation**: on empty response or SDK error (no tokens consumed)

This means an admin running studio generation can't bypass the budget cap that the chat path is protecting. Both paths share the same per-user daily token cap.

If a deployment wants Anthropic / OpenAI instead of Gemini, that means either swapping `src/content-studio/sources/llm.ts` directly or routing through `src/llm/` (the bigger abstraction layer the runtime hot paths don't currently use). Today: Gemini-only.

## The schema

`ContentDraft` from `src/content-studio/types.ts`:

| Field | Type | Notes |
|---|---|---|
| `draft_id` | `'draft_' + 11 chars` | Stable identifier |
| `concept_id` | `string` | Will become library concept_id on approval |
| `title` | `string` | Will become library title on approval |
| `difficulty` | `'intro' \| 'intermediate' \| 'advanced'` | Same as library |
| `tags` | `string[]` | Same as library |
| `exams` | `string[]` | Same as library |
| `explainer_md` | `string` | Will become library `explainer_md` |
| `worked_example_md` | `string?` | Optional; same as library |
| `status` | `'draft' \| 'approved' \| 'rejected' \| 'archived'` | Lifecycle |
| `generation` | `{ request, used_source, attempts, generated_at, duration_ms }` | Audit trail |
| `edited_at`, `edited_by` | strings | Set by PATCH |
| `resolved_at`, `resolved_by` | strings | Set by approve/reject/archive |
| `promoted_as` | `string?` | Set on approval; library concept_id (usually equal to draft.concept_id) |
| `rejection_reason` | `string?` | Set on rejection |

The `generation.attempts` array is the full audit trail of which sources were tried, in what order, with what outcomes. Useful for debugging "why is the body empty?" — admin sees `uploads: empty (no uploads tagged with X), wolfram: errored (no key), llm: empty (rate-limited)` instead of a mystery.

## Persistence

Append-only JSONL at `.data/content-drafts.jsonl`. Same pattern as the teaching turn store and the content-library additions log.

Five event kinds:

| Event | When |
|---|---|
| `created` | Initial draft from `generateDraft()` |
| `edited` | Admin PATCHed body / title / tags / etc. |
| `approved` | Admin approved + library promotion succeeded |
| `rejected` | Admin rejected with a reason |
| `archived` | Superseded by a newer draft |

**Reconcile rule:** latest event for a `draft_id` wins. The full event history stays on disk as the audit trail; the in-memory view collapses to the current state. This is the *opposite* of teaching turns (earliest-wins, immutable history) — drafts are mutable lifecycle, turns are immutable history. Different needs, different invariants.

## API surface

Seven endpoints at `src/api/content-studio-routes.ts`. All admin-only.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/content-studio/generate` | Kick off generation for a concept |
| `GET` | `/api/content-studio/drafts` | List drafts, optional `?status=` and `?concept_id=` filters |
| `GET` | `/api/content-studio/draft/:id` | Full draft |
| `PATCH` | `/api/content-studio/draft/:id` | Edit body / title / tags / difficulty (only when `status='draft'`) |
| `POST` | `/api/content-studio/draft/:id/approve` | Promotes to library |
| `POST` | `/api/content-studio/draft/:id/reject` | Records rejection with reason |
| `GET` | `/api/content-studio/underperforming` | Manual GBrain feedback scan |

### Why admin-only across the board

Unlike the content library (public reads + admin/flagged-teacher writes), the studio is admin-only on every endpoint. Three reasons:

1. Drafts can contain unverified LLM output that shouldn't be browsable until reviewed
2. Generation costs LLM tokens — opening it broader creates a runaway-cost surface
3. There's no analogue to the `content_library.user_authoring` flag because no moderation flow exists for drafts

When moderation flow gets built, this constraint is the first thing to relax.

### POST /generate — input validation up front

Refuses bad input before invoking the orchestrator. Validates:

- `concept_id` is lowercase kebab-case (`/^[a-z0-9-]+$/`)
- `title` non-empty
- `difficulty` is one of the three values
- `sources_to_try` is non-empty array
- Each source kind is recognised
- `source_url` is a string (when present)

Always overrides actor identity with the authenticated admin's `user_id` — drives both the audit trail AND the rate-limit + budget attribution. Don't trust client-supplied actor.

### POST /approve — atomic promotion

Calls `addLibraryEntry` first. Library throws on bad concept_id slug or missing required fields. Studio's `approveDraft` propagates. Route returns 400. The studio log doesn't get an `'approved'` event in this path — the draft stays in `'draft'` status and the admin can fix it.

If `addLibraryEntry` succeeds, only THEN the `'approved'` event is appended. This means the library state and the studio state are always consistent: an approved draft has a corresponding library entry.

The library entry's `source` field is set based on the draft's `used_source`:

- `'llm'` → library `source: 'llm'`
- everything else (`'uploads'`, `'wolfram'`, `'url-extract'`, `null`) → library `source: 'user'`

Why null maps to `'user'`: a draft with `used_source: null` had no automated source produce content — meaning the admin wrote it by hand. That's user-contributed, not LLM-contributed.

The library entry's `licence` is set to `'studio-promoted'` so it's distinguishable from seed entries (`MIT`) and direct user adds (`'user-contributed'`). An admin reviewing the library can filter by licence to see what came through the studio review process vs runtime POST.

### GET /underperforming — the GBrain feedback hook

Manual-trigger scan over recent teaching turns. Per the option-b decision when this surface was scoped: keeping it manual avoids a job-scheduler dependency and gives operators control over when scans happen.

**Algorithm:**

1. Read recent turns (limit configurable, default 1000)
2. Filter to turns where `routed_source === 'library'`
3. Group by `pre_state.concept_id`
4. For each group with ≥ `min_turns` (default 5), compute average `mastery_delta.delta_pct`
5. Filter to those with avg below `threshold_pct` (default -2, meaning students getting worse on average)
6. Sort worst-first

**Query parameters:**

- `min_turns` — minimum turns required to consider a concept (default 5)
- `threshold_pct` — average mastery delta threshold (default -2)
- `limit` — max recent turns to scan (default 1000)

**Honest about the data:**

The teaching turn doesn't carry the `seed/user/llm` sub-source — only `routed_source: 'library'`. Admins viewing the result list can look up the concept in `/api/content-library/concept/:id` to see which sub-source it currently is.

The advisory text returned in the response is honest about what an empty result might mean: (a) content is performing well, (b) too few turns to measure, or (c) `mastery_delta` not populated on closed turns. The third happens when the gbrain student model isn't Postgres-backed and the delta computation never runs — a real condition in current deployments. Operators see this in the response and know what to fix.

## The admin UI

Lives at `/gate/admin/content-studio` in the React frontend. Three views in one tab-based page:

**Generate** — form to kick off generation. Inputs: concept_id (validated client-side), title, difficulty, tags, exams, sources to try (checkboxes), source URL (when url-extract selected), extra LLM prompt (when llm selected). On success, switches to Review with the new draft loaded.

**Drafts** — list of drafts filterable by status. Each card shows title + concept_id + status badge + used_source + first 200 chars of body + generated_at. Clicking opens Review.

**Review** — single-draft pane showing provenance card (source attempts, edit history, resolution), editable fields (title, explainer markdown, worked example, tags), and action buttons (Save edits / Approve & promote / Reject with reason).

The Drafts tab also surfaces an underperformers callout when `/api/content-studio/underperforming` returns non-zero results — top 5 concept_ids with their avg mastery delta and turn count, plus a guidance line pointing at regeneration.

The UI is intentionally minimal — no rich text editor, no markdown preview, no diff view between revisions. The textarea is the editor. Markdown renders only when the entry reaches the library and the rendering module picks it up. Keeps the UI focused on the lifecycle, not on a CMS that already exists in better forms elsewhere.

## What the studio doesn't do

Honest scope:

- **No rich text editor.** The textarea is the editor. Operators wanting WYSIWYG should pre-author elsewhere and paste markdown.
- **No markdown preview.** Approve, then visit `/api/content-library/concept/:id` to see the rendered result. A future version could add a side-by-side preview if the workflow becomes painful.
- **No diff view between revisions.** A draft only exposes its current state via the API; the JSONL log has full history but no UI traversal. If you need to undo an edit, edit again with the previous content (you'd need to have copied it first).
- **No bulk operations.** One concept at a time. Bulk import is a one-off script using `addLibraryEntry` directly.
- **No regenerate-from-parent.** To redo a generation, POST a fresh `/generate` with the same params. The original draft stays in the audit trail.
- **No archive → restore transition.** Once superseded, a draft stays archived. Re-generating with the same concept_id creates a new draft.
- **No approval queue with timed review window.** Approval is a single admin click. A team-of-multiple-admins deployment would want N-of-M approval; not built today.
- **No source previews.** The admin sees the result, not a preview of what each source would produce. Selecting `url-extract` then submitting is the only way to see what the URL extracts.
- **No frontend for the underperforming endpoint at the API call level** — the admin can't tweak `min_turns` / `threshold_pct` from the UI; the page uses the defaults. Curl with custom params if needed.
- **No write to the library outside the approval path.** The studio CANNOT write a draft direct-to-library bypassing the approval event. By design — the studio is the audit trail.

## How drafts and library entries connect

```
              ┌───────────────────────────────────────────────────┐
              │ src/content-studio/store.ts                       │
              │ ┌──────────────────────────────────────────────┐  │
              │ │ ContentDraft (status='draft')                │  │
              │ │   + generation.{used_source, attempts, ...}  │  │
              │ └─────────┬────────────────────────────────────┘  │
              │           │   approveDraft(draft_id, admin_id)    │
              │           │   1. calls addLibraryEntry            │
              │           │      (validation may throw → 400)     │
              │           │   2. on success, appends 'approved'   │
              │           │      event to .data/content-drafts.jsonl  │
              │           ▼                                          │
              │ ┌──────────────────────────────────────────────┐  │
              │ │ ContentDraft (status='approved')             │  │
              │ │   + promoted_as = concept_id                 │  │
              │ └──────────────────────────────────────────────┘  │
              └───────────────────────┬───────────────────────────┘
                                      │
                                      ▼
              ┌───────────────────────────────────────────────────┐
              │ src/content-library/store.ts                      │
              │ ┌──────────────────────────────────────────────┐  │
              │ │ LibraryEntry                                 │  │
              │ │   source = 'user' or 'llm'                   │  │
              │ │   licence = 'studio-promoted'                │  │
              │ │   added_by = approving admin's user_id       │  │
              │ │   appended to                                │  │
              │ │   .data/content-library-additions.jsonl      │  │
              │ └──────────────────────────────────────────────┘  │
              └───────────────────────┬───────────────────────────┘
                                      │
                                      ▼  served via cascade tier 3
              ┌───────────────────────────────────────────────────┐
              │ src/content/router.ts                             │
              │   library tier hits a chat / lesson request       │
              │   → routed_source: 'library'                      │
              │   → recorded on TeachingTurn                      │
              └───────────────────────┬───────────────────────────┘
                                      │
                                      ▼  observed via
              ┌───────────────────────────────────────────────────┐
              │ GET /api/content-studio/underperforming           │
              │   groups library-served turns by concept          │
              │   surfaces concepts with low avg mastery delta    │
              │   admin sees → POST /generate to regenerate       │
              └───────────────────────────────────────────────────┘
```

The full loop: studio creates → library serves → teaching observes → studio re-creates. This is what closes the feedback cycle the user asked for at the start of the studio work.

## Adding a new source adapter

Future operators wanting to add a source (Anthropic LLM, a different math service, a textbook scraper, etc.) follow this contract:

1. Create `src/content-studio/sources/<name>.ts` exporting:
   ```ts
   async function tryXxxSource(
     req: GenerationRequest,
     actor_id?: string,
   ): Promise<AdapterResult | null>
   ```
2. Add the source kind to `StudioSourceKind` in `src/content-studio/types.ts`
3. Add the dispatch case in the orchestrator's `for (const src of req.sources_to_try)` switch in `src/content-studio/store.ts`
4. Add the `source_empty_reason` case
5. If the source spends LLM tokens, route through `checkRateLimit` + `tryReserveTokens` / `recordUsage` / `cancelReservation` (mirror the pattern in `sources/llm.ts`)
6. Add the source to the UI's checkbox list in `frontend/src/pages/gate/ContentStudioPage.tsx`
7. Add a `sourceHelp(s)` case explaining what the source does

Total ~80 LOC for a new source plus ~3 LOC for UI registration.

## Persistence durability

Same as `src/lib/append-log.ts` everywhere it's used:

- Records are immutable — once a line is appended, it's never edited
- Order matters — later events describe what happened later
- Corrupt lines (e.g. a torn write at the tail) are skipped silently on read
- The append is single-line atomic (one `fs.appendFileSync`), so concurrent appends don't interleave

A multi-process deployment would need a different mechanism. Same caveat as the rest of `.data/`; documented in PRODUCTION.md.

## Where this doc fits

- [OVERVIEW.md](./OVERVIEW.md) — what Vidhya is and who for
- [DESIGN.md](./DESIGN.md) — why the architecture is shaped this way
- [ARCHITECTURE.md](./ARCHITECTURE.md) — modules + topology + data flow
- [LAYOUT.md](./LAYOUT.md) — file map
- [LIBRARY.md](./LIBRARY.md) — the content library's contract (read first)
- **STUDIO.md (this file)** — the content studio's contract
- [TEACHING.md](./TEACHING.md) — the teaching loop's contract (the underperforming endpoint reads from this loop)
- [PRODUCTION.md](./PRODUCTION.md) — production-readiness checklist (the LLM source's protections come from gaps documented here)
- [FOUNDER.md](./FOUNDER.md) — solo-founder runbook (no studio-specific section yet; could add one when content authoring becomes a daily founder task)

If a code change makes this doc inconsistent with the running system, the running system wins; this doc has a bug.
