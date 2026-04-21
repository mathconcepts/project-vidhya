# Compounding Mastery + Smart Notebook Framework

**Status:** v2.9.4
**Scope:** Two tightly-coupled feature sets that together make every interaction with Vidhya make the student measurably better — and give them a downloadable single source of truth for everything they've ever asked, studied, or practiced.

---

## 1. Why "every interaction" matters

Most AI tutors are transactional. You ask a question, you get an answer, the interaction ends. Next time you open the app, nothing carries over except maybe a chat scrollback.

Vidhya already models students cognitively via GBrain (mastery vector, error taxonomy, emotional state). The v2.9.4 upgrade closes the loop that was missing: **every attempt now produces an immediate, student-facing signal of what they got better at.**

Before v2.9.4: the student saw their answer and maybe a follow-up. The learning happened internally to the model, invisibly.

After v2.9.4: after every attempt, the student receives:
- **Mastery delta** — "Your score on eigenvalues went from 62% to 68%"
- **An insight** — WHY this attempt mattered, framed positively even when wrong
- **Permission-based next step** — the single most valuable thing to do next
- **A reinforcement** — if a pattern is detected (streak, milestone, cross-concept connection)
- **Gap-to-mastery progress** — how many more attempts to reach 0.8

The student *feels* the compounding. Every problem is visibly a step forward.

---

## 2. The "after each attempt" engine

**File:** `src/gbrain/after-each-attempt.ts` (~430 LOC, pure functions, no I/O)

Computes the insight from:
- `model_before` — the GBrain student model before the attempt
- `model_after` — the model after the attempt (caller persists first)
- `concept_id`, `correct`, `difficulty`, `error_type`, `time_ms`
- `recent_attempts` — for streak + pattern detection

Returns an `AttemptInsight` with 6 fields:

```
verdict          the attempt itself, for display
mastery_delta    before/after scores + % change + total attempts
insight          headline + explanation + tone
next_step        single recommendation with reason + href
reinforcement    optional — only when a pattern is detected
gap_to_mastery   progress bar data (current, target=0.8, estimated remaining)
```

### 2.1 Insight tone selection

Four tones, each matched to specific states:

- **`celebration`** — first attempt correct / mastery milestone crossed / hard problem solved / returning success after earlier errors
- **`encouragement`** — wrong answer with known error type → positive framing ("this wrong answer just made you sharper")
- **`reinforcement`** — correct but not yet mastered → "another layer of mastery"
- **`correction`** — reserved for cases where the student needs to review a prerequisite

The **wrong-answer framing is critical.** Never "try again" in a way that feels like failure. Always: *"what you just uncovered about your own thinking is the hard part — and you now have it."*

### 2.2 Error-type-aware explanations

When the attempt is classified by GBrain's error taxonomy, the insight explanation is specific:

| Error type | Student sees |
|-----------|--------------|
| conceptual | "Your answer reveals a specific gap in how you're thinking about X. This is exactly what we can fix." |
| procedural | "The method is right; a step was off. One more attempt usually fixes this." |
| computational | "The approach was correct; the arithmetic slipped. Slow down on the next one." |
| notation | "You understand the idea; the notation tripped you up. Faster with exposure." |
| application | "You know the rule; identifying when to apply it is the hard part. Pattern recognition comes from seeing more cases." |

### 2.3 Next-step recommender

One recommendation, not a menu. Selected by cascading rules:

```
if mastery ≥ 0.8 and correct  → move_on to related unmastered concept
if correct and 0.5-0.8         → try_harder / practice_same (based on difficulty)
if wrong and error=conceptual  → review_prereq (weakest prerequisite)
if wrong and attempts < 5      → practice_same
if wrong and attempts ≥ 5      → take_break ("mental fatigue is real, memory
                                 consolidates during breaks")
otherwise                      → practice_same
```

Every recommendation includes a `reason` string that makes the suggestion feel like advice from a knowledgeable friend, not an algorithm.

### 2.4 Pattern-based reinforcements (the wow moments)

Four patterns trigger a reinforcement message:

- **`mastery_milestone`** — crossed 0.8 threshold
- **`streak`** — 3+ consecutive correct on same concept ("three in a row — this concept is clicking")
- **`pattern_recognized`** — correct across 3+ different concepts recently ("you're connecting ideas — that's how deep learning happens")
- **`difficulty_progression`** — student is tackling progressively harder problems successfully

Reinforcements appear at most once per attempt. They are the "state of bliss" moments promised by `docs/USER-JOURNEY.md`.

---

## 3. HTTP endpoint

```
POST /api/gbrain/attempt-insight
  body: { session_id, concept_id, correct, difficulty?, time_ms?, error_type? }
  response: { insight: AttemptInsight }
```

The insight endpoint is **separate from the attempt-recording endpoint** (`POST /api/gbrain/attempt`). Order of calls:
1. Client records the attempt at `/api/gbrain/attempt` (writes to model)
2. Client immediately calls `/api/gbrain/attempt-insight` (reads updated model, returns insight)

Two calls keep the concerns clean: the insight endpoint is pure read, easy to cache or swap; the recording endpoint is the only write path.

---

## 4. The Smart Notebook

**File:** `src/notebook/notebook-store.ts` (~380 LOC)

The notebook is **the student's single source of truth** for everything they've done in Vidhya. Every chat question, every snap, every lesson opened, every problem attempted — all logged, auto-clustered, gap-analyzed, exportable.

### 4.1 What gets logged

7 entry kinds:

| Kind | Trigger |
|------|---------|
| `chat_question` | Student typed a question in `/chat` |
| `snap` | Student uploaded a photo in `/snap` |
| `lesson_viewed` | Student opened a lesson at `/lesson/:id` |
| `problem_attempted` | Student submitted a problem answer |
| `material_uploaded` | Student uploaded class notes in `/materials` |
| `diagnostic_taken` | Student ran a diagnostic on a mock test |
| `note` | Student-authored free-text note |

Each entry has: `id`, `user_id`, `kind`, `content` (text + concept_id + topic + optional verdict/difficulty), `created_at`, auto-generated `title`.

### 4.2 Auto-clustering by concept

Every entry is tagged with a `concept_id` on creation:

1. If the caller provides `concept_id`, use it directly
2. Otherwise, run lightweight keyword matching against all concepts' labels, aliases, and keywords
3. Score = 2 for label match + 1.5 per alias + 1 per keyword; best score ≥ 1.5 wins
4. If nothing scores ≥ 1.5, tag as uncategorized

**No LLM, no embedding call, no round-trip.** Every log is ~1ms. Designed for write-heavy use — called on every user input across chat/snap/lesson/practice without impacting response times.

The student can manually override a tag via `POST /api/notebook/retag`. Manual tags persist in `notebook.manual_tags` and are honored on re-clustering.

### 4.3 Gap analysis

`analyzeGaps(notebook)` returns, per topic:
- `total_concepts` — how many concepts in that topic of the syllabus
- `covered_concepts` — how many have at least one entry
- `uncovered_concepts` — the concept_ids with zero entries
- `coverage_pct`

Plus overall coverage across the full syllabus.

The UI shows topics sorted worst-coverage-first, with the uncovered concepts explicitly listed. This is the "what haven't I studied yet?" view — far more useful than a to-do list because it's grounded in what the student has *actually touched* vs the official syllabus.

### 4.4 Markdown export — the downloadable source of truth

`GET /api/notebook/download` returns a Markdown file with `Content-Disposition: attachment`. The export is **syllabus-driven**: every concept in the official syllabus appears, practiced or not, with clear status markers and precise timestamps.

```
# Study Notebook — Maya K.
*Exported from Project Vidhya on 2026-04-21 (2026-04-21T14:22:00Z)*

Total entries: 342
Syllabus coverage: 58% — 48 of 82 concepts practiced
First activity: 2026-03-15 09:30 UTC
Latest activity: 2026-04-21 14:22 UTC

Legend: 🟢 Practiced · ⚪ Not yet practiced · 🟡 Touched once · 🔵 Multiple attempts

## Coverage summary
| Topic | Coverage | Practiced | Not yet |
|-------|:--------:|:---------:|:-------:|
| Linear Algebra | 🟢 85% | 17 / 20 | 3 |
| Calculus | 🟡 62% | 13 / 21 | 8 |
| Complex Variables | 🔴 18% | 2 / 11 | 9 |

## Full syllabus dump

### 🟢 Linear Algebra — 17/20 practiced (85%)

#### 🔵 Eigenvalues & Eigenvectors
**23 entries** · 16/19 correct
- **First practiced:** 2026-03-18 14:22 UTC
- **Last practiced:** 2026-04-19 09:40 UTC
- **Active span:** 32 days

**Entries:**
- `2026-04-19 09:40 UTC` **[problem_attempted]** Problem: Find eigenvalues of [[2,1],[1,2]]
  · Result: ✓ correct
  · Difficulty: medium
- `2026-04-18 16:12 UTC` **[chat_question]** Asked: when are eigenvalues complex?
  > I'm confused about when a matrix has complex eigenvalues...

#### ⚪ Orthogonality
> **Not yet practiced.** No entries recorded for this concept.

### 🔴 Calculus — 1/19 practiced (5%)

#### 🟡 Limits
**1 entry**
- **First practiced:** 2026-04-21 11:06 UTC
- **Last practiced:** 2026-04-21 11:06 UTC
...

## Chronological log
### 2026-04-21
- `14:22:15` **[snap]** ✓ Snapped: multivariable calculus problem · _gradient_
- `14:18:43` **[chat_question]** Asked: when to use polar coordinates? · _integration_
...
```

**Key design choices:**

- **Every syllabus concept appears** — practiced or not. A student seeing only the "studied" list is missing the critical half of the picture.
- **Four activity markers:** ⚪ (not yet practiced) · 🟡 (single touch) · 🟢 (multiple activities) · 🔵 (5+ entries)
- **Per-concept metadata:** first-practiced timestamp, last-practiced timestamp, active span in days, attempts count, correct/incorrect ratio
- **Per-entry timestamps:** full `YYYY-MM-DD HH:MM UTC` in the syllabus dump, full `HH:MM:SS` in the chronological log
- **Verdict markers inline:** ✓ / ✗ next to problem-attempted entries
- **Difficulty displayed** per entry when present
- **Short content snippets** inline under each entry (truncated at 200 chars) so the export is self-contained

### 4.5 Why syllabus-driven?

We deliberately structured the export around the **official syllabus** rather than around the student's activity. This reverses the default framing of note apps:

- A typical notes export shows *what the student wrote*. The unwritten parts are invisible.
- The Vidhya syllabus dump shows *the syllabus*, with the student's activity annotated against it. The unwritten parts — concepts the student hasn't touched yet — are **just as visible as the ones they have**.

This matches Vidhya's primary goal: *maximum competency with minimum effort*. A student's biggest lever is usually what they haven't studied yet, not what they have. The export puts that signal in the foreground.

A student going into an exam can download their entire study history in 2 seconds, reference it offline, print it, share it with a teacher. **It's theirs.** The universal format (GitHub-flavored Markdown) means it renders in VS Code, GitHub gists, Obsidian, Typora, or any Markdown viewer.

---

## 5. HTTP endpoints (notebook)

```
POST   /api/notebook/entry         Add a new entry
GET    /api/notebook               Full notebook (JSON)
GET    /api/notebook/clusters      Concept-clustered view
GET    /api/notebook/gaps          Syllabus gap analysis
GET    /api/notebook/download      Markdown download
POST   /api/notebook/retag         Manual concept tag override
DELETE /api/notebook/entry/:id     Delete an entry
```

All endpoints resolve the student either from the auth token (signed-in) or from `session_id` in query/body (anonymous).

---

## 6. Frontend — `/smart-notebook` page

Three views controlled by a tab switcher:

- **Gaps** — syllabus coverage table with expandable topic details showing uncovered concepts
- **By concept** — clusters view with expandable entry lists per concept
- **Timeline** — chronological log grouped by date

Three stat cards at the top: total entries · concepts touched · overall coverage %.

Top-right action: Download `.md` button (fetches `/api/notebook/download`, triggers browser download).

### Why it works

The **Gaps view is the first thing students see** — deliberately. Per the primary goal ("increase competency with minimal effort"), seeing what you *haven't* touched is higher leverage than seeing what you have. It guides the next action without prescribing it.

The **Download button is visible in the header** — not buried. A student about to go into an exam can download their entire study history in 2 seconds and reference it offline. Privacy bonus: the file is local to their device.

---

## 7. Storage

```
.data/notebooks/{user_id}.json
```

Uses the shared `createFlatFileStore` generic from v2.9.1. Append-only (entries never modified after creation). Bounded at 5000 entries per user — beyond that, oldest entries are dropped (a student with 5000 entries should be exporting regularly anyway).

Concurrent writes are safe because Node is single-threaded; multiple interactions from the same user serialize through the event loop.

---

## 8. Integration points — how entries get logged

The notebook is write-heavy but **no existing endpoint is required to log**. Rather, we provide `addEntry()` as a standalone call and integrate it incrementally:

- **v2.9.4 ships with the storage + API + UI** — any client can call `POST /api/notebook/entry` to log an entry
- **Chat, snap, lesson, materials, diagnostic endpoints** can call `addEntry()` server-side during their handlers (one line)
- **Existing interactions continue working unchanged** — integration is opt-in

This follows the GBrain Integration Bridge pattern from v2.9.0: small, pure, opt-in, doesn't break anything.

---

## 9. Privacy

- Notebook is per-user; no cross-user visibility
- Teachers and admins do NOT see student notebooks (teacher roster shows aggregate mastery only, per `docs/TEACHER-JOURNEY.md`)
- Anonymous students get session-scoped notebooks under `anon_{session_id}` — clearing the session clears the notebook
- Download is the student's own copy; the server doesn't need to retain anything after download

---

## 10. Why this is a moat (feature set highlight)

Traditional AI tutors optimize the *answer*. Vidhya optimizes the *arc*.

**Compounding mastery moat:**

1. **Every attempt produces visible progress.** Students see mastery % move, not just a correctness verdict.
2. **Every wrong answer is reframed as learning.** The error taxonomy means we can explain *why* the answer was wrong in a way that builds understanding rather than shame.
3. **Every session creates one actionable next step.** The student never has to decide what to do next alone.
4. **Patterns get celebrated specifically.** "Three in a row on eigenvalues" is more motivating than a streak counter — because it's *specific*.
5. **Over weeks, the notebook accumulates.** A student with 6 months of practice has a 1000-entry notebook grouped by concept — their study companion, their review reference, their proof of growth.

**Smart Notebook moat:**

1. **Every user input becomes searchable study material** — automatically, without the student doing any organizing.
2. **Gap analysis against the full syllabus** — no other tutor tells you which concepts you haven't touched yet.
3. **Exportable in a universal format** — Markdown works anywhere. Students own their data.
4. **Works for anonymous users** — session-scoped notebook means even casual visitors get their work captured.

No external dependency added. No LLM cost. No database. Pure architectural gain.

---

## 11. Files shipped in v2.9.4

New:
- `src/gbrain/after-each-attempt.ts` — insight engine (pure functions, ~430 LOC)
- `src/notebook/notebook-store.ts` — notebook module (~380 LOC)
- `src/api/notebook-insight-routes.ts` — 8 HTTP endpoints
- `frontend/src/pages/gate/SmartNotebookPage.tsx` — 3-view UI + download (~380 LOC)
- `docs/COMPOUNDING-MASTERY-FRAMEWORK.md` — this document

Modified:
- `src/gate-server.ts` — register notebook routes
- `frontend/src/App.tsx` — `/smart-notebook` route
- `FEATURES.md` — new moat slide (see §12)

Zero new npm dependencies. Zero breaking changes.

---

## 12. Verified

- Backend typecheck: zero errors
- Frontend build: 26.16s clean
- Notebook download tested with a seeded notebook: well-formed Markdown, correct table structure, all entries present
- Insight engine tested across all 8 branches (first-try correct, milestone, hard-problem, error-type variants, take-break)
- Storage at `.data/notebooks/` is auto-created on first write via shared flat-file-store

---

## 13. What this framework does NOT do (explicit non-goals)

- **Not an LLM-generated study summary.** The Markdown export is composed from actual entries, not generated. Students trust it because it's *theirs*.
- **Not a social feed.** Notebooks are private.
- **Not a teacher dashboard replacement.** Teachers don't see student notebooks (covered in TEACHER-JOURNEY.md).
- **Not a replacement for the Lesson framework.** Lessons are *structured* — notebook entries are *captured*. Different purposes.
- **Not a note-taking app.** We don't support rich-text notes, attachments, or collaboration. Notebook is for *automatic* capture + exportable *review*.
