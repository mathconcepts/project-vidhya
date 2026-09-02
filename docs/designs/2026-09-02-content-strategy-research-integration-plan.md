# Content strategy: research integration plan

**Date:** 2026-09-02
**Status:** implemented (P0–P3); P4+ deferred, see §5

## 0. Input

Five research documents landed in this session, all describing the same
target: a "research-first, static-core + evidence-triggered-delta" content
framework for the 116 normalized GATE Engineering Mathematics atomic topics.
Two were already committed verbatim (`docs/content-spec/research-notes.md`,
and an earlier cut of `integrated-self-improving-learning-system.md`); three
are new to this repo:

1. `Research-First Adaptive Content-Generation Framework` — the operating
   principles, pipeline, quality gates, metrics (not yet in the repo).
2. `GATE Engineering Mathematics Integrated Self-Improving Learning System`
   v2.0 — a longer version of the committed doc, with §16.6 tail, §16.8
   Governance and §16.9 Implementation Checklist, and a closing "Research-
   grounded static core and dynamic personalization content layer" section
   the committed copy cuts off before.
3. `Static-Core and Dynamic-Personalization Content Framework` + its CSV —
   per-topic (116 rows) application of the same contract, with a richer
   machine-readable schema than the CSV already committed at
   `docs/content-spec/atomic-content-structure-map.csv`.

The task: compare this framework against what Vidhya already ships, close
genuine gaps so generation is "at least equal or better" **for every
subtopic**, and do it as infrastructure — not as one-off hand-authored
content, since this session has no live LLM provider key (`docs/content-
spec` inherits the same "known-unrun" constraint documented elsewhere in
CLAUDE.md, e.g. `npm run variants:eval`).

## 1. Method

A fact-finding pass (Explore agent, see this session's transcript) mapped
the *current* implementation against ten research claims, each with file:line
citations. The verdict, condensed:

| Research requirement | Current Vidhya state | Verdict |
|---|---|---|
| Atomic topic contract, per-topic hooks/sequence/deltas | `src/content/atomic-topic-spec.ts` + `docs/content-spec/*.csv`, live since the "content-generation spec gets a repo home" pass | **already ≥ research** — same idea, already wired to an admin-readable API |
| 12–14 template families with family-specific hooks | `data/curriculum/gate-em/template-families.yml`, 13 families, blueprint-driven | **already ≥ research** — matches almost 1:1 |
| Evidence labels (official / directly_reviewed / pattern_supported / design_hypothesis) | `evidence_level` on `AuthoredItem` (`src/scoring/learning-object-catalog-file.ts:99-117`), enforced by `scripts/check-practice-items.ts` | **already ≥ research** at the per-item level; **gap**: no per-claim source locator (page/URL) alongside it — research wants claim-level, this is item-level |
| Assessment contract (MCQ/MSQ/NAT/marking rules, versioned) | `src/exams/marking-constants.ts`, `assessment_contracts` table, `MarkingStrategy` seam | **already ≥ research** |
| Quality gate pipeline (scope/source/math/assessment/etc.) | `content_gate_ledger`, 5 named gates, fail-closed at serve + promote | **already ≥ research**, narrower scope (only `generation_run_id`-tagged items) — a deliberate, documented tradeoff, not an oversight |
| Base + typed delta composition, smallest-supported-delta | Stance variants (2-axis), resonance beats, personalization selector, `student_atom_overrides` | **partial gap** — real personalization exists but isn't a single typed delta registry; only one trigger path (error-repeat) is implemented, and it's untyped free text (`trigger_reason`) |
| **Method Selector** as a mandatory universal anchor (decision rule + one named tempting-wrong method) | No atom type, stage, or template field for this anywhere | **real gap** — and the Integrated doc's own pain-point matrix names "method-selection confusion" as a recurring hypothesis on ~40% of all 116 topic rows |
| Source freshness monitoring (hash official syllabus/pattern pages, alert on change) | Explicitly absent by prior decision: `docs/designs/2026-08-27-content-readiness-market-research-integration.md:97` — *"nothing watches the official contract... ADOPT AS CALENDAR — an annual operator checklist item, not a system"* | **real gap**, and one the team already flagged but parked |
| Three delivery lengths (Micro/Standard/Deep) from the same base anchors | `SessionMode.micro_sprint` only forces STATIC modality, not a shorter atom set (`src/content/modality-orchestrator.ts:36,97-101`) | **real gap** |
| Bounded-depth backward diagnostic probe for a wrong answer | `traceWeakestPrerequisite` (`src/constants/concept-graph.ts:351-384`) is an unbounded, mastery-vector BFS, not an attempt-triggered probe | **real gap**, but touches the live diagnostic path — higher risk to rush |
| Custom-PDF ingestion → delta pipeline | Absent | **real gap**, large scope (upload, OCR, span extraction, review queue) |

Six items were already at or above the research bar. Six were real gaps.
Of those six, four are buildable this session as pure schema/code/data
changes with no live-generation dependency; two (bounded diagnostic probe,
custom-PDF ingestion) touch either a live student-facing path or a large new
subsystem and are scoped down to a documented follow-up (§5) rather than
rushed.

## 2. What "generate it for every subtopic" means without a provider key

Vidhya's content pipeline already generates per-concept, per-atom-type
content through `generateConcept()` / the orchestrator, gated by Wolfram
verification and the gate ledger — this repo does not hand-author lesson
prose. With no `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / etc. configured in
this environment (same constraint noted throughout CLAUDE.md's "Known-
unrun" sections), literally generating new atom content for 101 concepts is
not something this session can do or verify.

So "apply the improved framework to every subtopic" is implemented as:
**infrastructure that the existing generation pipeline picks up
automatically**, the same pattern the repo already uses for template
families, pedagogy patterns and stance rules — a data/schema change that
every future generation run inherits, rather than one-off content.

## 3. Phased implementation (this session)

**P0 — ingest the research as the repo's spec source of truth.**
`docs/content-spec/integrated-self-improving-learning-system.md` updated to
the full v2.0 text (adds §16.6 tail / §16.8 / §16.9 / the closing static-
core section the committed copy was missing). Two new files:
`docs/content-spec/adaptive-content-generation-framework.md` (net-new) and
`docs/content-spec/atomic-static-dynamic-content-framework.md` +
`.csv` (net-new, richer per-topic schema: `dynamic_delta_slots`,
`pain_point_categories`, `mandatory_failure_coverage`,
`research_required_before_promotion`, `quality_gates`, `monitoring_metrics`,
`generated_status`, plus `prerequisite_atomic_ids`/`downstream_atomic_ids`).
Kept as a *separate* file alongside the existing structure-map CSV rather
than replacing it — `atomic-topic-spec.ts`'s loader and its consumers
(`GET /api/admin/content-spec/atomic-topics`) key off the current column
names; swapping the schema underneath them is a breaking API change that
deserves its own reviewed pass, not a silent replacement inside this one.

**P1 — Method Selector, via the Pedagogy Pattern Library (E4), not a new
AtomType.** A new top-level `AtomType` has a huge blast radius (template
YAML, `ci:template-coverage`, prose-budget rules, stance-variant rules, the
walkthrough gate, `ATOM_ANIMATION_MAP`, renderer tests — see CLAUDE.md's own
account of how invasive the last atom-type-shaped changes were) and would
leave every one of 101 concepts "failing" a brand-new coverage gate until
content is regenerated with a live provider key, which this session cannot
do. `src/registry/pedagogy-patterns.ts` (E4) is the existing, designed-for-
this seam: a data-driven prompt-directive injector, already wired into
`buildPrompt()` and `template-engine.ts`'s stage selection, that doesn't
touch a single closed union. Added `ped_method_selector` to
`data/registry/pedagogy-patterns.yml`, `applicable_modules: <all 10 current
topics>` (linear-algebra, calculus, vector-calculus, differential-equations,
complex-variables, probability-statistics, numerical-methods, discrete-
mathematics, transform-theory, graph-theory) — the research's claim is that
method-selection confusion is universal, not family-specific, and the
existing 5 patterns cover only 2 modules, so this is also the first pattern
with full-catalogue reach. `blueprint_stages: [formalism, worked_example]`
matches the research's placement (between the Formal Anchor and Worked
Example anchors). Directives require: state the decision rule for when the
method applies, and name exactly one tempting-but-wrong alternative and why
it fails — every future `formalism`/`worked_example` generation call now
carries this instruction.

**P2 — typed delta-kind taxonomy.** `student_atom_overrides.trigger_reason`
was free text; nothing else in the codebase tags *why* a personalization
write happened. Added a closed `delta_kind` column (migration 056), backed
by the TypeScript union `DeltaKind` in `src/content/delta-kinds.ts` — the
10 research-named kinds (`prerequisite_repair`, `representation_shift`,
`definition_boundary`, `execution_drill`, `assessment_mode`, `time_and_risk`,
`custom_source`, `verified_computation`, `language_accessibility`,
`confidence_calibration`) plus one honestly-named 11th,
`general_remediation`, for the one trigger path that actually exists today
(3-failures-in-7-days → whole-atom regen grounded in error text — this
doesn't cleanly match any single research kind, and mislabeling it as one
of the ten would fabricate precision the system doesn't have). Wired
`personalized-regen.ts`'s one write site to tag `general_remediation`
honestly rather than guess. This makes the taxonomy real and queryable
today, and gives every *future* trigger detector (a prerequisite-gap probe,
a representation-shift detector, etc. — each its own project, see §5) a
column to write into without another migration.

**P3 — source freshness monitor.** New `src/jobs/source-freshness-monitor.ts`
+ `GET /api/admin/source-freshness`, checking the two official GATE 2026
pages the research cites (`exam-papers-and-syllabus.html`,
`question-paper-pattern.html`) on a weekly in-process schedule
(`src/jobs/scheduler.ts`), hashing response bodies and diffing against the
last-seen hash via the existing `durableCollection` helper (migration-free —
`durable_records`' `collection` discriminator, same pattern as `exams`,
`sample-check`, etc.). Replaces the parked "annual manual checklist" from
the 2026-08-27 plan with an actual automated check; alerts surface as a
`changed` status on the admin endpoint rather than a new notification
channel, keeping this a small, reversible addition. Network access to
`gate2026.iitg.ac.in` may or may not be reachable from this sandboxed
session (same class of constraint as other external calls documented
throughout CLAUDE.md) — the job is unit-tested against a mocked `fetch`, so
correctness doesn't depend on live reachability here.

## 4. What this deliberately does not touch

- The existing `content_gate_ledger` (5 gates), `assessment_contracts`,
  `evidence_level`, and `atomic-topic-spec.ts` consumers are all already at
  or above the research bar — left alone.
- `atomic-content-structure-map.csv` (the currently-wired 13-column CSV) is
  NOT replaced by the richer 21-column research CSV — see P0 above.
- No new `AtomType`, no new `StageKind` literal, no change to
  `ci:template-coverage` / `ci:la-walkthrough` — those gates keep measuring
  what they measure; Method Selector content is additive prompt guidance,
  not a new coverage dimension to fail against on day one.

## 5. Deferred (named, not silently dropped)

- **Three-tier delivery length (Micro/Standard/Deep).** Real gap, but
  reshaping lesson compose to select a shorter atom subset per topic risks
  the resonance-beat/`MediaSidecar` rendering pipeline (§ CLAUDE.md
  "Resonance beats", "Seven live-QA fixes") if rushed. Needs its own design
  pass on which atoms are droppable per family without breaking the fused
  hook/intuition scene contract.
- **Bounded-depth diagnostic probe** replacing/augmenting
  `traceWeakestPrerequisite`'s unbounded mastery-vector BFS with the
  research's "smallest discriminating probe" algorithm. Touches the live
  prerequisite-alert path (`src/gbrain/student-model.ts:378-396`) that
  gates real interventions — a correctness regression here is student-
  facing, so it deserves its own reviewed change, not a rider on this one.
- **Custom-PDF ingestion → delta pipeline** (hash, OCR, span extraction,
  review queue). Net-new subsystem, no existing seam to extend safely in
  scope.
- **Per-claim source locator** alongside `evidence_level` (research wants
  claim-granularity with page/URL; Vidhya has item-granularity). Worth
  doing, but touches every existing `evidence_level` write site — a
  reviewed follow-up, not bundled here.
- **Wiring the other 9 `DeltaKind` values to real trigger detectors.**
  P2 makes the taxonomy real; it does not invent nine new detection
  algorithms (prerequisite-gap probes, representation-shift detection,
  confidence-calibration divergence, etc.) — each is its own scoped
  project.

These five are tracked in `TODOS.md` with this doc as the reference.
