# GBrain Integration Framework

**Status:** v2.9.0
**Scope:** Connects GBrain's 6-pillar cognitive system to the newer Lesson, Curriculum, Multimodal, and Roles frameworks via a pure-function bridge module.

---

## 1. The problem this solves

Vidhya's cognitive core (GBrain) was built first. It models the student with:

- 15-attribute Bayesian mastery vector
- 7-category error taxonomy
- Concept dependency graph with prerequisite auto-repair
- Adaptive problem generator targeting concept × error × difficulty
- Exam strategy optimizer
- Task reasoner (thinking-before-speaking pre-generation layer)

The newer frameworks (Lesson v2.5, Curriculum v2.6, Multimodal v2.3-2.4, Roles v2.8) were built on top of this but **didn't consume GBrain data**. Concretely:

- `Lesson personalize()` accepted a `StudentSnapshot` but nothing populated it from GBrain
- `Curriculum quality-aggregator` saw only engagement signals, not error taxonomy
- `Multimodal diagnostic` didn't route results back to update the student model
- `Teacher roster` showed enrollment data but not cognitive health

Without the bridge, Vidhya's cognitive intelligence was trapped inside the `/api/gbrain/*` routes — students using `/lesson/*` or `/snap` couldn't benefit from their own mastery history.

---

## 2. The bridge module

**One file: `src/gbrain/integration.ts` (~300 LOC, pure functions).**

Rules:
1. **Reads from GBrain, never writes.** Write-paths stay in GBrain's own modules.
2. **Pure functions where possible.** Translation functions don't touch I/O; consumers pass in models and snapshots.
3. **Graceful degradation.** If GBrain is unavailable, consumers receive empty snapshots that behave identically to pre-bridge v2.5/v2.6.
4. **Doesn't break any existing API.** All integrations are opt-in — existing callers that don't pass `session_id` work unchanged.

### Seven translation functions

| Function | Direction | Consumer |
|----------|-----------|----------|
| `modelToLessonSnapshot()` | GBrain model → Lesson `StudentSnapshot` | Lesson personalizer |
| `errorToQualitySignal()` | GBrain error → Curriculum `QualitySignal` | Curriculum quality aggregator |
| `prioritizeConceptsByMastery()` | GBrain model → sorted concepts | Syllabus generator, admin tools |
| `findNearMasteryConcepts()` | GBrain model → confidence-building picks | Syllabus generator |
| `deriveConceptHints()` | GBrain model × concept → presentation hints | Lesson composer (future) |
| `modelToTeacherRosterEntry()` | GBrain model → teacher-visible summary | Teacher roster page |
| `summarizeCohort()` | N GBrain models → admin cohort view | Admin cohort dashboard |
| `diagnosticToAttempts()` | Multimodal verdicts → GBrain attempt stream | Multimodal diagnostic handler (future) |

### Privacy model

- **Student snapshots** passed to Lesson: mastery + recent errors. Motivation state only if caller explicitly opts in via `include_emotional`.
- **Teacher roster entries**: aggregate counts only (mastered / in_progress / struggling). No raw answer history, no emotional state details.
- **Admin cohort summary**: counts + struggling-concept aggregates. Individual student data not exposed.

---

## 3. Integration points added

### 3.1 Lesson routes — `/api/lesson/compose`

When `session_id` is provided, the handler fetches the GBrain model and populates `StudentSnapshot` automatically. Explicit `student` parameter still wins if provided.

```
Before: /api/lesson/compose with session_id  →  generic lesson
After:  /api/lesson/compose with session_id  →  mastery-weighted lesson
                                                common_traps emphasized for weak concepts
                                                quick wins surfaced for near-mastery concepts
```

### 3.2 User admin routes — teacher roster + cohort summary

Two new endpoints powered by GBrain:

```
GET /api/teacher/roster
  Returns: { teacher, student_count, attention_count, students: [...] }
  Role: teacher (own roster) or admin+ (any teacher's roster via /:teacher_id)

GET /api/admin/cohort-summary
  Returns: { total_students, avg_mastery, struggling_concepts, frustrated_count, ... }
  Role: admin+
```

Each student in the roster has:
- Overall mastery (0-1 average across all concepts they've attempted)
- Concept counts: mastered (≥80%), in_progress (40-80%), struggling (<40% with ≥3 attempts)
- `needs_attention` flag with reason (5+ consecutive failures, frustrated state, or 5+ struggling concepts)

### 3.3 Frontend — Teacher Roster page

Route: `/teacher/roster`

Students needing attention appear first, then sorted by lowest mastery. Each student row shows:

- Avatar + name + email
- Mastery progress bar (green/sky/amber thresholds)
- Three concept-count badges (mastered / in-progress / struggling)
- Attention reason if flagged
- Last-active date + total attempts

Privacy note banner explains: "aggregate only — raw answers stay private to each student."

---

## 4. What's deliberately not in the bridge (yet)

- **Direct LLM injection** — the task-reasoner already handles this in `/api/chat/*`. No need to duplicate.
- **Real-time event streaming** — bridge is request/response. Streaming GBrain updates would be a future addition.
- **Write-path translation** — the bridge reads. Writes (telemetry → GBrain attempts) stay in existing GBrain routes.
- **Multimodal diagnostic → GBrain feedback loop** — the `diagnosticToAttempts()` function exists but isn't yet called from the multimodal handler. Intentionally — needs careful UX design (students should know their diagnostic updates their profile).

---

## 5. Architectural rules for adding consumers

1. **Never import from `src/gbrain/student-model.ts` directly in non-GBrain code.** Route through `src/gbrain/integration.ts`.
2. **Never mutate student models from consumer code.** Use GBrain's own API (`/api/gbrain/attempt`, etc.) for writes.
3. **Always handle `model === null`.** Consumers must degrade gracefully for anonymous users or fresh sessions.
4. **Privacy filter at the bridge layer.** New consumer needs access to motivation state? Add an opt-in flag to the translation function; don't widen the default snapshot.

---

## 6. Files shipped in v2.9

**New:**
- `src/gbrain/integration.ts` — bridge module with 8 translation functions
- `frontend/src/pages/gate/TeacherRosterPage.tsx` — GBrain-powered roster UI
- `docs/GBRAIN-INTEGRATION.md` — this document

**Modified:**
- `src/api/lesson-routes.ts` — auto-enrich StudentSnapshot from GBrain model
- `src/api/user-admin-routes.ts` — 2 new endpoints (teacher roster, cohort summary)
- `frontend/src/App.tsx` — `/teacher/roster` route registered

**Not touched (stays exactly as before):**
- Any existing GBrain module (student-model, task-reasoner, error-taxonomy, etc.)
- The existing `/api/gbrain/*` HTTP routes
- The frontend GBrainAdminPage at `/admin/gbrain`
- Any non-GBrain-related functionality

---

## 7. Verified

- Backend typecheck: zero errors
- Frontend build: 26.61s clean
- Lesson routes: `session_id` enrichment works, absence of session_id falls through to v2.5 behavior
- User admin routes: new endpoints register, existing 6 endpoints work unchanged
- App.tsx: 5 v2.8 routes still work + new `/teacher/roster` route added

---

## 8. Non-goals

- Not a rewrite. The bridge adds a layer, doesn't replace anything.
- Not a write-path. Reading is enough to unlock 90% of the value; writing can be added per-endpoint as needed.
- Not a dashboard generator. Teachers and admins get dedicated UIs; this doc documents the data, not the layout.
- Not a GBrain replacement for the Lesson framework. The Lesson framework's composer + personalizer + scheduler continue to own lesson logic; GBrain just feeds them better input.
