# Scaling the stance axis to the whole course

Status: reviewed (`/plan-eng-review`, 2026-08-16). Six issues raised, six resolved.
Scope: all 97 concepts. 566 new variant files.

## The problem, in numbers

The confident/unconfident axis works. It reaches 3 concepts.

```
concepts with atoms          97
concepts with stance variants 3     3.1%
atom files                  793
variant files                16     2.0%
code paths that GENERATE a variant   0
```

All 16 variants were written by hand. Nothing in the codebase has ever produced
one. Interactives are *not* the gap — 96 of 97 concepts already carry an
`interactive-spec`, across 125 atoms and 81 gif-scenes.

The bottleneck is that the cadence is undocumented. The recipe — concrete
numbers before symbols, picture before formula, explicit check, name the one
thing to hold onto, no reassurance — exists only as prose comments inside the
16 authored files. A generator cannot follow it and a gate cannot check it.

## Target

```
97 concepts × 3 narrative atoms (hook, intuition, worked_example) × 2 stances
  = 582 variants
  − 16 already authored
  = 566 new files
```

Verified: all 97 concepts have all three narrative atoms. Zero partials.
No concept gets skipped.

`formal_definition` and `micro_exercise` are deliberately excluded. A definition
does not have a confident and an unconfident form; an exercise with a marked
answer gains nothing from register and doubles the surface for a wrong mark.

## Data flow

```
templates/<topic>.yaml
  stances: { shaken: "...", assured: "..." }        ← the cadence, 6 files
        │
        ▼
  variant generator  (thinking tier)
        │  reads base atom, rewrites prose,
        │  COPIES fenced blocks verbatim
        ▼
  equivalence judge  (intuition + worked_example only, 388 pairs)
        │
        ├── contradicts base ──▶ .data/variant-drafts/   (not served, not lost)
        │
        └── agrees
                ▼
  modules/project-vidhya-content/concepts/<c>/atoms/<atom>-<stance>.md
        │
        ▼
  scripts/check-variant-agreement.ts   ← CI, every PR, every pair, free
        │  fenced blocks byte-identical
        │  concept_id + atom_type match base
        │  variant_of resolves, for_stance ∈ {shaken, assured}
        ▼
  atom-loader.loadConceptAtoms()
        │
        ▼
  foldStanceVariants()      ← unchanged. Already concept-agnostic.
        ▼
  applyStanceVariants(atoms, deriveFraming(...).stance)
        ▼
  the student
```

The read path takes **zero** changes. That is the point: `foldStanceVariants`
has no per-concept coupling, so 566 new files work the day they land.

## Decisions

| # | Decision | Why |
|---|---|---|
| 1A | Generator writes `.md` files, not `atom_versions` rows | `foldStanceVariants` runs only on disk-parsed files (`atom-loader.ts:171`); `atom_versions` has no `variant_of`/`for_stance` column in any migration. A DB variant is unservable. Files also work DB-less, which is where the demo runs, and produce a reviewable diff. |
| 2B | Deterministic CI gate + LLM judge on maths atoms | Structure is exactly checkable; claims are not. Display math is a free variable — `intuition.md` has one `$$` block, `intuition-assured.md` has none, `worked-example.md` has none and its shaken variant has seven. No containment rule survives the accepted exemplars. |
| 3A | Cadence lives in `templates/<topic>.yaml`, not the blueprint | That file already carries per-topic, per-atom-type authoring guidance, on disk, DB-less, already consumed by the generator. Blueprint v1 is permanent (`types.ts:10`), so routing it there costs a `decisions_v2` column and parallel type to store a paragraph. |
| 4A | One motivation vocabulary, exported | Seven hand-typed lists with four memberships. Already caused one defect and is causing a second. |
| 5A | Mutation tests on all three content gates | A gate you have not watched fail is a gate with no evidence it works. |
| 6A | Judge failure fails closed, draft kept outside the content tree | A missing variant is an already-tested state. An unchecked file that looks checked is not. |

## What already exists

| Piece | Reused or rebuilt |
|---|---|
| `foldStanceVariants` / `applyStanceVariants` | Reused unchanged. Concept-agnostic already. |
| `deriveFraming`, `framingSignature` | Reused unchanged. |
| `templates/<topic>.yaml` | Extended with a `stances` block. Not replaced. |
| `check-content-integrity.ts`, `check-demo-rails.ts` | Joined by a third gate; both backfilled with tests. |
| `generateConcept` + thinking/formatting tiers (v4.32.0) | Reused as the generation engine. |
| `experiments` / `lift_v1` machinery | Untouched. `target_kind` already accepts `'atom'`. |
| Interactive widgets | Untouched — already on 96/97 concepts. |
| `stanceCoverage()` | Already wired to `admin-content-maturity-routes.ts:311`. Extended to report per concept. |

Nothing here rebuilds an existing flow.

## NOT in scope

| Deferred | Rationale |
|---|---|
| DB-backed variant storage (`variant_of`/`for_stance` on `atom_versions`) | Would need a migration, a second fold site, and two fold implementations kept in agreement — the drift class the repo already warns about. Files cover every current need. |
| Blueprint stance axis for cadence attribution | TODOS.md. Needs a second cadence and n≥30 per arm before it can measure anything. |
| `formal_definition` / `micro_exercise` variants | A definition has no confident form; a marked exercise doubles the wrong-mark surface for no register gain. |
| Per-student generated bodies | `student_atom_overrides` already does this and is out of scope here. |
| Retiring the `confident` motivation value from persona fixtures | None use it; only the two unreachable code branches are removed. |

## Failure modes

| Codepath | Realistic production failure | Test? | Handled? | Visible? |
|---|---|---|---|---|
| Generator writes a file | Clobbers a hand-authored variant | **must add (CRITICAL)** | must add: refuse if file exists | silent today |
| Generator copies fenced block | Regenerates instead of copying → widget drifts | **must add** | CI gate catches at PR | caught |
| Judge | Times out mid-batch | must add | 6A: fail closed, draft to `.data/` | run log |
| Judge | Passes a real contradiction (false negative) | eval | CI gate does not catch this | **silent — residual risk** |
| CI gate | Body deleted / always returns pass | **must add (mutation)** | none today | silent — this is why 5A |
| `templates/*.yaml` | `stances` key absent | must add | base-only generation | run log |
| `foldStanceVariants` | Orphan variant | covered ✓ | dropped + warning | log |
| Cohort trigger | New motivation state added to one list only | must add | 4A makes it a compile error | was silent |

**One residual critical gap:** a judge false-negative — the judge approving a
variant that does contradict its base — has no second line of defence. The CI
gate is structural and cannot see it. Mitigation is the per-topic PR review;
accepted knowingly rather than papered over.

## Parallelization

Six topics, disjoint file sets, one template each.

| Step | Modules touched | Depends on |
|------|-----------------|------------|
| S1 template `stances` schema + loader | `modules/.../templates/`, generator | — |
| S2 variant generator | `src/content/`, `src/generation/` | S1 |
| S3 CI gate + mutation tests | `scripts/`, `src/__tests__/` | — |
| S4 motivation vocabulary consolidation | `src/teaching/`, `src/api/` | — |
| S5 coverage on maturity card | `src/api/`, `frontend/src/components/admin/` | — |
| S6a–f generate per topic | `modules/.../concepts/<topic-concepts>/` | S1, S2, S3 |

```
Lane A: S1 → S2 ──┐
Lane B: S3 ───────┼──▶ S6a  linear-algebra   (26 concepts, 156 files)
Lane C: S4        │    S6b  calculus
Lane D: S5        │    S6c  complex-numbers
                  │    S6d  probability
                  │    S6e  discrete-math
                  └──▶ S6f  algorithms
```

Lanes A–D are fully independent (no shared module directory). S6a–f are
independent of each other — disjoint concept directories, one PR per topic.

Conflict flag: S4 and S5 both touch `src/api/`, but different files
(`admin-cohort-routes.ts` vs `admin-content-maturity-routes.ts`). Low risk,
worth a heads-up if run in separate worktrees.

## Implementation Tasks

- [ ] **T1 (P1, human: ~4h / CC: ~30min)** — templates — add a `stances` block to all 6 topic YAMLs
  - Surfaced by: Issue 3 — the cadence exists only as prose in 16 file comments
  - Files: `modules/project-vidhya-content/templates/*.yaml`, template loader
  - Verify: loader test — `stances` parsed; absent key falls back to base-only without throwing
- [ ] **T2 (P1, human: ~3d / CC: ~2h)** — generation — variant generator writing `.md` files
  - Surfaced by: Issue 1 — `atom_versions` rows are unservable by `foldStanceVariants`
  - Files: `src/content/variant-generator.ts`, `src/generation/run-dispatcher.ts`
  - Verify: refuses to overwrite an existing authored variant; fenced blocks byte-identical to base
- [ ] **T3 (P1, human: ~1d / CC: ~45min)** — scripts — `check-variant-agreement.ts` + mutation tests
  - Surfaced by: Issues 2 and 5 — a third gate on an untested gate family
  - Files: `scripts/check-variant-agreement.ts`, `src/__tests__/variant-agreement.test.ts`, `package.json`
  - Verify: passes a clean pair; fails each of 5 mutations with the right reason
- [ ] **T4 (P1, human: ~1d / CC: ~1h)** — generation — equivalence judge, maths atoms, fail-closed
  - Surfaced by: Issues 2 and 6 — structural checks cannot see a contradicted number
  - Files: `src/content/verifiers/stance-equivalence.ts`, generator wiring
  - Verify: contradiction blocks the write; judge error routes the draft to `.data/variant-drafts/`
- [ ] **T5 (P2, human: ~2h / CC: ~15min)** — teaching/api — one exported motivation vocabulary
  - Surfaced by: Issue 4 — seven lists, four memberships, `anxious` missing from the cohort trigger
  - Files: `src/teaching/motivation-source.ts` + 6 call sites, `src/sessions/learner-framing.ts`
  - Verify: regression test per call site; anxious personas appear on `/admin/cohort`
- [ ] **T6 (P2, human: ~4h / CC: ~30min)** — gates — backfill tests for the two existing content gates
  - Surfaced by: Issue 5 — both about to carry 566 more files, neither has a test
  - Files: `src/__tests__/content-integrity.test.ts`, `src/__tests__/demo-rails.test.ts`
  - Verify: each fails on a deliberately broken fixture
- [ ] **T7 (P2, human: ~3h / CC: ~25min)** — admin — per-concept stance coverage on the maturity card
  - Surfaced by: the plan's own reporting requirement; `stanceCoverage()` already exists
  - Files: `src/api/admin-content-maturity-routes.ts`, `frontend/src/components/admin/ContentMaturityCard.tsx`
  - Verify: zero coverage renders as an honest zero, never as unknown or rounded up
- [ ] **T8 (P1, human: ~2w / CC: ~1d + review)** — content — generate 566 variants, one PR per topic
  - Surfaced by: the objective — scale the accepted cadence to the rest of the course
  - Files: `modules/project-vidhya-content/concepts/*/atoms/*-{shaken,assured}.md`
  - Verify: `ci:content-integrity`, `ci:content-gate`, `check-variant-agreement` all green per PR
