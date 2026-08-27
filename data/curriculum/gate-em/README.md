# GATE Engineering Mathematics — demand-side content layer

This directory holds the **demand-side** content structure for GATE Engineering
Mathematics: what students actually arrive asking for, per atomic sub-topic,
across all eight GATE papers that carry the Engineering Mathematics section
(CS, DA, CE, ME, EE, EC, IN, XE-A).

It complements — never replaces — the supply-side mastery spine in
`data/curriculum/gate-ma.yml` (`concepts:`), which stays the single source of
truth for the concept graph, Elo/FSRS keys, and prerequisite edges.

Design doc: `docs/designs/2026-08-25-intent-driven-content-restructure.md`.

## Files

| File | What it is |
|---|---|
| `atomic-catalogue.json` | 203 atomic sub-topics, one per searchable student query. Fields: intent, pain point, exam intent, learning objective, expected format, question-inventory targets, prerequisite atom graph, `concept_ids` mapping onto the mastery spine. |
| `intent-profiles.yml` | The four intent lanes (learn / clarify / solve / practice) with their stage sequences in blueprint vocabulary, plus eight module pain profiles with error-tag mappings and trap-drill briefs. |
| `historical-evidence.yml` | W1.2/E10 import (2026-08-27): 116 market-research-corpus topic ids (`LA-01`, `CA-01`, …) → `{topic, pattern, evidence: D\|P\|S}` — the corpus's own historical-question-pattern provenance from reviewing official GATE XE-A 2021–2023 papers ONLY. A **different id scheme** from `atomic_id`/`concept_id` above — no automatic join exists. Validated by `check-intent-catalogue.ts`'s B7 check. |
| `template-families.yml` | W2.1/E11 import (2026-08-27): the market-research corpus's 14 template families (matrix, eigen, limit, derivative, integral, optimization, vector, ode, pde, complex, probability, statistics, numerical, discrete), each with a stage sequence in the locked blueprint vocabulary (`src/blueprints/types.ts` StageKind/AtomKind) + `presentation` hints, plus a `coverage` map assigning every `src/constants/concept-graph.ts` concept to exactly one family. Codegen'd (with `intent-profiles.yml`) into `src/blueprints/intent-tables.gen.ts`'s `FAMILY_STAGE_SEQUENCES` / `CONCEPT_TEMPLATE_FAMILY` by `scripts/generate-intent-tables.ts` — ONE merged codegen, not a second one. Validated by `check-intent-catalogue.ts`'s B8-B13 checks. |

## Contract

- **`atomic_id` (AT-001 … AT-203) is a stable taxonomy key.** Content,
  questions, analytics and SEO routes join on it. Never renumber.
- **`intent` is the atom's PRIMARY intent** — the default lane its page opens
  in. Every page still serves all four lanes.
- **`concept_ids` maps an atom onto the mastery spine.** Many-to-many by
  design: mastery, Elo, FSRS and FIRe stay keyed on `concept_id`; pages,
  search, SEO and question inventory key on `atomic_id`. Linear Algebra
  (AT-001…AT-026) is fully mapped; other modules map in later phases — an
  empty list means "not yet mapped", never "no concept exists".
- **`question_inventory` is a planning floor, not measured need.**
  `mcq_target + msq_target + nat_target == target_total` (45/40/35 by module —
  module-level planning constants from the research workbook, not
  demand-derived). `pyq_variant_target` is an **overlay**: how many of those
  items should be authored as variants of real PYQs — never a fourth additive
  bucket. `difficulty_mix` is structured (`foundation/standard/stretch`
  percentages summing to 100). The syllabus-floor CI gate grows toward these
  targets per phase (see design doc).
- **`intent` is a routing hypothesis, not measured demand.** The catalogue's
  intent labels derive from query-template research (each module's rows share
  templated pain points and expectations). The intent decides the default
  lane only for cold arrivals; for a signed-in student with state, the
  readiness engine's recommendation wins. Validate the distribution against
  real behavior before treating it as ground truth.
- **`syllabus_year: 2026` records which official syllabus the scope was
  verified against** — it is a provenance stamp, not a freshness claim. When
  the GATE 2027 syllabus documents publish, re-verify `papers` and
  `source_scope` per atom and bump the stamp; that refresh is a named task,
  not an assumption.
- **No learner state in this directory, ever.** The research workbook's
  per-learner columns (mastery_state, attempt_count, …) were deliberately
  dropped at commit time. Learner state lives in the database behind the
  surveillance invariants.
- **`template-families.yml`'s stage sequences are `design_hypothesis`** (W2.1's
  own header, mirroring this same rule for `intent`'s routing labels above) —
  imported pedagogical SHAPES pending lift data, never a validated result.
  **Family topology overrides the intent default's stage list** wherever a
  concept resolves to both (W2.1/E11's locked precedence rule,
  `src/blueprints/template-engine.ts`) — but a family-derived practice
  stage's `difficulty_mix` is still taken from the concept's dominant
  catalogue intent when one exists (never re-invented per family), falling
  back to the target-difficulty-keyed table when no intent applies. An
  explicit caller-supplied `intent` override always wins over both.
  `coverage.topic_defaults` / `coverage.concept_overrides` join on
  `concept_id` against `src/constants/concept-graph.ts` — a **different id
  scheme** from this file's own `atomic_id` above, same boundary as
  `historical-evidence.yml`'s note below.
- **`historical-evidence.yml`'s `evidence` codes are a preparation-pattern
  claim, never a frequency/weightage claim** — that boundary is the source
  document's own explicit caveat (quoted verbatim in the file's header) and
  is binding on every consumer. `D` means "a directly reviewed example was
  visible in one of the three reviewed XE-A papers" — not "asked every
  year" or "high-yield." Committed student-facing copy (practice-item and
  PYQ-bank question/explanation text, this directory's own `seo.title` and
  `problem_statement_frame` fields) may not say "high-yield" / "frequently
  asked" / "most repeated" / "often asked" without a `directly_reviewed`
  `evidence_level` on the specific item making the claim (W1.2/E10) —
  enforced by `check-intent-catalogue.ts` (A8, B6) and
  `check-practice-items.ts`, sharing one phrase list at
  `src/content/evidence-phrase-rule.ts`. `evidence_level` (on practice items
  / PYQ bank entries) and this file's `evidence` (D/P/S, on corpus topics)
  are two distinct, non-overlapping vocabularies for two distinct
  surfaces — see D10 at both `evidence_level`'s definition
  (`src/scoring/learning-object-catalog-file.ts`) and this file's own
  header.
