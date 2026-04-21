# Lesson Framework — Research & Design

**Status:** Implemented v2.5.0
**Scope:** How Vidhya delivers content that is pedagogically optimal, source-attributed, and personalized via opt-in layering.

---

## 1. The problem

Most LLM edtech products deliver content one of two ways:

1. **Generate on demand.** Student asks a question → LLM writes a response. Problems: expensive at scale, unverified, inconsistent quality, no pedagogical structure.

2. **Pre-authored, static.** A textbook-chapter clone. Problems: no personalization, no student-state awareness, no interactive engagement.

Both miss the point: **learning is a process**, not a lookup. A well-designed lesson is the atomic unit of that process. It has structure (a known sequence of cognitive steps), sources (attributed, licensed), and slots where personalization belongs (without contaminating the base).

Vidhya's answer: the **Lesson** — a structured 8-component object assembled from multiple sources, cacheable, attributable, and personalizable *by layering*, not substitution.

---

## 2. Evidence-based pedagogical principles

Every component of a Lesson is grounded in a research-backed principle. We cite the principles, not specific papers, to stay concise — a bibliography is at the end.

| Principle | What it says | Where it shows up |
|-----------|--------------|-------------------|
| **Worked-examples effect** | For novices, studying fully-worked examples beats pure problem-solving. Reduces cognitive load; accelerates schema formation. | `worked_example` component |
| **Testing effect** (retrieval practice) | Active retrieval beats re-reading by wide margins for durable memory. | `micro_exercise` + spaced review |
| **Interleaved practice** | Mixing problem types improves long-term transfer, even though it feels harder. | Related-problems recommender |
| **Spaced repetition** | Distributed study beats massed study for long-term retention. | SM-2 scheduler |
| **Elaborative interrogation** | Asking "why does this work?" produces deeper processing than passive reading. | `hook` + self-check prompts |
| **Dual coding** | Combining verbal + visual aids encoding. | `intuition` (text + optional diagram) |
| **Concrete → abstract** | Build intuition first, then formalize. | Component order: intuition before formal statement |
| **Prerequisite sequencing** | Master building blocks before composition. | Concept graph DAG, prereq walk |
| **Zone of Proximal Development** | Content should be just beyond current ability. | Personalizer ZPD fit |
| **Cognitive Load Theory** | Manage intrinsic + extraneous + germane load; segment to avoid overload. | 8-component card-at-a-time delivery |
| **Feedback specificity** | Elaborative feedback > verification feedback. | `common_traps` + explained answers |
| **Desirable difficulties** | Slight challenge in study produces durable learning even when performance dips. | Spaced schedule includes challenging retrieval |

---

## 3. The atomic unit — a Lesson

A Lesson is an 8-component structured object for one concept:

```
1. Hook               — "Why should you care?"
2. Definition         — Canonical + plain-English
3. Intuition          — Visual, analogy, "imagine..."
4. Worked Example     — Full solution with self-check prompts
5. Micro-Exercise     — 30-second retrieval practice
6. Common Traps       — Misconceptions explicitly surfaced
7. Formal Statement   — The math, LaTeX-rendered
8. Connections        — Prerequisites + dependents map
```

Each component is:
- Optional (falls back cleanly if no source has data)
- Attributed (every component carries `source` + `license`)
- Independently renderable (each can be its own card)
- Personalizable (the personalizer can expand, collapse, skip, reorder)

**Target length:** 5-10 minutes of active study. Short enough to complete in one sitting; long enough to build a real mental model.

---

## 4. Source aggregation — explicit priority order

Four source categories feed the composer:

1. **User materials** (from /materials upload, client-side RAG)
2. **Bundle** (curated canonical content — OpenStax, OCW, GATE)
3. **Wolfram** (computed examples, verified values)
4. **Concept graph** (prerequisite/dependent structure, definitions)

**Priority rule** (highest to lowest):

```
USER > BUNDLE > WOLFRAM > GRAPH
```

**Rationale:**

- **User materials first** because personal context is maximally resonant. If a student uploaded their professor's notes on eigenvalues, citing those notes (with their professor's notation) beats citing OpenStax. This is the **"resonant"** in "personalized interactive resonant content" — their world, their words.

- **Bundle second** because it's the canonical, peer-reviewed, license-clean content we trust as a foundation. If user materials don't cover a component, fall back to the canon.

- **Wolfram third** for computed values — it's great at "what's the answer to this problem" but not great at pedagogy. Use it for worked examples and verification, not for intuition-building.

- **Concept graph fallback** — always present, never rich. Guarantees every concept has *some* content rather than a blank slot.

**Attribution is preserved** across aggregation. A lesson on eigenvalues might cite (user's notes for hook) + (OpenStax for definition) + (OCW Gilbert Strang for intuition) + (Wolfram for a verified example) + (concept graph for connections) — and the UI shows each.

---

## 5. Personalization as opt-in layering

**The base lesson works for anyone.** No personalization required. This matters because:

1. **First-time visitors** (no student model yet) shouldn't see a broken experience
2. **Anonymous browsing** (no session) should still work
3. **Graceful degradation** — if IndexedDB is wiped, content still renders correctly

Personalization is a **layer on top**, applied only when a `StudentSnapshot` is passed:

| Layer | Trigger | Effect |
|-------|---------|--------|
| Skip Hook | High topic mastery (>0.75) | Student already motivated; skip straight to content |
| Expand Intuition | Abstract concept + low mastery | More analogies, more visual cues |
| Surface User-Material Worked Example | Materials contain a relevant example | Use their teacher's notation |
| Expand Common Traps | Matching error type in recent history | Preemptively address the specific misconception |
| Collapse Formal Statement | Introductory scope (mcq-fast) | Save deep math for later |
| Reorder Components | Re-visit (spaced review) | Lead with micro-exercise (retrieval practice) |
| Adjust Worked Example Difficulty | ZPD match | Examples at student's current difficulty |

Each layer is idempotent and composable. Missing student state = identity transform.

---

## 6. Related-problems recommender

After a lesson, the student sees 2-3 recommended practice problems. These are chosen by:

1. **Primary concept** — same concept, just-above-current difficulty (push the ZPD)
2. **Interleaved concept** — a related concept via the graph (combat over-blocking)
3. **Prerequisite review** — if a prereq was weak, a low-difficulty prereq problem

This uses the existing **four-tier content resolver**, so it's cost-free (tier-0 bundle hits) ~80% of the time.

---

## 7. Spaced retrieval — SM-2 scheduler

After completing a lesson, Vidhya schedules a return visit using a simplified SuperMemo-2 algorithm:

```
interval_next = max(1, round(interval_prev * EF))
EF_next = max(1.3, EF_prev + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
```

Where:
- `q` ∈ {0..5} comes from the student's micro-exercise performance + recent practice on the concept
- Initial `interval = 1 day`, `EF = 2.5`
- After failure: `interval = 1`, `EF` drops
- After easy success: `interval` multiplies, `EF` grows

The scheduler surfaces "review today" concepts via `GET /api/lesson/review-today`. The student is **never** forced to review; they can ignore the list. Consistent with the "no-nagging" UX: retrieval is offered as an option, not pushed.

---

## 8. Quality measurement

Each component has an engagement signal:

- `viewed` — component appeared on screen for ≥ 3 seconds
- `revealed` — student tapped to reveal hidden content (e.g., self-check answer)
- `completed` — student marked it done or answered correctly
- `skipped` — student moved past without interaction

These feed into:
1. **Lesson quality metrics** — aggregate engagement per component, per concept
2. **Student model update** — mastery adjustment based on micro-exercise result
3. **Content quality tuning** — poorly-engaged components surface in admin dashboard for curator review

---

## 9. Cost model

Lessons are **mostly free to deliver**:

| Operation | Cost | Frequency |
|-----------|------|-----------|
| Compose base lesson from bundle | $0 | Every request (cacheable) |
| Personalize with student snapshot | $0 | Every request (pure function) |
| Related-problems resolve | $0 (tier 0) | Every request |
| Spaced scheduler compute | $0 | Every request |
| LLM generation (fallback only) | ~$0.0003 | Rare — only if bundle + materials are both empty |

Typical per-lesson cost: **$0**. LLM calls happen only when a concept has no bundle content AND no user material — a small minority of lessons in a mature deployment.

---

## 10. Why this is state-of-the-art

**Novel combinations:**

1. **Structured template + LLM-backed fallback** — most systems are either rigid (text only) or free-form (LLM only). Vidhya's composable 8-component template gives structure but degrades gracefully when sources are thin.

2. **User materials as first-class source** — most systems either treat user uploads as search-only (not integrated into delivery) or not at all. Vidhya's RAG system makes them the *highest priority* source for resonant content.

3. **Personalization-as-layering** — most adaptive systems entangle base content and student state. Vidhya's separation means the same base lesson can ship to 1000 students with 1000 different personalizations — deterministic, cacheable, auditable.

4. **Attribution-preserving aggregation** — the moment you combine sources, most systems lose attribution. Vidhya carries per-component attribution through composition, so the UI can show "Intuition from MIT OCW 18.06 (CC-BY-NC-SA) · Example from your uploaded notes · Verification by Wolfram".

5. **No-nagging retrieval** — spaced repetition without forcing. Offer, don't impose.

**Research lineage:**

- Worked-examples effect — Sweller, J. (1985, 2011)
- Testing effect — Roediger, H.L., Karpicke, J.D. (2006)
- Interleaved practice — Rohrer, D. (2012)
- Spaced repetition — Cepeda, N. et al. (2006); Anki/SuperMemo (Wozniak)
- Elaborative interrogation — Chi, M.T.H. et al. (1994)
- Dual coding — Paivio, A. (1971, 1986)
- Cognitive Load Theory — Sweller, J. (1988, 2011)
- Zone of Proximal Development — Vygotsky, L. (1978)
- Cognitive Tutor — Anderson, J.R., Corbett, A. (Carnegie)
- Bayesian Knowledge Tracing — Corbett & Anderson (1995)

---

## 11. Implementation surface

| Module | Purpose |
|--------|---------|
| `src/lessons/types.ts` | Schema for Lesson, Component, EngagementSignal |
| `src/lessons/source-resolver.ts` | Aggregates from user materials / bundle / Wolfram / graph |
| `src/lessons/composer.ts` | Pure function: sources → base Lesson |
| `src/lessons/personalizer.ts` | Student-aware layering, pure function |
| `src/lessons/spaced-scheduler.ts` | SM-2 retrieval interval compute |
| `src/api/lesson-routes.ts` | HTTP surface: GET lesson, POST engagement, GET review-today |
| `frontend/src/pages/gate/LessonPage.tsx` | Card-based lesson reader |

---

## 12. What this is NOT

- **Not a replacement for the chat.** Chat is conversational; lessons are structured. They complement each other.
- **Not a replacement for practice.** Practice is retrieval; lessons are acquisition. Both are needed.
- **Not a mandatory path.** Students can use any of: chat, snap, materials, smart-practice, lessons, mock-exam. Lessons are one doorway, not the doorway.
- **Not gamification.** No streaks, no badges, no "you're on fire 🔥". Just content, well-delivered.

---

*This document is the source of truth for the Lesson subsystem design. Changes to the 8-component template or priority order should be proposed here first.*
