# LIBRARY — The Content Library

> The content-library module: a runtime-augmentable, DB-free store of teaching materials keyed by concept_id. Built-in starter content ships with the codebase; new entries can be added at runtime by admins or LLMs without committing to git. This doc is the *contract*: what an entry is, where entries come from, where the library sits in the routing cascade, and how to extend it. Read [ARCHITECTURE.md](./ARCHITECTURE.md) first for the modules; this is one layer deeper.

---

## What this module is

The content-library is a **passive data store**. It owns three things:

1. The `LibraryEntry` schema — a runtime-augmentable record with explainer + worked example bodies, difficulty, tags, exam relevance.
2. Two-source persistence — committed seeds + append-only runtime additions, both DB-free.
3. An in-memory index built at boot, with O(1) lookup by `concept_id`.

What the content-library is **not**:

- It does not generate content. Generation is the LLM's job, in the `generated` cascade tier.
- It does not decide *which* content to show a student. That's the gbrain task-reasoner.
- It does not own content routing. The router (`src/content/router.ts`) consults the library as one of several tiers.
- It is not a sub-repo. The community sub-repo at `modules/project-vidhya-content/` is a separate surface for git-committed external contributions; the library is for runtime-augmentable content shipped with the deployment.

This separation matters because gbrain owns the cognitive layer (mastery, motivation, error patterns) and shouldn't also own content. The two are clean today; coupling them would make either harder to swap.

## The two sources

```
                ┌─────────────────────────────────────────────┐
                │                                             │
                │  data/content-library/seed/                 │
                │  ├── calculus-derivatives/                  │  ←  ships with repo
                │  │   ├── meta.yaml                          │     read-only
                │  │   ├── explainer.md                       │     committed in git
                │  │   └── worked-example.md                  │
                │  ├── complex-numbers/                       │
                │  └── linear-algebra-eigenvalues/            │
                │                                             │
                └─────────────────────┬───────────────────────┘
                                      │  parsed at boot
                                      ▼
                ┌─────────────────────────────────────────────┐
                │                                             │
                │  Map<concept_id, LibraryEntry>              │  ←  in-memory index
                │  built at boot                              │     few MB
                │  O(1) lookup                                │
                │                                             │
                └─────────────────────▲───────────────────────┘
                                      │  appended at runtime
                                      │
                ┌─────────────────────┴───────────────────────┐
                │                                             │
                │  .data/content-library-additions.jsonl      │  ←  per-deployment
                │  one JSONL line per addEntry call           │     survives restarts
                │  source: 'user' or 'llm'                    │     on writable disk
                │                                             │
                └─────────────────────────────────────────────┘
```

**Seed** entries are committed in `data/content-library/seed/` and ship with the codebase. A fresh deployment has 3 starter concepts on day one (calculus-derivatives, complex-numbers, linear-algebra-eigenvalues — copied from the community sub-repo). Operators add more by dropping new directories in this folder and committing.

**Additions** are appended at runtime via `POST /api/content-library/concept`. Each call writes one JSONL line to `.data/content-library-additions.jsonl`. Survives restarts on a writable disk. Lost on ephemeral filesystems (the same caveat as the rest of `.data/`).

**Merge rule:** additions override seeds when both have the same `concept_id`. Within additions, last-write-wins (the JSONL log is append-only but the index keeps the latest record per concept). This is the *opposite* of the teaching-turn store, which is earliest-wins to preserve audit trail. Library entries are mutable knowledge; turns are immutable history.

## The LibraryEntry schema

Defined in [`src/content-library/types.ts`](./src/content-library/types.ts). Public re-export at [`src/modules/content-library/index.ts`](./src/modules/content-library/index.ts).

| Field | Type | Notes |
|---|---|---|
| `concept_id` | `string` | kebab-case unique key, e.g. `derivatives-intro` |
| `title` | `string` | display string |
| `difficulty` | `'intro' \| 'intermediate' \| 'advanced'` | matches existing meta.yaml vocab |
| `tags` | `string[]` | free-text, used for filtering |
| `exams` | `string[]` | exam IDs this is relevant to (empty = exam-agnostic) |
| `prereqs` | `string[]?` | optional concept_ids the student should know first |
| `explainer_md` | `string` | required main body |
| `worked_example_md` | `string?` | optional but encouraged |
| `source` | `'seed' \| 'user' \| 'llm'` | where this entry came from |
| `added_at` | `string` | ISO 8601 |
| `added_by` | `string` | user_id, `'system'`, or `'llm:<provider> (via <admin-id>)'` |
| `licence` | `string` | SPDX-style or `'shipped-default'` / `'user-contributed'` |
| `wolfram_checkable` | `boolean` | whether this concept is amenable to Wolfram cross-checking |

For multiple difficulty levels of the same concept, give them different `concept_id`s (e.g. `derivatives-intro` vs `derivatives-advanced`). This keeps lookup O(1) and avoids the "which one for this student?" question becoming a ranking problem.

## The seed format

Each seed lives in `data/content-library/seed/<concept_id>/` with three files:

```
<concept_id>/
├── meta.yaml          required — concept metadata (see schema below)
├── explainer.md       required — main explainer body
└── worked-example.md  optional — worked example body
```

`meta.yaml` schema:

```yaml
concept_id: derivatives-intro          # must match the directory name
title: Derivatives                     # human-readable title
licence: MIT                           # SPDX-style identifier
contributor: Project Vidhya Seed       # who wrote it
contributor_github: project-vidhya     # optional
reviewed_at: 2026-04-24                # ISO date of last review
difficulty: intermediate               # intro | intermediate | advanced
derived_from: null                     # if a derivative work, link to source
wolfram_checkable: true                # whether amenable to Wolfram check
tags:                                  # free-text list, used for filtering
  - calculus
  - derivatives
exams:                                 # which exams this concept maps to
  - EXM-BITSAT-MATH-SAMPLE
prereqs:                               # optional, list of concept_ids
  - limits
```

Validation at boot: `meta.yaml` must parse, `concept_id` must match the directory name, `explainer.md` must exist. If any fail, the entry is skipped with an error logged; the rest of the library still loads. This is deliberately lenient — a single broken seed shouldn't keep the library from loading.

## API surface

Three endpoints at [`src/api/content-library-routes.ts`](./src/api/content-library-routes.ts).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/content-library/concepts` | public | List summaries (concept_id + title + difficulty + source) |
| `GET` | `/api/content-library/concept/:id` | public | Full LibraryEntry |
| `POST` | `/api/content-library/concept` | admin (or teacher+ when flag) | Add a new entry |

### Why reads are public

The library is a content store, not personal data. A prospective user browsing the demo URL should see what's available before signing in. Matches the existing public surfaces (blog, landing pages).

### Why writes are admin-only by default

There's no moderation flow yet. Opening writes broadly creates a moderation problem we haven't solved. The audit trail (`added_by`) needs a real identity; admin is the only role we trust without further infrastructure.

### The `content_library.user_authoring` feature flag

Off by default. Flip on to allow teacher+ roles (not just admin) to POST entries.

```bash
VIDHYA_CONTENT_LIBRARY_USER_AUTHORING=on
```

Read once at boot; restart required to flip. Surfaced in `/api/orchestrator/features`. When on, teacher gets 201 on POST; student stays 403 (the flag broadens to teacher+, not all).

When you'd flip this on: a deployment with a known set of trusted contributors and an out-of-band trust model (e.g. a school where the IT admin has vetted teachers).

When you'd leave it off: any deployment without an out-of-band moderation flow.

### POST request shape

```json
{
  "concept_id": "integration-by-parts",
  "title": "Integration by Parts",
  "difficulty": "intermediate",
  "tags": ["calculus", "integration"],
  "exams": ["EXM-JEEMAIN-MATH-SAMPLE"],
  "explainer_md": "# Integration by parts\n\n$\\int u\\,dv = uv - \\int v\\,du$",
  "worked_example_md": "Find $\\int x\\cos x\\,dx$...",
  "source": "user"   // or "llm" with an llm_provider field
}
```

The handler always overrides `added_by` with the actor's id — clients cannot spoof identity. For `source: 'llm'` requests, the optional `llm_provider` field annotates `added_by` as `llm:<provider> (via <admin-id>)`, so the audit trail records both the LLM provider and the human admin who wired it up.

`source: 'seed'` is rejected at the API layer — seeds come from disk at boot, not from POSTs.

## Where the library sits in the routing cascade

The content router at [`src/content/router.ts`](./src/content/router.ts) consults the library as the second tier:

```
1. uploads / wolfram (intent-specific early routes)
2. subscription      ← user-explicit subscriptions win
3. library           ← THIS MODULE
4. bundle            ← legacy shipped content-bundle.json
5. community         ← unsubscribed community repos
6. generated         ← LLM live generation
7. declined          ← intentional no-content-served
```

When the router receives a `concept_id`, it calls `getEntry(concept_id)`. If found, it returns immediately with `source: 'library'` and `source_ref: library:<seed|user|llm>:<concept_id>`. If not found, the cascade continues to the legacy bundle.

### The intent → body selection

For `practice-problem` and `walkthrough-problem` intents, the library prefers the `worked_example_md` body (when present) — these intents want a problem to work, not a treatise. For all other intents (`explain-concept`, etc.), it returns the `explainer_md`. The disclosure text reflects the choice:

```
explain intent → "From the built-in content library — explainer (MIT)."
practice intent → "From the built-in content library — worked example (MIT)."
```

If a seed has no `worked_example_md` and the intent wants one, the library falls back to the explainer rather than declining — having something is better than having nothing.

### Disclosure varies by source

```
seed:  "From the built-in content library — explainer (MIT)."
user:  "From the content library, user-contributed — explainer (user-contributed)."
llm:   "From the content library, llm-contributed — explainer (user-contributed)."
```

Students see the disclosure; it builds trust in the right way (built-in content is implicitly more trusted than user-contributed; LLM-contributed is explicitly flagged).

### Personalisation hints — forward-looking scaffolding

`RouteRequest` has two optional fields the caller can supply:

```ts
{
  preferred_difficulty?: 'intro' | 'intermediate' | 'advanced';
  preferred_exam_id?:    string;
}
```

Today these are forward-looking scaffolding. The cascade does exact-match by `concept_id`, so the hints don't change behaviour. They'll matter when the library starts having multiple entries per concept (e.g. `derivatives-intro` + `derivatives-advanced`) — the router would then call `findEntries()` instead of `getEntry()` and rank using these hints.

The caller computes them from the gbrain student model:

```ts
import { masteryToDifficulty } from '../modules/content-library';
const mastery = studentModel.mastery_vector[concept_id]?.score ?? 0;
const preferred_difficulty = masteryToDifficulty(mastery);
const preferred_exam_id = studentModel.user.exam_id;
```

The thresholds in `masteryToDifficulty`:

| Mastery | Difficulty band |
|---|---|
| `[0, 0.3)` | intro |
| `[0.3, 0.7)` | intermediate |
| `[0.7, 1]` | advanced |

These are pedagogical heuristics, not measured. Tunable.

## Adding content

### Three workflows

**1. Ship a new seed concept (operator path).**

Drop a new directory in `data/content-library/seed/`:

```
data/content-library/seed/
├── derivatives-intro/
│   ├── meta.yaml
│   ├── explainer.md
│   └── worked-example.md
```

Commit. Next deployment picks it up at boot. No migration. No DB schema change. No restart needed for an existing process — but if you want immediate visibility on a running process, a restart is the simplest path.

**2. Add at runtime as an admin (UI / curl).**

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @new-concept.json \
  https://your-deployment/api/content-library/concept
```

Persists to `.data/content-library-additions.jsonl`. Available immediately on the running process; survives restarts on a writable disk.

**3. Wire an LLM (admin runs a script).**

Outside the codebase: the admin runs a script that calls Anthropic / OpenAI / etc. with a prompt like "write a JEE-Main-level explainer for X." The script then POSTs the result to the library:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "concept_id": "chain-rule",
    "title": "Chain Rule",
    "difficulty": "intermediate",
    "tags": ["calculus"],
    "explainer_md": "...",
    "source": "llm",
    "llm_provider": "claude-opus-4"
  }' \
  https://your-deployment/api/content-library/concept
```

The handler annotates `added_by` as `llm:claude-opus-4 (via <admin-id>)` so the audit trail records both. There's no separate "LLM auth" path — LLMs are wired via admin running a script.

### Validation at runtime

The handler enforces:

- `concept_id` must be lowercase kebab-case (`a-z 0-9 -` only)
- `title`, `explainer_md`, `added_by` must be non-empty
- `source` must be `'user'` or `'llm'` (`'seed'` is rejected as reserved)
- `difficulty` defaults to `'intermediate'` if absent or unrecognised
- `tags` and `exams` default to empty arrays if absent

A failure returns 400 with a clear message.

## What the library doesn't do

Honest scope:

- **No content versioning.** Re-POSTing the same `concept_id` silently overrides. The previous version stays in the JSONL log (history is preserved on disk) but the in-memory index only holds the latest. A version-aware lookup would need a separate API.
- **No moderation queue.** Once a POST returns 201, the entry is live. A real-world deployment would need review queues; this is a starter design.
- **No bulk import endpoint.** Adding 100 entries means 100 POSTs. For a curated dump, a one-off script using `addEntry()` directly is cleaner than HTTP.
- **No vector / embedding lookup.** Lookup is exact match on `concept_id`; filters are exact match on tags/exams/difficulty. Fuzzy match by description is a Tier-1 (RAG) feature that already exists in the resolver and could be plumbed into the library separately.
- **No rate limiting.** An admin could in principle add millions of entries, growing the in-memory index unbounded. Acceptable given admin is trusted; documented as a follow-up.
- **No deletion endpoint.** To remove an entry, an operator manually edits `.data/content-library-additions.jsonl` and restarts. A delete API would interact with the override semantics in non-obvious ways (does deleting an addition restore the seed it shadowed?).
- **No content rendering.** The library returns markdown bodies; the rendering module turns them into HTML/PDF. Library doesn't know what consumers will do with the body.

## The library and the teaching loop

Library hits are observable via the [TeachingTurn](./TEACHING.md) record. When the router returns `source: 'library'`, the teaching loop's instrumentation records it on the turn's `routed_source` field. Admin firehose at `/api/turns` shows which library entries are getting served, which lets operators answer "is the user-contributed content actually being read?" without a separate analytics layer.

The seed-vs-user-vs-llm distinction is preserved through `source_ref` (e.g. `library:user:integration-by-parts`), so a turn can be filtered by where the content came from.

## Persistence durability

The seed dir is committed in source control — same durability as the rest of the repo.

The additions JSONL has the same properties as `src/lib/append-log.ts` everywhere it's used:

- Records are immutable — once a line is appended, it's never edited
- Order matters — later records describe what happened later
- Corrupt lines (e.g. a torn write at the tail) are skipped silently on read
- The append is single-line atomic (one `fs.appendFileSync`), so concurrent appends don't interleave

A multi-process deployment would need a different mechanism. Same caveat as `flat-file-store`; documented in DESIGN.md.

## Scaling

Linear-scan listing — fine up to ~10k concepts. Beyond that, the in-memory Map still works but `listSummaries()` becomes slow and `findEntries({tags:[...]})` even more so.

The obvious follow-up is sharding the additions log by month, and adding a lightweight indexed query helper. Not implemented today; the deployment scale doesn't need it yet.

## Where this doc fits

- [OVERVIEW.md](./OVERVIEW.md) — what Vidhya is and who for
- [DESIGN.md](./DESIGN.md) — why the architecture is shaped this way
- [ARCHITECTURE.md](./ARCHITECTURE.md) — modules + topology + data flow
- [LAYOUT.md](./LAYOUT.md) — file map
- [AUTH.md](./AUTH.md) — auth module surface
- [TEACHING.md](./TEACHING.md) — the teaching loop's contract
- **LIBRARY.md (this file)** — the content library's contract

If a code change makes this doc inconsistent with the running system, the running system wins; this doc has a bug.
