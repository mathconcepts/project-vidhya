# Exam Profile Schema v1

**Status:** v1, adopted for the GATE→JEE expansion track
**Scope:** the data contract every exam must satisfy to plug into the engine

---

## The rule, stated up top

> **Any future exam that cannot be expressed in this schema is naming a missing CAPABILITY, not a missing field.**

If an exam needs something the schema doesn't have a row for, the fix is never "add a bespoke field for this one exam." The fix is: name the capability the engine is missing, scope it as a versioned engine change (see [capability-register.md](./capability-register.md)), and land the field once, generically, for every exam that needs it. A schema that grows a new column per exam is a schema quietly turning into a pile of special cases — that's the failure mode this rule exists to block.

## Why this exists

Vidhya is exam-agnostic by design (see [EXAM-FRAMEWORK.md](./EXAM-FRAMEWORK.md) for the dynamic admin-facing exam registry this complements). But "exam-agnostic" only means something if there's a single, enumerable answer to "what does the engine need to know about an exam to run it correctly?" This document is that answer: **one exam = one data row.** Everything downstream — marking arithmetic in EV coaching, the hero readiness counter, the mock-exam UI chrome, the onboarding consent flow — reads from this row instead of hardcoding assumptions about "the exam" (which today silently means GATE).

The two rows below are not symmetric in confidence, and that asymmetry is the point:

- **GATE-EM is fact.** Every field is sourced from the official GATE exam pattern and marking scheme. It's what the engine was built against.
- **JEE Main is hypothesis.** The row is a best-effort draft pending verification against the current-year NTA notification at authoring time. Treat every JEE cell as "confirm before you ship a marking-dependent feature on it," not as settled truth. Fields marked "confirm current ... scheme at authoring time" are not filled in casually — official marking schemes shift year to year (NTA has changed the JEE Main negative-marking and numeric-question rules more than once).

## The schema

| Field | GATE-EM (fact) | JEE Main (hypothesis — not yet validated) |
|-------|----------------|--------------------------------------------|
| `marking_table` (per question type) | MCQ +1/−⅓ or +2/−⅔ · MSQ no negative, no partial unless verified · NAT no negative | MCQ +4/−1 · numeric +4/0 — confirm current NTA scheme at authoring time |
| `question_types` | mcq, msq, nat | mcq, numeric |
| `attempt_calendar` | single annual date | 2 sessions/year, best-of-two aggregation; user-level `target_attempt`; Advanced behind Main |
| `score_currency` | raw_marks (cutoff-based) | normalized_percentile (shift-normalized) — hero counter must re-derive or wear a raw-marks-proxy label |
| `schedule_authority` | self-directed | institute-directed (majority) — recommender repositions as a review/weak-spot layer constrained to covered chapters |
| `account_holder` / consent | adult self | minor; DPDP-compliant parental consent required — **NAMED BLOCKER on the JEE pilot gate** |
| `mock_format` | GATE CBT mirror (3h, palette, calculator policy) | NTA CBT mirror (session-length, own palette) |
| `tone_register` | adult, career-stakes | 16-17yo, anxiety-aware, parent-visible |
| `parent_role_weight` | low (E8 optional) | high — digest defaults stronger |
| `syllabus_pack` | `gate-em.yml` (80-node graph) | `jee-main.yml` (stub → ~60-90 concepts) |
| `accent_token` / brand strings | GATE set | JEE set |
| `exam_date(s)` | data, not code | per `attempt_calendar` |

## Reading the schema

- **Rows are fields, columns are exams.** Adding exam N means adding a column, filled from this same field list — never adding a new field just for N. If N genuinely needs a 13th field, that's new schema work done once, for every exam, not a JEE-only or N-only patch.
- **`marking_table` and `score_currency` are the highest-risk fields.** They're the two most likely to be silently hardcoded elsewhere in the engine (see the capability register for the known GATE-shaped hardcodes tied to these). Any feature that touches EV coaching, the marks-saved counter, or readiness bands should read these two fields from the exam's row, not assume GATE's values.
- **`account_holder` / consent is a hard gate, not a UX nicety.** JEE's row marks it a named blocker on the pilot gate because DPDP-compliant parental consent for a minor is a legal precondition for onboarding JEE users at all — it has to clear before JEE's first 5-user pilot checkpoint, not after.
- **This schema doesn't replace the dynamic exam registry** described in [EXAM-FRAMEWORK.md](./EXAM-FRAMEWORK.md) (`.data/exams.json`, admin-editable, progressively enriched). That registry is the admin-facing CRUD surface for exam metadata in general. This document is the narrower, engine-facing contract for the specific fields that gate capability selection — see [capability-register.md](./capability-register.md) for how a filled-in row turns into engine behavior.

## See also

- [capability-register.md](./capability-register.md) — the capability model this schema selects from, and the honest ledger of GATE-shaped hardcodes still to lift
- [add-an-exam-recipe.md](./add-an-exam-recipe.md) — the concrete step-by-step for turning a new exam into a filled-in row plus everything else it needs
- [EXAM-FRAMEWORK.md](./EXAM-FRAMEWORK.md) — the existing admin-facing dynamic exam registry
