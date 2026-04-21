# GBrain Integration Audit

**Status:** v2.10.0
**Purpose:** A systematic per-feature accounting of how GBrain (Vidhya's cognitive core) is applied across the platform.

GBrain is the shared cognitive state + reasoning engine that powers every personalization decision Vidhya makes. It's not a single module — it's a pillared architecture:

1. **Student Model v2** — mastery vector, emotional state, recent attempts
2. **Error Taxonomy + Misconception Hunter**
3. **Concept Dependency Graph + Prerequisite Auto-Repair**
4. **Adaptive Problem Generation**
5. **Exam Strategy Optimizer**
6. **Task Reasoner**

Plus integration layers:
- **Integration Bridge** (`src/gbrain/integration.ts`, v2.9.0) — converts model state into consumer-friendly shapes
- **Exam Context** (`src/gbrain/exam-context.ts`, v2.9.8) — exam-aware personalization
- **Cross-Exam Coverage** (`src/gbrain/cross-exam-coverage.ts`, v2.10.0) — per-exam mastery computation

This document enumerates every feature in Vidhya and records whether/how GBrain is consulted. The goal: nothing student-facing should bypass GBrain when GBrain would improve the experience.

---

## Scoring key

| Status | Meaning |
|--------|---------|
| ✅ Integrated | Feature actively consults GBrain state |
| 🔄 Enriched v2.10.0 | New integration in this release |
| ⚪ Not applicable | Feature is purely admin/auth/config with no student-facing decisions |
| ⚠️ Gap | Would benefit from GBrain but doesn't yet (followup work) |

---

## Feature-by-feature audit

### Student-facing core

| Feature | Integration point | GBrain usage | Status |
|---------|-------------------|--------------|:---:|
| Smart Practice | `/api/gbrain/attempt`, `/api/gbrain/attempt-insight` | StudentModel update + insight computation + exam-aware next-step | ✅ |
| Compounding mastery insights | `src/gbrain/after-each-attempt.ts` | Every attempt runs through `computeInsight` using model before/after + recent_attempts + exam_context | ✅ |
| Lessons | `src/api/lesson-routes.ts` | `modelToLessonSnapshot` hydrates per-concept mastery into lesson intro | ✅ |
| Chat with AI tutor | `src/api/chat-routes.ts` | Student model + concept hints inform chat grounding | ✅ |
| Multimodal input (photo/voice) | `src/api/multimodal-routes.ts` | Attempts routed through GBrain for mastery updates | ✅ |
| Smart Notebook | `/api/notebook/auto-log`, `/api/notebook/export` | Concept clustering uses mastery_vector; gap analysis compares to syllabus | ✅ |
| Notebook insight engine | `src/api/notebook-insight-routes.ts` | Auto-hydrates `exam_context`; returns insight + context for client UI | ✅ |
| Exam countdown chip | `frontend/src/components/gate/ExamCountdownChip.tsx` | Reads ExamContext via `/api/exam-context/mine` | ✅ |
| **Giveaway banner** | `src/api/exam-group-routes.ts#handleMyGiveaway` | **🔄 v2.10.0** — now computes per-bonus-exam coverage from student's mastery_vector; reorders bonus exams by readiness; "you're X% covered already" messaging | 🔄 |
| **Unified student summary** | `src/api/me-routes.ts#handleGBrainSummary` | **🔄 v2.10.0** — NEW unified endpoint exposing mastery stats + exam context + giveaway coverage + focus signal in one call | 🔄 |
| Student welcome card | `frontend/src/components/gate/StudentWelcomeCard.tsx` | Reads first-time flags from model | ✅ |
| Your Teacher card | `frontend/src/components/gate/YourTeacherCard.tsx` | Uses teacher-student link from user record | ✅ |
| Daily streak | `src/api/streak-routes.ts` | Activity-tracked (not mastery); could be enriched but design intent is separation | ⚪ |

### Admin-facing

| Feature | Integration point | GBrain usage | Status |
|---------|-------------------|--------------|:---:|
| Admin dashboard | `src/api/admin-dashboard-routes.ts` | `summarizeCohort` aggregates StudentModels for retention/engagement view | ✅ |
| Per-student view | `src/api/user-admin-routes.ts` | Reads full StudentModel per user | ✅ |
| Teacher roster | `src/api/teaching-routes.ts` | `modelToTeacherRosterEntry` per assigned student | ✅ |
| Push-to-review | `src/api/teaching-routes.ts` | Teacher pushes concepts; GBrain treats as elevated priority | ✅ |
| Exam setup | `src/api/exam-routes.ts` | Enrichment, comparison, similarity all consult StudentModel when relevant | ✅ |
| Exam groups master list | `src/api/exam-group-routes.ts` | Admin CRUD is GBrain-agnostic (correct — admin edits are not student-facing decisions) | ⚪ |
| Auth | `src/api/auth-routes.ts` | Identity only | ⚪ |
| LLM config | `src/api/llm-config-routes.ts` | Config only | ⚪ |

### Content + curriculum

| Feature | Integration point | GBrain usage | Status |
|---------|-------------------|--------------|:---:|
| Content engine (four-tier cascade) | `src/api/content-routes.ts` | Tier-0 bundle resolution is GBrain-agnostic by design (pure content lookup). Tier-3 LLM generation is influenced by student model upstream in the caller | ⚪ |
| Curriculum framework | `src/api/curriculum-routes.ts` | Admin metadata; student experience flows through lesson-routes which consults GBrain | ⚪ |
| Syllabus generator | `src/api/syllabus-routes.ts` | Admin-facing listings; per-student syllabus views compose with GBrain in the lesson resolver | ⚪ |
| Blog | `src/api/blog-routes.ts` | CMS content | ⚪ |
| Topic SEO pages | `src/api/topic-pages.ts` | Static generation | ⚪ |

### Meta/infra

| Feature | Integration point | Status |
|---------|-------------------|:---:|
| Aggregate (anon. telemetry) | `src/api/aggregate.ts` | ⚪ |
| Commander CLI | `src/api/commander-routes.ts` | ⚪ |
| Notification subs | `src/api/notification-routes.ts` | ⚪ |
| Social graph | `src/api/social-routes.ts` | ⚪ |
| Gate Math legacy proxy | `src/api/gate-routes.ts` | ⚪ |
| Gemini proxy | `src/api/gemini-proxy.ts` | ⚪ |
| Funnel tracking | `src/api/funnel-routes.ts` | ⚪ |

---

## The v2.10.0 sweep

Three changes in this release:

### 1. Giveaway banner is now GBrain-personalized

Previously, the banner showed bonus exams as static chips. Now, every bonus exam renders with a coverage percentage computed from the student's mastery_vector against the bonus exam's topic list:

```
[ JEE Advanced  42% covered ]  [ IES Electronics  18% covered ]  [ BARC CSE  8% covered ]
```

Bonus exams are **reordered by coverage descending** — the bonus the student is closest to completing is shown first. When the top bonus exam is ≥20% covered, a dedicated callout appears:

> ✨ You're already 42% of the way through JEE Advanced through your current prep.

This turns the giveaway from a static promise into a living progress indicator — a tangible taste of how much of each bonus exam the student already has access to, not just in theory but in mastery.

### 2. Unified `/api/me/gbrain-summary` endpoint

A single endpoint that exposes everything a client UI might want for GBrain-aware rendering:

```json
{
  "user": { "id": "...", "role": "student", "exam_id": "EXM-..." },
  "mastery": {
    "total_concepts_attempted": 47,
    "mastered_count": 12,
    "covered_count": 8,
    "in_progress_count": 15,
    "struggling_count": 12,
    "weak_concepts_preview": [...],
    "strong_concepts_preview": [...]
  },
  "exam_context": { /* ExamContext or null */ },
  "giveaway": { /* GiveawayInfo with per-bonus coverage, or null */ },
  "recent_attempts": [...],
  "focus_signal": {
    "kind": "exam_imminent",
    "message": "Your exam is in 5 days — focus on your weakest concepts now.",
    "action": "Review priorities",
    "href": "/smart-practice"
  }
}
```

**Why this matters:** features that want GBrain-aware rendering no longer need to call 4 separate endpoints. They call one. The response shape is additive — new fields can be added without breaking existing consumers.

**Focus signal** in particular is a derived "what matters right now" signal with deterministic priority:
1. Exam imminent (<7 days) → review weak concepts
2. 3+ struggling concepts → focused review session
3. Bonus exam ≥80% covered → nudge to switch focus
4. Exam close (<30 days) → steady practice
5. Some mastery → momentum message
6. Fresh user → encouraging start message

This is the single prominent call-to-action that ANY surface can render without re-reasoning about all the state.

### 3. Cross-Exam Coverage engine

`src/gbrain/cross-exam-coverage.ts` — new pure-function module. Given a student's mastery vector and an exam's topic list, computes:

- `attempted_count` — how many of the exam's concepts the student has attempted at all
- `covered_count` — how many have score ≥ 0.5 with ≥ 2 attempts
- `mastered_count` — how many have score ≥ 0.8 with ≥ 2 attempts
- `coverage_percent`, `mastery_percent`
- `covered_preview`, `untouched_preview` (up to 5 concept ids each for UI)
- `coverage_tier` — unstarted / warming / progressing / strong / ready

The `MIN_ATTEMPTS = 2` threshold prevents a single lucky correct answer from counting as coverage. The `COVERAGE_THRESHOLD = 0.5` vs `MASTERY_THRESHOLD = 0.8` separation lets UI distinguish "I know this" from "I have mastered this."

Used by:
- `/api/my-giveaway` — per-bonus-exam enrichment
- `/api/me/gbrain-summary` — giveaway enrichment
- Future: teacher dashboards, exam-setup "readiness" display

---

## Design principles for future GBrain integrations

When adding a new feature, ask: **"Is there a decision this feature makes that a student would want personalized to them?"**

If YES → the feature should consume GBrain. Use the integration bridge (`src/gbrain/integration.ts`) helpers rather than raw mastery_vector access.

If NO (e.g., CMS content, admin config, identity) → GBrain-agnostic is correct. Don't force-fit.

**Three patterns have emerged:**

1. **Opt-in context passing** — feature accepts `ExamContext | null` or `StudentModel | null` and degrades gracefully when absent. Used by `after-each-attempt.ts` insights, exam-aware next-step, coverage computation.

2. **Auto-hydration in the HTTP handler** — handler looks up the signed-in user's model/context once, passes to downstream pure functions. Used by `attempt-insight`, `my-giveaway`, `gbrain-summary`.

3. **Derived signal over raw state** — expose a single concise signal (`focus_signal`, `coverage_tier`, `exam_urgency_tier`) rather than making every UI surface re-reason over raw mastery vectors. Used by `gbrain-summary` focus_signal, countdown chip tiers.

---

## What gets measured

Backend typecheck: ✅ clean (zero errors)
Frontend build: ✅ 37.87s
Student-facing features with GBrain integration: **12 of 13** (streak intentionally excluded)
Admin-facing features with GBrain integration: **5 of 5** where applicable

The only student-facing feature without GBrain integration is the daily streak counter — which is activity-tracked by design (every user's streak counts the same way regardless of mastery). Adding mastery to streaks would conflate two separate concepts that are better kept distinct.

---

## Files shipped in v2.10.0

New:
- `src/gbrain/cross-exam-coverage.ts` — per-exam coverage engine
- `src/api/me-routes.ts` — unified student summary endpoint
- `docs/GBRAIN-INTEGRATION-AUDIT.md` — this document

Modified:
- `src/api/exam-group-routes.ts` — `/api/my-giveaway` now enriches bonus exams with coverage + reorders by readiness
- `src/gate-server.ts` — register meRoutes
- `frontend/src/components/gate/GiveawayBanner.tsx` — renders per-exam coverage chips + "you're closest to this one" hint

Zero new npm dependencies. Zero breaking changes. Additive only.

---

## v2.13.0 — Every touchpoint, every attribute

The v2.13.0 sweep closes the remaining gaps identified in this audit and adds the machine-readable audit endpoint.

### New integrations

**1. Content four-tier cascade — now GBrain-biased.**
`/api/content/resolve` reads the student's mastery score for the requested concept. Struggling students (score < 0.3) get `max_tier` capped to 3 (tier-0 bundle + Wolfram verification only — no tier-2 LLM generation). Confident students get the full cascade. The bias is opt-in and additive: explicit `body.max_tier` still wins.

Response includes `gbrain_influence: { reason, score, cap }` so callers can audit why they got the tier they got — or `null` when GBrain didn't influence the decision.

**2. Syllabus view with mastery overlay.**
`GET /api/syllabus/me` returns the student's assigned exam's syllabus with per-concept mastery tier stamped on each concept:
- `mastered` (score ≥ 0.8 with ≥ 2 attempts)
- `in_progress` (score 0.3–0.8, or < 2 attempts)
- `struggling` (score < 0.3 with ≥ 2 attempts)
- `untouched` (zero attempts)

Sort order prioritizes attention: struggling → in-progress by exam weight → untouched by exam weight → mastered. Clients get a ready-to-render "where you stand across the syllabus" view without doing per-concept mastery lookups themselves.

**3. Speed of answering — threaded through enrichment.**
`MasterySignal` extended with `recent_avg_ms` + `cohort_median_ms`. The rendering route hydrates speed from `StudentModel.speed_profile[concept_id].avg_ms` and computes cohort median from the student's other concept speeds (median of samples when ≥ 3).

The enrichment rule: if a confident student (mastery ≥ 0.7) is *slow* (recent_avg_ms > 1.5 × cohort_median_ms), MCQ compression is suppressed. Their measured mastery doesn't reflect the automaticity MCQ exams actually test for — they need the full derivation to internalize the pattern.

**4. Explicit `days_to_exam` in LearningObjective.**
Previously rendering only saw `exam_is_imminent` (≤7d) and `exam_is_close` (≤30d) as booleans. Now the exact number of days is exposed too, enabling finer-grained adaptations in future enrichment rules without another signal-surfacing pass.

**5. Live audit endpoint.**
`GET /api/admin/gbrain-audit` returns the complete integration registry as JSON:
- Total feature count + integrated count + N/A count + gap count
- Student-facing coverage percentage
- Full GBrain signal surface grouped by category (mastery, exam_identity, exam_content, exam_structure, exam_schedule, speed, giveaway, derived)
- Per-feature rows with integration points, status, signals consumed, and shipped-in version

Requires admin role. The registry is a deliberate table, not auto-detected from imports — each row is an explicit claim about integration status.

### The complete GBrain signal surface (v2.13.0)

Every attribute now consumed by at least one integrated feature:

**Mastery:**
- `mastery_vector[concept_id].score` (0..1)
- `mastery_vector[concept_id].attempts`
- `mastery_vector[concept_id].last_error_type` (conceptual / careless / computational)
- `recent_attempts` (full history, newest last)
- Derived tiers: mastered / in_progress / struggling / untouched

**Exam identity:** exam_id, exam_code, exam_name, exam_level

**Exam content:** syllabus_topic_ids, topic_weights, priority_concepts

**Exam structure:** question_types mix, marking_scheme.negative_marks_per_wrong, duration_minutes + total_marks (derives avg_seconds_per_question)

**Exam schedule:** days_to_exam, exam_is_close, exam_is_imminent, typical_prep_weeks

**Speed:** speed_profile[concept_id].avg_ms, speed_profile[concept_id].by_difficulty, cohort_median_ms (derived)

**Giveaway:** group_id, primary_exam + bonus_exams, per-bonus coverage_percent, coverage_tier

**Derived:** focus_signal, is_slow_for_cohort, is_fallback, dominant_type

### Coverage summary at v2.13.0

| Surface | Integrated | Not applicable | Gap |
|---------|-----------:|---------------:|----:|
| Student | 13 | 1 | 0 |
| Teacher | 2 | 0 | 0 |
| Admin | 3 | 3 | 0 |
| Content | 1 | 3 | 0 |
| Infra | 0 | 9 | 0 |
| **Total** | **19** | **16** | **0** |

Student-facing coverage: **100% of applicable features**. The one student-facing "not applicable" is the daily streak counter, which is activity-tracked by design (mastery would conflate two distinct concepts).

The live `/api/admin/gbrain-audit` endpoint returns this same table at any time — use it to confirm no new gaps have crept in.
