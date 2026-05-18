# Syllabus Bridge

A framework for generating intuitive course content that bridges a school curriculum (e.g. Tamil Nadu State Board Class 12 Mathematics) to an entrance exam (e.g. IIT JEE Main).

Students see material that ramps from their textbook level to entrance-exam level. Teachers see where their class is stuck. Admins generate, monitor, and re-generate content driven by real feedback. GBrain personalises everything in the background.

## Contents

- [Why this exists](#why-this-exists)
- [Core concepts](#core-concepts)
- [The 5-step admin wizard](#the-5-step-admin-wizard)
- [The student experience](#the-student-experience)
- [The teacher experience](#the-teacher-experience)
- [The feedback loop](#the-feedback-loop)
- [GBrain capabilities — implicit vs explicit](#gbrain-capabilities--implicit-vs-explicit)
- [Adding a new curriculum or mapping](#adding-a-new-curriculum-or-mapping)
- [API reference](#api-reference)

## Why this exists

State-board syllabi cover concepts at a depth appropriate for a board exam (e.g. TN Higher Secondary). Entrance exams (JEE Main, BITSAT, UGEE) demand the same concepts at a much higher depth, plus adjacent material the board skips. A student who only studies the school textbook arrives at the entrance exam knowing the names of the techniques but not the speed, depth, or trick patterns the exam requires.

The Syllabus Bridge framework codifies the gap, then generates content that explicitly bridges it. Output is not generic JEE practice — it is content that says "you already know this from chapter X of your TN book; here's the same idea at JEE depth."

## Core concepts

### Curriculum

A source body of material a student already studies. Defined in `src/syllabus-bridge/curricula/`. Each curriculum is a tree of `topics` → `concepts`, with NCERT-aligned textbook references and an estimate of classroom hours per topic.

Current curricula:
- `TN-12-MATH` — Tamil Nadu State Board, Class 12 Mathematics: 12 chapters, 31 concepts.

### Bridge mapping

A mapping connects one curriculum to one exam. Defined in `src/syllabus-bridge/mappings/`. Each mapping has `entries`; each entry says "these source concepts map to these exam topics, the gap is [aligned | depth-gap | breadth-gap | foundation], the difficulty jump is N/5, and here's the editorial guidance for an author."

Gap class taxonomy:

| Gap class | Meaning | What we generate |
|---|---|---|
| **aligned** | Source teaches what the exam needs at the right depth | 2 units: worked example, stretch problem |
| **depth-gap** | Same concept but exam demands deeper problems / faster recall | 4 units: worked example, bridge explainer, stretch problem, practice set |
| **breadth-gap** | Exam needs adjacent concepts the source skips | 3 units: foundation explainer, bridge explainer, stretch problem |
| **foundation** | Source skips this entirely; build from scratch | 5 units: foundation explainer, worked example, bridge explainer, stretch problem, practice set |

Current mappings:
- `TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE` — Tamil Nadu Class 12 Maths → JEE Main: 23 entries (7 aligned, 10 depth-gap, 1 breadth-gap, 5 foundation).

### Content plan

Derived from the mapping. Pure function: given a mapping, return the list of content units to generate. The plan also gives token + cost estimates so admins know what they're about to spend.

A full TN-12-MATH → JEE Main plan: 77 units, ~58k tokens, ~$0.017 at Gemini Flash pricing.

### Content unit types

| Type | Purpose | ~tokens |
|---|---|---|
| `foundation-explainer` | Re-teaches the concept at school level with intuitive hooks | 800 |
| `worked-example` | TN-textbook-style worked problem | 600 |
| `bridge-explainer` | The connector — TN style → JEE technique on the same concept | 900 |
| `stretch-problem` | One JEE Main level problem with detailed solution + insight | 500 |
| `practice-set` | 4 problems graduated from TN to JEE | 1200 |

### Batch

A request to generate one or more content units. Submitted from the admin UI; runs in the background; status polled by the UI. Can be:
- **Generic pack** — same content for everyone (no `for_student_id`)
- **Solo prep** — `for_student_id` set; GBrain personalises every prompt
- **Smart priority** — `for_student_id` + `smart_priority`; only generates the top-N gaps that student needs

## The 5-step admin wizard

`/admin/syllabus-bridge` is a guided wizard. Each step does one thing.

1. **Pick mapping** — cards show the four gap counts at a glance.
2. **Review gap** — entries colour-coded by gap class, with editorial bridge notes. Cost estimate visible upfront.
3. **Personalise** (optional) — pick `pack` / `student` / `cohort`. Preview the GBrain rank (single student) or run a cohort gap report (teacher).
4. **Generate** — single confirmation, then live progress.
5. **Review & feedback** — expand each generated unit, give thumbs / flag issues. Banner appears when content has been auto-flagged for regen.

## The student experience

Students who have a `knowledge_track_id` set on their exam registration (e.g. they came in through `/knowledge`) see a `BridgeRecommendationsCard` on their planner. It surfaces the top-3 bridge entries GBrain says they need most right now, with:

- An open-in-place reader for the generated content (no navigation away from the planner).
- An inline rate widget ("helpful" / "not really" / specific issue chips).

If no content has been generated yet for an entry, the card says "Ask your teacher to enable it" instead of pretending content exists.

The card returns `null` (renders nothing) if the student has no knowledge track or no matching mapping. It is safe to drop into any planner page.

## The teacher experience

`/teacher/syllabus-coverage` is a single page that:

1. Auto-loads the teacher's roster from `/api/teaching/roster`.
2. Runs a cohort gap report against the picked mapping.
3. Shows where the class is stuck, with a per-entry recommended action:
   - "Run a class session" (>60% struggling)
   - "Assign as homework" (>30%)
   - "Light-touch follow-up" (>10%)
   - "Cohort is on track"
4. Lets the teacher click **Generate material for this gap** directly on any entry that has no generated content yet.

The teacher never has to navigate to the admin tool — generation happens in place.

## The feedback loop

Any authenticated user can leave feedback on a generated content unit:

| Rating | What it means |
|---|---|
| `helpful` | Worked for me |
| `not-helpful` | Didn't help |
| `wrong` | Factual error |
| `unclear` | Couldn't follow it |
| `too-easy` | Below my level |
| `too-hard` | Above my level |

When feedback accumulates past a threshold, the framework auto-flips `GeneratedContent.flagged_for_regen = true`. Rules:

- **3+ `wrong`** → factual error claim — flag immediately
- **4+ `not-helpful`** with helpful ratio < 25% → wrong angle, regenerate
- **3+ `unclear`** with helpful ratio < 33% → re-write for clarity

The admin Review step shows a banner when there are any flagged units, with a **Regenerate flagged** button that submits a targeted batch (only the flagged unit_ids, no others).

Feedback storage: `.data/syllabus-bridge-feedback.json`. Append-only. Aggregation is computed on read.

## GBrain capabilities — implicit vs explicit

GBrain — the student-model engine in `src/gbrain/` — connects to the Syllabus Bridge through `src/syllabus-bridge/gbrain-integration.ts`. Four entry points. Two are **implicit** (run automatically), two are **explicit** (UI surfaces).

### Implicit uses — always on

#### `personalizePromptForStudent(prompt, student_id)`
**When:** Every time the batch runner generates a unit and the batch has `for_student_id` set.
**What it does:** Prepends a GBrain `serializeForPrompt()` block to the generation prompt — motivation, representation mode, abstraction comfort, working-memory estimate, weak topics, prerequisite gaps, confidence calibration. Adds 3 calibration directives the LLM follows:

1. If motivation is `flagging`/`frustrated`, open with the easiest version and build confidence.
2. If working memory is low, prefer 2-3 short steps over one long derivation.
3. If they have prerequisite gaps, name them and bridge before introducing the new technique.

**Why:** Same content template produces a different body for each student. No admin action required.

#### `recommendBridgeContent(student_id, mapping_id)`
**When:** Every time the student opens their planner. `BridgeRecommendationsCard` calls this on mount.
**What it does:** Ranks all entries by need, pairs the top-N with whatever content has been generated for them, returns `needs_generation: true` when nothing is ready yet.

**Why:** The student doesn't have to know what to study — GBrain picks the gap they should work on first.

### Explicit uses — UI-driven

#### `rankEntriesForStudent(mapping, student_id)`
**When:** Admin clicks **Preview rank** in step 3 of the wizard, OR submits a batch with `smart_priority: true`.
**What it does:** Computes `need_score = 0.50 * (1 - avg_target_mastery) + 0.30 * (difficulty_jump/5) + 0.15 * gap_class_weight + 0.05 * motivation_modifier` for every entry, returns them sorted with reason strings.

**Why:** Lets the admin see and approve GBrain's prioritisation before spending tokens. When `smart_priority` is on, the batch only generates units for the top-10 entries this student needs — saves cost for solo prep.

#### `cohortGapReport(student_ids, mapping)`
**When:** Teacher clicks **Run gap report** on `/teacher/syllabus-coverage` (or admin tries the cohort panel in the wizard).
**What it does:** Loads every student model in parallel, aggregates mastery per bridge entry, returns the top-15 entries by struggle volume with a recommended teacher action.

**Why:** Teacher analytics — answers "where is my class stuck?" in one click.

### When to use each

| Situation | Use |
|---|---|
| Generating the initial pack for a new mapping | Generic batch (no GBrain) |
| Bringing a single student up to speed quickly | Smart priority batch (`for_student_id` + `smart_priority`) |
| Generating full personalised pack for one student | Personalised batch (`for_student_id`, no `smart_priority`) |
| Picking which topics to cover in next class | Teacher cohort report |
| Student opens their planner | (Implicit) `recommendBridgeContent` runs automatically |
| Re-generating content that's been rated badly | Admin "Regenerate flagged" |

## Adding a new curriculum or mapping

Two-file change. No other code touches needed.

```
src/syllabus-bridge/curricula/<new>.ts   # define topics + concepts
src/syllabus-bridge/mappings/<new>.ts    # define entries with gap_class + bridge_note
src/syllabus-bridge/registry.ts           # import + push to the arrays
```

Bridge notes are the editorial soul of the system. Write them as if you were briefing a tutor: what does the source teach, what does the exam add, what's the specific trick the LLM should emphasise? Those notes flow straight into every prompt for that entry.

## API reference

### Public (read)

```
GET /api/syllabus-bridge/curricula
GET /api/syllabus-bridge/curricula/:id
GET /api/syllabus-bridge/mappings
GET /api/syllabus-bridge/mappings/:id
GET /api/syllabus-bridge/mappings/:id/plan
GET /api/syllabus-bridge/content/by-mapping/:id
GET /api/syllabus-bridge/content/:id
```

### Auth (any signed-in user)

```
GET  /api/syllabus-bridge/mappings/:id/recommendations?limit=N
POST /api/syllabus-bridge/content/:id/feedback
     body: { rating, comment? }
GET  /api/syllabus-bridge/content/:id/feedback
GET  /api/syllabus-bridge/mappings/:id/feedback-overview
GET  /api/syllabus-bridge/batches
GET  /api/syllabus-bridge/batches/:id
```

### Teacher / Admin

```
POST /api/syllabus-bridge/mappings/:id/cohort-report   (teacher+)
     body: { student_ids }
GET  /api/syllabus-bridge/mappings/:id/ranked-entries?student_id=...   (admin)
POST /api/syllabus-bridge/batches   (admin)
     body: { mapping_id, unit_ids?, for_student_id?, smart_priority?, top_n? }
POST /api/syllabus-bridge/mappings/:id/regenerate-flagged   (admin)
```

## File map

```
src/syllabus-bridge/
  types.ts                 — Curriculum, BridgeMapping, ContentPlan, Batch, Feedback types
  registry.ts              — Central lookup
  content-plan.ts          — Per-gap-class plan rules + cost estimate
  batch-runner.ts          — Sequential per-unit generator; LLMClient or mock
  store.ts                 — Content + batch flat-file persistence
  feedback-store.ts        — Feedback + auto-flag-for-regen logic
  gbrain-integration.ts    — personalize, rank, cohort report, recommend
  curricula/
    tn-class-12-math.ts    — TN Class 12 Maths data
  mappings/
    tn-12-math-to-jee.ts   — TN -> JEE bridge with 23 entries
    _jee-topics.ts          — Typo-check helper for JEE topic ids

src/api/
  syllabus-bridge-routes.ts — All HTTP endpoints

frontend/src/
  pages/app/SyllabusBridgePage.tsx         — Admin wizard (5 steps)
  pages/app/TeacherSyllabusCoveragePage.tsx — Teacher cohort surface
  components/app/BridgeRecommendationsCard.tsx — Student-facing card

src/__tests__/unit/syllabus-bridge/
  framework.test.ts            — Registry, plan, store, runner
  gbrain-integration.test.ts   — Ranking, cohort, recommendations
  feedback-store.test.ts       — Feedback + auto-flag rules
```
