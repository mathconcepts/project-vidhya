# Rendering Framework

**Status:** v2.11.0
**Scope:** The layer that turns canonical `Lesson` objects into channel-appropriate output — rich web animations, Telegram progressive-reveal keyboards, WhatsApp numbered lists, voice narration.

---

## Why this layer exists

Before v2.11.0, Vidhya had two things:

1. A **canonical lesson composer** (`src/lessons/composer.ts`) that produces an 8-component `Lesson` from bundle content, user materials, Wolfram results, and the concept graph. Pure function. Cache-safe.
2. A **personalizer** (`src/lessons/personalizer.ts`) that adjusts the lesson based on `StudentSnapshot` — reorders, filters, highlights. Also pure.

What was missing: **the rendering decision**. How do you show a `worked-example` component on the web vs. on Telegram vs. in a WhatsApp voice note? Historically, each consumer hand-wrote its own rendering. That meant interactive elements lived only on the web, Telegram got flat text walls, and there was no shared vocabulary for "step-by-step reveal" across channels.

The rendering framework fixes this with a two-step pipeline:

```
Lesson ──[enrichment]──> EnrichedLesson ──[channel-render]──> RenderedLesson
```

**Enrichment** decides which components become interactive and how. **Channel rendering** decides how each interactive block degrades across delivery channels. Both are pure functions. Both are cache-safe.

---

## The InteractiveBlock vocabulary

Six block types cover every pedagogically-dense moment in a lesson:

| Block | What it is | When it fires |
|-------|-----------|---------------|
| `callout` | Highlighted attention moment with a mood (tip / insight / warning / gotcha) | Hook + intuition components |
| `step-reveal` | Progressive disclosure of a sequence of steps | Worked examples with ≥2 steps |
| `flip-card` | Flip between prompt (the mistake) and explanation (why) | Common traps components |
| `quick-check` | One-question check with instant feedback | Micro-exercise components |
| `animated-derivation` | Mathematical lines that fade in sequentially | (Reserved for future — requires derivation metadata on the source) |
| `drag-match` | Match items in column A to items in column B | Connections components with ≥3 pairs |

Adding a new block type = 4 changes:
1. Add variant to `InteractiveBlock` union in `src/rendering/types.ts`
2. Add enrichment rule in `src/rendering/lesson-enrichment.ts`
3. Add channel renderers in `src/rendering/channel-renderer.ts`
4. Add web component in `frontend/src/components/lesson/InteractiveLessonBlock.tsx`

---

## The enrichment decision logic

```typescript
hook              → CalloutBlock (insight mood)
definition        → (no enrichment — reads cleanly as prose)
intuition         → CalloutBlock (tip mood)
worked-example    → StepRevealBlock (if ≥2 steps)
micro-exercise    → QuickCheckBlock (if ≥2 options)
common-traps      → FlipCardBlock
formal-statement  → (no enrichment — rigor reads as plain)
connections       → DragMatchBlock (if ≥3 connections)
```

Stored in `ENRICHMENT_STRATEGIES` table — one row per component kind. Dispatch is O(1) lookup. Adding a rule for a new kind = one row.

The key property: **enrichment is idempotent and pure**. Same `Lesson` → same `EnrichedLesson` every time. The base `Lesson` is preserved unchanged in the `EnrichedLesson.lesson` field — so all existing caching of composed lessons remains valid, and enrichment can be recomputed or A/B-tested without invalidating the underlying content.

---

## Channel rendering — the degradation matrix

Every block type has four renderers. None of them can "fail" — they all produce valid output. Channels that can't render a block interactively degrade to the best static representation.

### Step-reveal

- **Web:** collapsed cards with slide-in animation via Framer Motion. Key-step marked with ⭐. "Next step" button reveals next.
- **Telegram:** first step sent as a message with an inline keyboard button "Next step (N more) ▶". The callback `reveal:{block_id}:{step_index}` drives a state machine — each press appends the next step as a new message with the updated button.
- **WhatsApp:** all steps numbered 1..N in a single text message.
- **Voice:** each step narrated with a 700ms pause between.

### Flip-card

- **Web:** real CSS 3D flip using `perspective`, `rotateY(180deg)`, `backfaceVisibility: hidden`. Tap flips front ↔ back.
- **Telegram:** front of card sent as a message with "Why does this happen? ▶" button. Callback `flip:{block_id}:{card_index}` sends the explanation as a follow-up message. Optional `student_quote` shown above the prompt for humanization.
- **WhatsApp:** `Trap N: [prompt] → [explanation]` format. One trap per line.
- **Voice:** spoken as "Here's a common mistake: X. Here's why: Y."

### Quick-check

- **Web:** tap an option → animated color feedback + inline hint if wrong + retry button.
- **Telegram:** inline keyboard with up to 4 options (A/B/C/D). Callback `check:{block_id}:{opt_index}` returns either correct feedback or wrong feedback with a "Try again ↻" button.
- **WhatsApp:** numbered list. User replies with a number.
- **Voice:** skipped — no input modality.

### Animated-derivation, Drag-match, Callout

Degradation patterns documented in `src/rendering/channel-renderer.ts`. Each has explicit channel-by-channel code.

---

## Telegram callbacks — the state machine

Telegram interactive content needs a routing convention because each button press hits a webhook. The convention:

```
{action}:{block_id}:{arg1}[:{arg2}]
```

Actions: `reveal`, `flip`, `check`, `match`.

The block ID itself may contain colons (block IDs are structured like `c2:reveal`), so the parser in `renderTelegramCallback()` uses **longest-prefix matching** against known block IDs rather than naive split-on-colon. This was the only non-obvious piece of the implementation.

Flow example — progressive reveal of a worked example:

```
1. Client GET /api/lesson/eigenvalues/rendered?channel=telegram
   → server returns TelegramMessage[] with first step + "Next step ▶" button

2. User taps button; Telegram sends callback with data "reveal:c-worked-example:reveal:1"

3. Client POST /api/lesson/eigenvalues/telegram-callback
   body: { callback_data: "reveal:c-worked-example:reveal:1" }
   → server returns follow-up TelegramMessage(s) with step 2 + "Next step ▶" button

4. Repeat until last step (button disappears).
```

All routing is opaque strings. The server has no server-side state for the reveal progress — the current step is encoded in the callback. This is deliberate: it means a webhook failure doesn't lose progress, and the same lesson can be rendered in multiple Telegram chats concurrently.

---

## Accessibility

- **Web:** every animation respects `prefers-reduced-motion`. When the user has that preference, animations degrade to instant state changes. Framer Motion's `useReducedMotion()` hook is used throughout.
- **Voice:** `VoiceSegment[]` carries optional `emphasis: 'none' | 'moderate' | 'strong'` and `pause_after_ms` for SSML-friendly narration.
- **Keyboard navigation:** all interactive elements on web are native `<button>` elements, focusable and activatable via Enter.

---

## HTTP endpoints

```
GET   /api/lesson/:id/rendered?channel=web
GET   /api/lesson/:id/rendered?channel=telegram
GET   /api/lesson/:id/rendered?channel=whatsapp
GET   /api/lesson/:id/rendered?channel=voice
POST  /api/lesson/:id/telegram-callback    { callback_data: "..." }
GET   /api/lesson/:id/enrichment-audit     Admin: coverage breakdown
```

Responses include `enrichment_summary` with counts per component kind and total enrichment blocks — useful for admin dashboards that want to audit pedagogical coverage across the lesson library.

---

## Why this is the right architecture

1. **Channel-agnostic lessons.** Lesson authors never think about rendering. They produce canonical 8-component lessons. The rendering layer handles the rest.

2. **Decision logic in one place.** Adding a new component kind, a new block type, or a new channel is a local change in `src/rendering/`. No spaghetti.

3. **Telegram first-class, not an afterthought.** Most educational platforms treat chat-bot delivery as a degraded experience. Here it has real interactivity: progressive reveal, flip cards, quiz buttons, retry on wrong answers. All via HTML + inline keyboards, no client-side code.

4. **Cache-safe.** Base Lesson is preserved; enrichment is pure. The existing lesson cache stays valid. Enrichment cache (if added later) is trivial — `(lesson_id, enrichment_version) → EnrichedLesson`.

5. **Accessibility by default.** `prefers-reduced-motion` is honored. Voice segments carry narration hints. Every interactive element is keyboard-navigable.

---

## Files

```
src/rendering/
  types.ts              # InteractiveBlock union, EnrichedLesson, channel output types
  lesson-enrichment.ts  # Decision logic: which components become which blocks
  channel-renderer.ts   # 4 channel renderers + Telegram callback state machine
src/api/
  rendering-routes.ts   # 3 HTTP endpoints
frontend/src/components/lesson/
  InteractiveLessonBlock.tsx  # Web renderer with Framer Motion animations
```

Zero new npm dependencies. Reuses Framer Motion (already present in the frontend from v2.4.1).

---

## v2.12.0 — Learning-objective + GBrain-aware enrichment

The v2.11.0 enrichment was deterministic: same `Lesson` always produced the same `EnrichedLesson`. v2.12.0 adds an optional `EnrichmentContext` that threads GBrain signals through the decision layer so the interactive treatment matches the student's actual learning objective.

### What changes based on context

**Learning objective** (from `ExamContext.question_types`):

| Dominant type | Effect on enrichment |
|---------------|----------------------|
| `mcq` (MCQ / MSQ dominant, e.g. NEET, AIIMS) | Confident students get compressed worked examples (key step only) + synthesized pattern-recognition quick checks. Struggling students keep full step-by-step reveal regardless. |
| `descriptive` (e.g. UPSC Mains, GATE descriptive) | Full reveal always preserved — derivation is the point. |
| `numerical` | Pacing-aware: imminent exam + negative marking → pacing hint in quick-check prompt ("⏱️ aim for under 72s"). |
| `mixed` | v2.11.0 baseline behavior — no compression, no synthesis. |

**Mastery signal** (from `StudentModel.mastery_vector`):

| Mastery signal | Effect on enrichment |
|----------------|----------------------|
| `concept_score >= 0.7` + MCQ exam | Compress worked examples to key step only |
| `concept_score < 0.3` | Never compress — struggling students need every step |
| `last_error_type === 'conceptual'` | Trap cards with `is_conceptual: true` sort to the top |

**Exam proximity** (from `ExamContext.exam_is_imminent`):

| Signal | Effect |
|--------|--------|
| `is_imminent === true` + `negative_marks_per_wrong > 0` | QuickCheck prompts gain a pacing banner: *⏱️ Exam pacing: aim for under Ns.* |

### Synthesized quick-checks (the one content-creation exception)

When a lesson has a worked example but no explicit `micro-exercise`, and the student's exam is MCQ-dominant, the enricher synthesizes a quick-check from the worked example's key step + optional `distractors`. This is the single exception to the "enrichment never creates new content" rule — but the synthesis is strictly derived from content already in the lesson (key step = correct answer; distractors = authored, optional). If no distractors are authored, synthesis is skipped.

The rationale: an MCQ-preparing student should always have at least one tap-to-answer drill per concept, even if the content author only wrote a worked example. Synthesis bridges the gap without the author having to write two versions.

### GBrain integration (opt-in via `/api/lesson/:id/rendered`)

The rendering route now hydrates `EnrichmentContext` automatically from the signed-in student:

1. Calls `getExamContextForStudent(user_id)` → populates `learning_objective`
2. Calls `getOrCreateStudentModel(user_id)` → populates `mastery` for the concept
3. Passes both to `enrichLesson(lesson, channels, ctx)`

The response includes a `gbrain_context` field that names which signals influenced the enrichment decisions — useful for debugging and for admin dashboards that want to audit why a particular student saw a particular treatment.

Both lookups are best-effort. Failure in either produces `null` context → falls back to the v2.11.0 deterministic baseline. No breaking change.

### Purity preserved

Same `(lesson, channel_hints, ctx)` still produces the same `EnrichedLesson`. Caching is safe — the cache key just needs to include a hash of the context (or the context itself, which is small: 5-7 fields).

### What this enables

A student preparing for NEET (MCQ-heavy) and a student preparing for UPSC Mains (descriptive-heavy) now see fundamentally different interactive experiences from the **same canonical lesson**:

- NEET student sees: hook callout → compressed worked example (1 key step) → auto-synthesized pattern-recognition quick-check → trap flip-cards (reordered to put conceptual traps first if they've been making conceptual errors)
- UPSC student sees: hook callout → full 4-step worked example reveal → trap flip-cards → connections drag-match

Both students see the same pedagogical content — just the interactive treatment is tuned to what their exam actually rewards.

---

## v2.13.0 — Speed signal + explicit days_to_exam

Two extensions to `EnrichmentContext`:

**`MasterySignal.recent_avg_ms` and `MasterySignal.cohort_median_ms`.** The rendering route hydrates `recent_avg_ms` from `StudentModel.speed_profile[concept_id].avg_ms`. `cohort_median_ms` is derived from the student's other concept speeds (median when ≥ 3 samples exist).

**New enrichment rule:** if a confident student (mastery ≥ 0.7) is *slow* (recent_avg_ms > 1.5 × cohort_median_ms), MCQ compression is suppressed. The student sees the full worked example even though their score alone would qualify them for compression. Rationale: MCQ exams test automaticity, not just correctness. A student answering correctly but slowly hasn't internalized the pattern — they need the derivation.

**`LearningObjective.days_to_exam`.** Previously rendering only saw `exam_is_imminent` (boolean, ≤7d) and `exam_is_close` (boolean, ≤30d). Now the exact days number is exposed too. This doesn't change any existing enrichment rules; it prepares the surface for finer-grained adaptations in future releases without another signal-surfacing pass.

**`gbrain_context` response field** now includes `recent_avg_ms`, `cohort_median_ms`, `days_to_exam`, and a derived `is_slow_for_cohort` boolean. Any UI that wants to show "we noticed you're taking longer on this concept" has the data.
