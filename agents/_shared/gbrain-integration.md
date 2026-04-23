# GBrain — The cognitive spine of the Vidhya agent organisation

GBrain is not a module that some agents happen to call. It is the
cognitive spine that every cognitively-dependent agent leans on.
This document is the canonical integration contract — which agents
read from GBrain, which agents write to it, which modules matter, and
what the validator enforces.

## Why GBrain is structural, not optional

The four core promises in [`constitution.md`](./constitution.md)
cannot be delivered without GBrain:

- **Compounding** is GBrain's persistent Bayesian student model. Every
  attempt updates the model; every session reads from it. Without
  GBrain, effort does not compound — it evaporates.

- **Strategy** is GBrain's `exam-strategy` and `task-reasoner`
  modules. Strategic advice on day 3 versus day 180 comes from
  exam-context-aware inference over the model. Without GBrain, advice
  is generic.

- **Focus** is GBrain's weak-spot surfacing via `error-taxonomy` plus
  `cross-exam-coverage`. The teaching surface focuses because GBrain
  tells it which concepts matter most right now. Without GBrain,
  focus is the student's burden.

- **Calm** is GBrain's local-first, on-device model posture. Student
  state lives in the browser; no server-side analytics table exists.
  Without GBrain's local-first architecture, the no-harvest promise
  has no structural basis.

Every agent that makes cognitive decisions about a student is
required to declare a GBrain dependency. The validator enforces this.

## The eight modules that matter

GBrain exposes a specific, stable surface:

| Module | Path | What it provides |
|---|---|---|
| **student-model** | `src/gbrain/student-model.ts` | Core Bayesian model — `MasteryEntry`, 15 attributes, mastery query & update |
| **error-taxonomy** | `src/gbrain/error-taxonomy.ts` | The 7 error categories — `ErrorType`, classification rules |
| **task-reasoner** | `src/gbrain/task-reasoner.ts` | Intent inference — `StudentIntent`, what the student is trying to do |
| **problem-generator** | `src/gbrain/problem-generator.ts` | Calibrated problems — `GeneratedProblem` shaped by current model |
| **exam-strategy** | `src/gbrain/exam-strategy.ts` | Exam-aware strategy — proximity-weighted priorities |
| **after-each-attempt** | `src/gbrain/after-each-attempt.ts` | The attempt → insight → model-update hook |
| **integration** | `src/gbrain/integration.ts` | Bridges GBrain to lesson rendering, session planning |
| **cross-exam-coverage** | `src/gbrain/cross-exam-coverage.ts` | Multi-exam reconciliation |

## Who reads, who writes

### Writes to GBrain

Only agents that have genuine authority to *change* the student model
write to it. All writes go through the `after-each-attempt` hook —
there is no other write path.

| Agent | Write purpose |
|---|---|
| **student-model-manager** | Authoritative model operations — reads and writes |
| **assessment-manager** (via `attempt-insight-specialist`) | Every recorded attempt invokes `after-each-attempt` before the response returns |

No other agent writes. Attempting a write outside these two paths
raises `unauthorised-gbrain-write` and the attempt is logged for
audit.

### Reads from GBrain

Several agents read — all read-only, idempotent, no side effects.

| Agent | Reads what | Why |
|---|---|---|
| **planner-manager** | `student-model` + `exam-strategy` + `cross-exam-coverage` + `task-reasoner` | Strategic session planning — mastery, proximity weighting, intent |
| **teaching-manager** | `integration` + `student-model` + `problem-generator` | Select explainer depth, generate calibrated problems, pick the right intuition for *this* student |
| **authoring-manager** | `error-taxonomy` (read-only reference) | Design explainers that target specific error categories |
| **feedback-manager** | Via peer query to `student-model-manager` | Triage — route feedback into CCO lanes based on cohort mastery |
| **cdo** | All modules (observational only) | Departmental oversight — ensure on-device invariant holds |

### Signals GBrain emits

GBrain emits four signals into the event bus (via
`student-model-manager`):

- `concept-mastery-changed` — a student crossed a mastery threshold
- `student-inactive-7-days` — no attempts logged in 7d
- `cohort-misconception-cluster` — opt-in cohort aggregation
- `error-category-shift` — a student's error pattern has moved

Subscribers include `planner-manager` (invalidate priority cache),
`teaching-manager` (refresh weakness-aware hints), and `cpo`
(aggregate product health).

## Invariants GBrain holds

These are constitutional — any agent proposing to relax them
escalates to CEO:

1. **Local-first storage.** Student model state lives in IndexedDB on
   the student's device. The server carries no per-student mastery
   table. Opt-in anonymous deltas may be aggregated — but *only*
   after k-anonymity ≥ 30 is enforced by `telemetry-manager`.

2. **Deterministic updates.** Given the same event stream, the model
   reaches the same state. This makes replay, reproducibility, and
   audit possible.

3. **All writes through `after-each-attempt`.** No shadow write path.
   The hook is the contract.

4. **Idempotent attempt processing.** Replaying the same attempt does
   not double-update the model. Idempotency is enforced by attempt
   `(student_id, concept_id, timestamp)` dedup.

5. **No PII in cohort aggregates.** `telemetry-manager` strips user
   identifiers at the edge; aggregates carry only `(exam × concept ×
   difficulty × outcome)` keys.

## The integration pattern

A typical agent that reads GBrain declares it like this in its
manifest:

```yaml
owned_tools:
  - type: module
    id: 'src/gbrain/student-model'
    purpose: Read the student's current mastery + attribute state
             before composing a session plan.
  - type: module
    id: 'src/gbrain/exam-strategy'
    purpose: Apply exam-proximity weighting to the priority order.
```

A typical agent that writes to GBrain declares it like this:

```yaml
owned_tools:
  - type: module
    id: 'src/gbrain/after-each-attempt'
    purpose: Invoke the attempt → insight → model-update hook after
             every logged student attempt.
```

## What the validator enforces

`agents/validate-graph.py` carries a GBrain-specific invariant check:

> Every agent in the "cognitively-dependent" set MUST declare at
> least one `src/gbrain/*` module in its `owned_tools`. Missing
> declarations raise a validation error.

The cognitively-dependent set is:

```
cdo
student-model-manager
planner-manager
teaching-manager
assessment-manager
authoring-manager
feedback-manager
```

If any of these agents' manifests lose their GBrain declaration, the
validator fails and the PR cannot merge.

## Adding a new agent that needs GBrain

1. In the manifest, add one or more `src/gbrain/*` entries to
   `owned_tools`.
2. If the agent will *write*, ensure the write goes via
   `after-each-attempt`. Other write paths will be rejected.
3. If the new agent needs a GBrain signal, subscribe via
   `subscribes_to` — do not poll the model.
4. Add the agent's id to the cognitively-dependent set in
   `validate-graph.py` if it belongs there. The validator will then
   enforce the GBrain dependency on the new agent too.

## When an agent does *not* use GBrain

Most infrastructure, platform, and marketing agents do not. This is
correct — not every capability in the organisation is cognitive.
Explicitly non-GBrain agents include:

- `ceo` (strategic, not cognitive)
- All C-suite agents except `cdo` (oversight through their managers)
- All CTO-lane managers (infrastructure, llm-router, security)
- All CMO-lane managers (outreach, seo)
- All COO-lane managers (task, health)

The org's cognitive centre of gravity is the CPO + CDO departments.
The rest of the organisation serves them.
