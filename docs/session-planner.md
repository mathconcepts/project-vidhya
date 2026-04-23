# Student Session Planner

The session planner is the student-facing answer to "I've got 8 minutes right now — what should I do?"

It takes your current state — topic confidence, recent accuracy per topic, how many minutes you have, when your exam is — and returns an ordered list of concrete, time-budgeted actions that fit in your available time.

---

## The three primitives it composes

1. **Priority engine** (`src/engine/priority-engine.ts`) — ranks topics by `marks_weight × weakness × improvement_speed × recency_due × exam_proximity`. This tells the planner *which* topics matter most for this student right now.

2. **Attention resolver** (`src/attention/resolver.ts`) — takes your available minutes and classifies the session as `nano` (≤3), `short` (3–10), `medium` (10–25), or `long` (>25), then derives an `AttentionStrategy`: how many recommendations to surface, which difficulty mix fits, what lesson components to expose, whether to bias toward quick wins or prerequisite repair.

3. **Session planner** (`src/session-planner/planner.ts`) — intersects the two. Strategy says "3 recommendations, quick-win bias"; priorities say "linear algebra is the top gap"; planner produces a concrete "Practice Linear Algebra · Easy · 2 questions · 4 min" card.

The planner core is **pure**. Same inputs → same plan. That keeps tests deterministic and lets the HTTP layer and any future CLI / MCP tool share it.

---

## Request shape

```json
POST /api/student/session/plan
Authorization: Bearer <student JWT>
Content-Type: application/json

{
  "exam_id": "EXM-UGEE-MATH-SAMPLE",
  "minutes_available": 8,
  "exam_date": "2026-08-15",
  "topic_confidence": {
    "linear-algebra": 2,
    "calculus": 4
  },
  "diagnostic_scores": {
    "linear-algebra": 0.35,
    "calculus": 0.82
  },
  "sr_stats": [
    {
      "topic": "linear-algebra",
      "accuracy": 0.35,
      "sessions_count": 8,
      "accuracy_first_5": 0.30,
      "accuracy_last_5": 0.40,
      "last_practice_date": "2026-04-22T12:00:00Z"
    }
  ],
  "weekly_hours": 10,
  "trailing_7d_minutes": 60
}
```

Only `exam_id`, `minutes_available`, and `exam_date` are required. Everything else improves plan quality but has sensible defaults.

`student_id` is **not** accepted in the body — the server derives it from the authenticated JWT, so one user cannot query another's history.

## Response shape

```json
{
  "id": "PLN-abc12345",
  "generated_at": "2026-05-01T10:00:00Z",
  "request": { ... echoed ... },
  "budget": {
    "minutes_available": 8,
    "context": "short",
    "source": "student_declared",
    "historical_avg_minutes": 10
  },
  "strategy": {
    "mock_question_count": 3,
    "mock_difficulty_mix": { "easy": 0.5, "medium": 0.4, "hard": 0.1 },
    "lesson_components_to_surface": ["hook", "worked-example", "common-traps"],
    "gbrain_max_recommendations": 2,
    "gbrain_bias": "quick_win",
    ...
  },
  "top_priorities": [
    { "topic": "linear-algebra", "priority": 4.2, "marks_weight": 0.15,
      "weakness": 0.7, "improvement_speed": 1.2, "recency_due": 1.4,
      "exam_proximity": 0.55, "reason": "..." },
    ...
  ],
  "actions": [
    {
      "id": "ACT-1",
      "kind": "spaced-review",
      "title": "Quick review: Linear Algebra",
      "rationale": "You practiced this 9 days ago with 35% accuracy. Spaced-review window is open.",
      "estimated_minutes": 3,
      "content_hint": {
        "topic": "linear-algebra",
        "difficulty": "easy",
        "count": 1
      },
      "priority_score": 4.2
    },
    {
      "id": "ACT-2",
      "kind": "practice",
      "title": "Practice Linear Algebra · Easy",
      "rationale": "This is one of your weaker topics. It's a high-weight area (15% of exam marks).",
      "estimated_minutes": 4,
      "content_hint": {
        "topic": "linear-algebra",
        "difficulty": "easy",
        "count": 2
      },
      "priority_score": 4.2
    }
  ],
  "total_estimated_minutes": 7,
  "headline": "8 minutes on Linear Algebra — focused and deliberate."
}
```

The `content_hint` is the bridge from plan → content. Your frontend feeds it straight into the four-tier content resolver (`src/content/resolver.ts`) to fetch the actual questions or lesson components.

## Invariants

- `sum(actions[].estimated_minutes) ≤ budget.minutes_available` — the planner never over-packs.
- At least one action is always returned — even a 1-minute budget produces a lightweight review rather than an empty plan.
- Plans are persisted for audit — `GET /api/student/session/plans` lists your recent plans (last 50 per student), `GET /api/student/session/plans/:id` fetches one.
- Same request → same plan (modulo the random plan id). The planner core is a pure function.

## Action kinds

| Kind | When it appears | Estimated time |
|------|-----------------|:---:|
| `spaced-review` | A topic practiced ≥3 days ago with <60% accuracy | ~3 min |
| `review` | Nano-budget sessions lead with a definition/worked-example review rather than practice | ~2–3 min |
| `practice` | The main action — 1-N questions on a priority topic at strategy-chosen difficulty | 2–5 min each |
| `micro-mock` | Medium+long sessions with ≥8 minutes remaining after main practice | 8–15 min |

## What the planner does NOT do

It does not generate questions or fetch content. It returns **hints** — `(topic, difficulty, count)` tuples — that the frontend then routes through the content resolver. Separation of concerns:

- **Planner**: which topic, which difficulty, how many, in what order, and why.
- **Content resolver**: where does the actual question text come from (tier-0 bundle → tier-1 RAG → tier-2 LLM → tier-3 Wolfram-verified).
- **GBrain**: what happens after each attempt (mastery update, next-step recommendation).

Keeping these separate means changing the content delivery backend doesn't break planning, and changing priority signals doesn't break content.

## Examples

### Short session on the bus

```
budget: { minutes_available: 8, context: 'short' }
headline: "8 minutes on Linear Algebra — focused and deliberate."
actions:
  1. [spaced-review]  Quick review: Linear Algebra        (3 min)
  2. [practice]       Practice Linear Algebra · Easy      (4 min, 2 questions)
total: 7 minutes
```

### Nano session — waiting in line

```
budget: { minutes_available: 2, context: 'nano' }
headline: "2 minutes — keep the thread live."
actions:
  1. [review]  Review: Linear Algebra   (2 min, 1 concept refresher)
total: 2 minutes
```

### Weekend deep-work session

```
budget: { minutes_available: 60, context: 'long' }
headline: "60 minutes across Linear Algebra, Probability & Statistics and 1 more."
actions:
  1. [spaced-review]  Quick review: Differential Equations  (3 min)
  2. [practice]       Practice Linear Algebra · Medium      (9 min, 3 questions)
  3. [practice]       Practice Probability & Statistics · Medium  (9 min, 3 questions)
  4. [practice]       Practice Calculus · Hard              (10 min, 2 questions)
  5. [practice]       Practice Differential Equations · Easy (6 min, 3 questions)
  6. [micro-mock]     Micro-mock · 3 topics                 (15 min, 5 questions mixed)
total: 52 minutes
```

The deep session surfaces more actions, harder difficulties, and a capstone micro-mock that simulates exam conditions.
