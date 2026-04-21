# Exam Framework

**Status:** v2.9.7
**Scope:** A dynamic exam registry that lets admins add new exams with minimal effort — provide basic identity, and the system helps fill the rest through automated enrichment, local data uploads, or conversational guidance. Every field is optional. Admins can refine exam profiles progressively as information becomes available.

---

## 1. Why this framework exists

Before v2.9.7, Vidhya shipped with a **static catalog** of 5 exams (`src/syllabus/exam-catalog.ts`) defined in code. Adding a new exam required a developer to edit source files, match the exam's topics to the concept graph by hand, and redeploy.

The v2.9.7 framework introduces a **dynamic registry** stored in `.data/exams.json` that admins can manage from `/exams` without any code changes. Each new exam:

- Gets a **unique ID** (`EXM-<CODE>-<BASE36-TIMESTAMP>`) that's stable across edits and reusable for any number of students
- Starts from a **minimal seed** (code + name + level — 3 required fields, everything else optional)
- Can be **progressively enriched** through four trust-ranked mechanisms
- Is marked **draft** until the admin explicitly marks it ready for students

The static catalog still ships as fallback / built-in exams. The dynamic registry layers on top.

---

## 2. The admin flow

**Step 1: Create.** Admin clicks `New exam`, fills in 3 required fields (code, name, level), optionally adds hints (country, issuing body, seed text). Exam is created in draft state. Unique ID generated.

**Step 2: Enrich.** Admin has four non-exclusive options:

1. **Auto-enrich from web** — one click. An LLM researches the exam (grounded in any local data the admin uploaded) and proposes a complete profile. Admin reviews and applies.
2. **Upload local data** — paste the official syllabus, prep-guide text, or any authoritative material. This becomes the primary source for enrichment, overriding web research.
3. **Edit manually** — open the `Fields` tab and fill anything directly.
4. **Talk to the assistant** — a conversational helper that walks the admin through what's missing and recommends the highest-leverage next action.

**Step 3: Mark ready.** When the admin is satisfied (typically ≥ 40% complete), they mark the exam ready. It becomes assignable to students.

**Step 4: Refine later.** Exam profiles are never "done." Admins come back as the official syllabus updates, as local data arrives, or as the admin learns more. Every edit updates the `provenance` map and completeness score.

---

## 3. Trust ranking — who edited what

Every filled field carries metadata:

```typescript
{
  source: 'admin_manual' | 'user_upload' | 'web_research' | 'default' | 'none',
  filled_at: '2026-04-21T14:22:00Z',
  confidence?: 0.85,    // 0..1 for web_research
  notes?: 'Filled from LLM; grounded in 2 uploaded documents',
}
```

**Critical invariant:** when enrichment runs, it **never overwrites `admin_manual` or `user_upload` fields**. The admin's explicit entries are sacred. Only `web_research`, `default`, or unset fields can be updated by re-enrichment.

When an admin edits a web-researched field, its source flips to `admin_manual` automatically. This means re-running enrichment is always safe — nothing the admin has touched will be changed.

In the UI, every field shows a small provenance chip:
- 🟢 `manual` — admin typed it
- 🔵 `upload` — extracted from admin-uploaded local data
- 🟡 `web 75%` — from LLM research with confidence
- ⚪ `empty` — not yet filled

---

## 4. The exam data model

```typescript
interface Exam {
  id: string;              // EXM-<CODE>-<BASE36-TIMESTAMP>
  code: string;            // admin-defined short code (e.g. "GATE-CS-2027")
  name: string;            // full human-readable name
  level: 'undergraduate' | 'postgraduate' | 'professional' | ...;

  // optional — all progressively fillable
  country?: string;
  issuing_body?: string;
  official_url?: string;
  description?: string;

  duration_minutes?: number;
  total_marks?: number;
  sections?: ExamSection[];
  marking_scheme?: MarkingScheme;
  question_types?: QuestionTypeMix;

  syllabus?: SyllabusTopic[];
  topic_weights?: Record<string, number>;

  next_attempt_date?: string;
  frequency?: 'annual' | 'biannual' | ...;
  typical_prep_weeks?: number;
  eligibility?: string;

  local_data: LocalDataEntry[];
  provenance: ProvenanceMap;
  completeness: number;    // auto-computed, 0..1
  is_draft: boolean;
  is_archived: boolean;
}
```

Completeness is computed from 14 weighted fields across 5 categories (Basics / Structure / Content / Schedule / Eligibility). The exact weights live in `types.ts` and can be tuned as the system matures.

---

## 5. HTTP endpoints

```
POST   /api/exams                          Create exam (admin)
GET    /api/exams                          List (admin)
GET    /api/exams/assignable               List ready exams (teacher+)
GET    /api/exams/:id                      Full exam + breakdown + suggestions
PATCH  /api/exams/:id                      Update fields (source=admin_manual)

POST   /api/exams/:id/enrich               Preview enrichment proposal
POST   /api/exams/:id/enrich/apply         Apply a proposal

POST   /api/exams/:id/local-data           Add local data entry
DELETE /api/exams/:id/local-data/:ldid     Remove local data entry

POST   /api/exams/:id/mark-ready           Move draft → ready
POST   /api/exams/:id/archive              Archive (reversible)
DELETE /api/exams/:id                      Permanent delete (owner only)

POST   /api/exams/:id/assistant            Conversational assistant turn
```

---

## 6. Enrichment architecture

**File:** `src/exams/exam-enrichment.ts`

The enrichment layer is **LLM-optional**. It detects which provider has an API key at runtime:

1. `GEMINI_API_KEY` → Gemini 2.0 Flash Lite (cheapest, fastest)
2. `ANTHROPIC_API_KEY` → Claude 3.5 Haiku
3. `OPENAI_API_KEY` → GPT-4o Mini

If none is configured, enrichment returns a graceful `"enrichment disabled"` response — the admin can still use the framework, they just fill fields manually.

The LLM prompt:

- Includes any `local_data` the admin uploaded as **authoritative context**
- Instructs the LLM to **prefer local data over general knowledge**
- Requires structured JSON output (response_mime_type enforced where available)
- Asks the LLM to **OMIT uncertain fields rather than guess** — missing is better than wrong
- Gets per-field confidence scores

The response is then **conservatively merged** — `admin_manual` fields are never touched; only empty or previously-web-researched fields get updated. The admin always gets a preview before anything is persisted.

---

## 7. The assistant

**File:** `src/exams/exam-assistant.ts`

A stateless conversational helper. Three modes:

- **`open`** — first contact. Greets, reports completeness %, recommends the next highest-leverage action
- **`reply`** — interprets admin's free-text message (intent classification without an LLM: regex patterns for "auto-enrich" / "upload" / "ready" / "what's next")
- **`tip`** — "what should I do next?" — returns prioritized suggestions grounded in `suggestNextFields()`

The assistant **never hallucinates exam content**. When the admin says "what's the syllabus for GATE CS?", the assistant responds "I can research that for you — want me to run auto-enrich?" rather than fabricating details.

Quick-reply suggestions appear as tappable chips that pre-fill the next message, reducing friction on mobile.

---

## 8. Local data handling

Local data entries are append-only text blobs with provenance. An admin can:

- Paste the official syllabus
- Paste a prep-guide chapter
- Paste URL content (copied manually — we don't auto-fetch URLs since that's a security concern)
- Paste past-paper text

Each entry has: `id`, `kind` (text/url/file_extract), `title`, `content` (up to 100K chars), `uploaded_at`, `uploaded_by`.

Content is included verbatim in the enrichment LLM prompt (up to 4K chars per entry to avoid context overflow). The LLM is explicitly told this is authoritative.

Local data does not affect the completeness score directly — it's a **fuel for enrichment**, not a field in the exam itself.

---

## 9. Adapting later

Every aspect of this framework is designed for partial information:

- **Required fields are 3** (code, name, level). Everything else optional.
- **Completeness is a gradient**, not a pass/fail. A 25% exam is usable, just less tailored.
- **Draft state is persistent.** An exam can remain in draft for weeks while the admin slowly fills it.
- **Re-enrichment is idempotent.** Run it again anytime — it will only fill gaps.
- **Manual edits lock fields** against future enrichment overwrites.
- **Archive, don't delete.** Exams go into `is_archived: true` rather than being deleted; history is preserved.

The design assumption: **admins rarely have full information at exam-creation time**. They have the name and a rough sense. Over days or weeks, they add more. The framework rewards this pattern — it never pushes them to "finish" before they're ready.

---

## 10. Multi-student reuse

The unique Exam ID is the join key. A single exam profile can serve an unlimited number of students:

```
Exam: EXM-GATECS2027-MO8JEJYV
  ↓ assigned to
  ├── student_123 (user.exam_id = "EXM-GATECS2027-MO8JEJYV")
  ├── student_456 (user.exam_id = "EXM-GATECS2027-MO8JEJYV")
  ├── student_789 (user.exam_id = "EXM-GATECS2027-MO8JEJYV")
  └── ...
```

When the admin edits the exam's syllabus or marking scheme, **every assigned student immediately sees the updated information** on their next page load. There's no per-student duplication, no stale copies.

This matters for coaching institutes: an admin sets up `GATE-CS-2027` once, then assigns 50 students to it in bulk via `/admin/users`. One edit updates the experience for all 50.

---

## 11. Integration with the rest of Vidhya

The exam framework currently exposes read-only endpoints. Integration points for future work:

- **Priority engine** should consult `exam.topic_weights` to calibrate concept prioritization per student
- **Mock-exam generator** should use `exam.duration_minutes`, `exam.marking_scheme`, `exam.question_types` to produce realistic mocks
- **Smart Notebook** should use `exam.syllabus` instead of the static concept graph when a student has `exam_id` assigned
- **Compounding mastery** insights include per-exam context ("X days to GATE-CS") — **shipped in v2.9.8**
- **Teaching brief** should surface `exam.next_attempt_date` for cohorts prepping together
- **Countdown prompts** on student home when `exam.next_attempt_date` is set — **shipped in v2.9.8**

These are one-line integration points — the framework exposes all necessary data; consumers opt in when they need it. Following the GBrain Integration Bridge pattern from v2.9.0.

---

## 11b. Exam comparison (v2.9.8)

**File:** `src/exams/exam-comparison.ts`

Two exams can be compared pairwise to produce a structured diff across four categories:

| Category | Weight | What it measures |
|----------|:------:|------------------|
| Identity | 20% | level, country, issuing_body |
| Structure | 25% | duration, total marks, marking scheme, question-type mix |
| Content | 40% | Jaccard similarity on syllabus topics + weight deltas on shared topics |
| Schedule | 15% | frequency, typical prep weeks |

Categories with no data in either exam are excluded from the weighted average (rather than dragging the score down). The overall similarity is a 0..1 score; a human-readable `recommendation` string summarizes.

Comparison operates on a `CanonicalExam` shape that adapts both the dynamic `Exam` and the static `ExamDefinition` — so cross-comparison between a dynamically-created exam and a built-in one works uniformly.

---

## 11c. Nearest-match finder (v2.9.8)

**File:** `src/exams/exam-similarity.ts`

Three functions:

- `findNearestMatches(target, k=5)` — ranks all other exams (dynamic + static) by similarity to the target. Used by the admin UI "Similar exams" panel on each exam's detail page.
- `findSimilarByIdentity(seed, k=3)` — lightweight pre-create check. Before the admin commits a new exam, this checks name similarity + identity overlap against existing exams and surfaces potential duplicates in the creation modal. The admin can still proceed — it's a nudge, not a block.
- `findMoreCompleteMatch(target, minSimilarity=0.4)` — given a target that's ≥40% similar but more complete, returns it as a fallback source. Used by the personalization bridge to fill sparse exams.

---

## 11d. GBrain personalization bridge (v2.9.8)

**File:** `src/gbrain/exam-context.ts`

When a student has `exam_id` assigned, this bridge hydrates an `ExamContext` that carries:

- `topic_weights` — used to boost concept priority
- `syllabus_topic_ids` — the scoped universe of relevant topics
- `marking_scheme` + `question_types` + `duration_minutes` — structural knobs for problem generation and mock exams
- `days_to_exam` + `exam_is_close` (≤30) + `exam_is_imminent` (≤7) — drive countdown UIs + urgency-aware insights
- `priority_concepts` — top-weighted topics for ordering
- `is_fallback` + `fallback_source_name` — transparency flag when the context was augmented from a nearest match

**Fallback hydration:** if the target exam has <50% structural completeness, the bridge automatically looks up the nearest complete match via `findMoreCompleteMatch` and fills missing structural fields from it. This means students get exam-aware personalization even while the admin is still finishing the exam profile — with a transparency flag so the UI can disclose the source.

**Opt-in consumer helpers:**

- `examPriorityBoost(concept_topic, ctx)` → multiplier in [0.5, 2.0] based on the concept's weight in the exam
- `isConceptInExamScope(concept_topic, ctx)` → true if the concept is in the exam's syllabus
- `examCountdownLabel(ctx)` → human-readable countdown string
- `examUrgencyTier(ctx)` → critical / high / medium / low

All consumer helpers accept `ExamContext | null` and degrade gracefully when the student has no exam assigned. **The original behavior for exam-less students is preserved exactly.**

### Where personalization is already wired (v2.9.8)

**`src/gbrain/after-each-attempt.ts`** — the insight engine now:

1. Mentions the exam name on mastery milestones ("one more locked in for GATE-CS")
2. Prefers exam-scope successors for `move_on` suggestions, ranked by exam topic weight
3. **Replaces `take_break` with `review_prereq` when exam is ≤7 days.** This is critical: telling a stressed student whose exam is in 3 days to "step away for 10 minutes" reads as tone-deaf. Instead, the system suggests a prereq lesson — same cognitive benefit (breaks the failure loop), much better framing for the urgent context.

**`src/api/notebook-insight-routes.ts`** — `POST /api/gbrain/attempt-insight` auto-hydrates `exam_context` from the signed-in user and returns it alongside the insight. The client can use the returned context for countdown UIs, urgency chips, etc.

**`frontend/src/components/gate/ExamCountdownChip.tsx`** — student-home UI chip with 4 urgency tiers. Self-gating: renders nothing for students without `exam_id`.

### Future personalization hooks

The `ExamContext` is the clean integration point for every other consumer:

- **Priority engine** — call `examPriorityBoost` when ordering due reviews
- **Problem generator** — sample question types from `exam_context.question_types`
- **Mock exam generator** — use `exam_context.duration_minutes` and `marking_scheme`
- **Smart Notebook** — filter syllabus view to `exam_context.syllabus_topic_ids` when student has exam assigned
- **Teaching brief** — show cohort countdown based on `exam_context.days_to_exam`

All of these are one-liner integrations against the already-exposed bridge. Following the v2.9.0 bridge pattern: pure read, opt-in consumption, no side effects.

---

## 12. Non-goals

- **No auto-URL-fetching.** Admins must manually paste URL content as local data. This avoids SSRF, arbitrary HTTP from the server, and surprising behavior.
- **No file uploads (PDFs, DOCX) in v2.9.7.** Local data is text-only for now. File extraction is a separate feature with its own parser + sanitization concerns.
- **No exam sharing across Vidhya instances.** Exams are local to a single deployment. Exporting/importing exam JSON across instances is a future feature.
- **No LLM-generated test questions inside exam profiles.** The exam profile is metadata; question generation happens elsewhere.
- **No human approval workflow for enrichment proposals.** Enrichment applies immediately when the admin clicks Apply. (Exam group approval, however, IS a deliberate gate — see Section 14.)

---

## 13. Files shipped (by version)

**v2.9.7 — Dynamic exam framework:**
- `src/exams/types.ts` — schema with provenance
- `src/exams/exam-store.ts` — CRUD, completeness, unique IDs
- `src/exams/exam-enrichment.ts` — LLM research with graceful fallback
- `src/exams/exam-assistant.ts` — conversational helper
- `src/api/exam-routes.ts` — HTTP endpoints
- `frontend/src/pages/gate/ExamSetupPage.tsx` — admin UI

**v2.9.8 — Comparison + personalization:**
- `src/exams/exam-comparison.ts` — pairwise structured diff
- `src/exams/exam-similarity.ts` — nearest-match across catalogs
- `src/gbrain/exam-context.ts` — personalization bridge
- `frontend/src/components/gate/ExamCountdownChip.tsx` — student urgency chip

**v2.9.9 — Exam groups + giveaway:**
- `src/exams/exam-group-store.ts` — master list with approval gate
- `src/api/exam-group-routes.ts` — admin CRUD + student `/api/my-giveaway`
- `frontend/src/pages/gate/ExamGroupsPage.tsx` — admin master list UI
- `frontend/src/components/gate/GiveawayBanner.tsx` — student-facing bonus banner

Zero new npm dependencies cumulative. Zero breaking changes.

---

## 14. Exam Groups + Giveaway (v2.9.9)

### The customer-centric concept

Coaching institutes often prepare students for multiple related exams at once — a student targeting GATE-CS may also find value in preparing for JEE Advanced, IES Electronics, or BARC recruitment. Rather than charging separately for each, institutes want to offer one subscription that unlocks preparation for several related exams. This feature makes that explicit to the student as a **giveaway**: when they sign in, a celebratory banner tells them their plan also covers other exams.

### Data model

```typescript
interface ExamGroup {
  id: string;                     // GRP-<CODE>-<BASE36-TS>
  code: string;
  name: string;
  description?: string;
  exam_ids: string[];             // dynamic registry members
  static_exam_ids?: string[];     // static catalog members

  is_approved: boolean;           // THE approval gate
  approved_by?: string;
  approved_at?: string;

  tagline?: string;               // shown on giveaway banner
  benefits?: string[];            // bullet points for the banner

  created_by: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}
```

### The approval gate — why it matters

Groups start as **drafts** (`is_approved: false`). Drafts are admin-only and never surface to students. Approval is an explicit admin action that:

1. Requires at least 2 member exams (a group of one isn't a giveaway)
2. Stamps `approved_by` + `approved_at` for audit
3. Flips the group into student-facing activation

This separation protects students from half-baked groups that don't actually make pedagogical sense together. An admin can experiment with different group compositions in draft state without any student ever seeing the wrong thing. `PATCH /api/exam-groups/:id` explicitly strips `is_approved` fields to force use of the dedicated approve endpoint — so approval cannot happen accidentally via a field-update.

### The giveaway resolution algorithm

When a student signs in, the banner calls `GET /api/my-giveaway`. The server:

1. Looks up the student's `user.exam_id`
2. If no exam assigned → returns `{ giveaway: null }`
3. Walks all **approved** groups looking for one that contains the student's exam
4. If found, returns a `GiveawayInfo` with `primary_exam` (the student's assigned exam) and `bonus_exams` (the other members of the group)
5. If not found, returns `{ giveaway: null }`

The approval invariant is enforced inside `resolveGiveaway()` — unapproved groups are skipped even if they contain the student's exam. This is the security boundary: no way for a draft to leak to students.

### The student-facing banner

`frontend/src/components/gate/GiveawayBanner.tsx` — violet-to-fuchsia gradient with a shimmer animation (deliberately subtle so it reads as "bonus" without being tacky), a gift icon, the group's tagline, the student's primary exam, and the bonus exams as tappable chips. If there are more than 5 bonus exams, an expansion toggle reveals the rest plus any admin-defined benefits list.

**Per-group dismissal via `localStorage`:** once a student dismisses the banner for a group, it stays dismissed for that group. If the admin later approves a second group that the student also qualifies for, the banner reappears — so students never miss newly-added bonus exams.

**Self-gating:** if `/api/my-giveaway` returns null, the component renders nothing. Exam-less students and students outside any approved group see zero UI change.

### The admin master list UI

`/exam-groups` — list view shows every group with its approval status (Approved chip or Draft chip) and member count. Detail view shows:

- Approve / Unapprove action (approve disabled until ≥2 members)
- Archive action
- Full member list with per-member remove buttons
- Add-member modal with searchable list of available exams from `/api/exams`
- Tagline / description / benefits — all editable

### HTTP endpoints

```
POST   /api/exam-groups                        Create draft (admin)
GET    /api/exam-groups                        List all (admin)
GET    /api/exam-groups/approved               List approved (teacher+)
GET    /api/exam-groups/containing/:exam_id    Reverse lookup (admin)
GET    /api/exam-groups/:id                    Detail + resolved members
PATCH  /api/exam-groups/:id                    Update (strips approval fields)
POST   /api/exam-groups/:id/approve            Approve (≥2 member guard)
POST   /api/exam-groups/:id/unapprove          Unapprove
POST   /api/exam-groups/:id/members            Add exam
DELETE /api/exam-groups/:id/members/:eid       Remove exam
POST   /api/exam-groups/:id/archive            Archive
DELETE /api/exam-groups/:id                    Delete (owner only)
GET    /api/my-giveaway                        Student-facing resolution
```

### Integration with the rest of the system

- **No changes to the core exam framework.** Groups are a clean layer on top; the enrichment, comparison, similarity, and personalization engines from v2.9.7/8 all work unchanged.
- **GBrain personalization is unaware of groups.** A student's GBrain still runs against their primary `exam_id` only. Groups are a **discovery + access-unlock** mechanic, not a personalization hook. If a student wants to study a bonus exam, they switch their assigned exam explicitly — the system doesn't auto-merge syllabi, which would produce surprising content.
- **Similarity engine from v2.9.8 makes a great admin helper** for curating groups: when building a new group, admins can consult `/api/exams/:id/similar` to find exam candidates that overlap well. (The UI wiring for this is a future session.)

### Why approval is a gate, not a setting

A flag called `is_approved` could easily have been `is_visible` or `is_published`. The word "approved" is deliberate: it signals that a human admin has **taken explicit responsibility** for telling students these exams belong together. It's not just a visibility toggle — it's an institutional commitment that flows through to the student's trust in the bundle. That's why the endpoint is `/approve` not `/publish`, and why PATCH cannot flip it.

### Non-goals for v2.9.9

- **No billing integration.** Groups unlock access, not billing. Whether a subscription actually includes multiple exams is an org-level decision outside Vidhya's scope.
- **No automatic group suggestion.** The admin curates groups manually. We don't auto-propose bundles based on similarity — that's a future feature where the admin reviews AI-suggested bundles.
- **No student-initiated group joining.** Students can't opt into a group they're not assigned to. Only admin assignment + approved membership triggers the giveaway.
- **No cross-group stacking.** A student's primary exam can belong to at most one group in the giveaway banner. If multiple approved groups contain the student's exam, the first match wins (deterministic by update order).

---
