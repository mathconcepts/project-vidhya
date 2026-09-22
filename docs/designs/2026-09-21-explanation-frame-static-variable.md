# Explanation Frame — declaring the static and variable parts of an explanation

**Date:** 2026-09-21
**Status:** framework shipped, shadow readout live, not yet wired to student delivery
**Ask:** "we need a framework that identifies the static and variable part for
content generation and this needs to be in place — not any hardcoded stuff.
Work on the framework part before the content generation part. The framework
shall be such that the minimum content shall provide reasonable explanation
whereas more personalization provides more effective, resonant answers."

---

## 1. What was already there

This was researched against the code before anything was designed, because
this repo has a lot of half-overlapping content machinery and the wrong move
would have been to add a twelfth one.

| Mechanism | What it does | Granularity |
|---|---|---|
| `stance-variants.ts` | Serves a sibling `.md` written for a different learner stance | **Whole atom body** |
| `personalized-regen.ts` | Regenerates a body into `student_atom_overrides` | **Whole atom body**, DB-only, 1 trigger, 14-day expiry |
| `applyPersonalizedRanking` | Re-orders atoms | Never rewrites (its own docblock) |
| `delivery-length.ts` | Micro / Standard / Deep | A filter over atom TYPES; `standard` and `deep` are honest no-ops |
| `delta-kinds.ts` | 11 named reasons a delta fires | Taxonomy only — 1 of 11 has a detector |
| `pedagogy-patterns.yml` | Directives injected into generation prompts | Generation-time, not delivery-time |
| `concept-anchors` | One ≤100-char "what is this for" line per concept | Per concept, static |
| `curriculum-bridge` | Per-concept board-alignment sentence per track | Per concept × track, static |

## 2. The actual gap

Every personalisation mechanism above substitutes a **whole atom body**, and
nothing anywhere declares which PART of an explanation is invariant.

Three consequences, all of them things the product is feeling:

1. **Personalisation costs O(variants × concepts).** 606 authored stance pairs
   are the same explanations written three times. A third register — say, one
   pitched at a student with genuinely low prior competency — means writing
   the corpus again. That is what "hardcoded" means in practice.
2. **There is no floor.** `ci:variant-agreement` has to police drift with
   heuristics (prose-word budgets, byte-identical fences, a repeated-4-gram
   rule) precisely because no artifact states what MUST survive a rewrite.
3. **Enrichment is binary.** A student with rich signal and one with none get
   two different FILES, not a shared floor plus more help. There is no notion
   of "this explanation is complete, and here are two more things worth saying
   because we happen to know them about this learner."

## 3. The framework

`src/content/explanation-frame/`. An `ExplanationFrame` is a list of typed
slots. Each declares a **role** and how it is **filled**:

- `static` — authored once, identical for everyone, always rendered.
- `adaptive` — may be replaced or added by a resolver when the learner's
  signals support it, and **always** declares the static text it degrades to.

Two guarantees, enforced in `contract.ts` rather than left to review:

- **G1 (floor).** Composing against zero signals yields a complete
  explanation: every required role present and non-empty. "Minimum content
  gives a reasonable explanation" is a property of the type.
- **G2 (monotonic enrichment).** A resolver may replace a slot's text or fill
  an optional slot. It can never delete a required role, and a resolver
  returning `null` is indistinguishable from that resolver not existing. More
  signal therefore never yields a worse explanation than less.

### Roles

Required (the floor) — not invented here, these are the research framework's
own Micro contract as already encoded in `delivery-length.ts`, plus `anchor`:

`anchor` · `core_idea` · `worked_example` · `trap` · `check`

Optional (the enrichment surface, each backed by a signal that exists today):

`prerequisite_bridge` · `board_bridge` · `misconception_callout`

### Resolvers

Hard rule: a resolver exists only when the signal it reads is real AND the
text it produces comes from something already authored and already gated.
Three ship, deliberately not eleven — `delta-kinds.ts` names eleven reasons a
delta might fire and is explicit that one has a detector; shipping eleven
resolvers against two real detectors would repeat exactly that mistake.

| Resolver | Reads | Text source |
|---|---|---|
| `stance_body` | `stance` | The authored `-shaken` / `-assured` sibling body, via `atom.stance_variants` |
| `prerequisite_bridge` | `shaky_prerequisites` ∩ this concept's graph prerequisites | Concept label |
| `board_bridge` | `track_id` | The curriculum-bridge registry (already gated by `ci:curriculum-bridge`, alarm-framing ban included) |

`stance_body` is the piece that turns stance variants from a whole-file swap
into a declared slot-level delta: the base body stays the floor and the
variant replaces exactly one slot. It is a **factory**, returned by the
builder rather than globally registered, because the bodies differ per
concept and a global key would let two concurrent compositions serve each
other's text.

### What it deliberately is not

- **Not a tracking surface.** Resolvers receive `LearnerSignals`, a plain
  caller-supplied value object. This module never reads or writes a database
  and adds no schema column (surveillance invariant 1). `StudentContext`
  satisfies `LearnerSignals` structurally; the dependency is type-shaped and
  one-way, so `src/content/` does not drag `src/personalization/` in.
- **Not a second atom pipeline.** A frame composes text that already exists.
  Generation is a later, separate concern — which is the order the work was
  asked for.

## 4. Measured coverage

`GET /api/admin/explanation-frame/coverage`, against the real corpus, with
**zero new authoring**:

```
concepts: 170   frameable: 169   not frameable: 1
blocked_by_role: { anchor: 1 }   blocked: integration-substitution
```

That one blocker is the concept whose anchor is a deliberate, reasoned
`null` in the anchor registry ("a relabelling step inside someone else's
integral"). It is reported as a blocker rather than waved through, because
without an anchor the floor as defined is genuinely incomplete — and the
decision of what to do about it is an editorial one, not something this
framework should make on its own.

`eigenvalues`, end to end through the live endpoint:

```
floor (anonymous, no signals)              enrich=0   5 static slots, 8736 chars
stance: shaken                             enrich=2   core_idea + worked_example adaptive
stance: assured                            enrich=2
shaken + weak prerequisite + board track    enrich=3   + "This leans on Determinants…"
```

## 5. Where this is NOT wired

`composeExplanation` does not yet feed `/api/lesson/compose` or the atom
renderer. That is deliberate and is the next step, not an oversight: wiring
it changes what every student reads, which deserves its own verification
pass rather than riding along on the framework that makes it possible. The
shadow readout is the review surface in the meantime, following the same
`pedagogy-shadow` / `fsrs-shadow` precedent this repo already uses for
"built, measurable, not yet switched on."

## 6. What it unlocks, in order

1. **Wire delivery.** Compose from the frame in the lesson path, behind the
   existing experiment gate, so the lift ledger can group by
   `enrichment_level`.
2. **A low-prior-competency register** becomes one more stance value plus
   authored bodies for the two narrative slots, NOT a third copy of the
   corpus — the floor and the other three required roles are shared.
3. **Wire the remaining `DeltaKind` detectors.** Each one that lands is a new
   resolver against an existing optional role, and the contract refuses it if
   it fires without a signal.
4. **Generation.** A generator now has a declared target shape: produce the
   static floor first, and offer deltas only for slots the frame marks
   adaptive.

## 7. Risks, named

- **`misconception_callout` has no resolver yet.** The role exists; no
  deterministic source of misconception text does. Left declared and unfilled
  rather than backed by a resolver that invents wording.
- **The floor is only as good as the authored atoms.** The framework
  guarantees the floor is PRESENT and non-empty, not that it is well written.
  Prose quality stays the job of `ci:variant-agreement`, the prose budgets,
  and the reading-load report.
- **`anchor` being required is a real editorial commitment.** It blocks one
  concept today. If more reasoned nulls appear, the right fix is a decision
  about that role, not quietly demoting it to optional.
