# The assessment contract, checked against JEE Advanced

**Status:** done, before migration 050 shipped
**Owner premise:** Premise 7 of
[2026-08-27-content-readiness-market-research-integration.md](./2026-08-27-content-readiness-market-research-integration.md)
**Amendments discharged:** Premise 7, D17

---

## Why this exists

Premise 7 makes a load-bearing claim about the shape of the assessment
contract:

> The contract carries per-question-type `marking_strategy` identifiers plus
> parameters; the scorer resolves strategies from a registry. Pure parameters
> cover GATE + JEE Main; a genuinely new scheme is a new registered strategy,
> never a fork of the scorer.

A schema claim like that is cheap to make and expensive to be wrong about.
Once `assessment_contracts` has rows, attempts are graded against them, and
changing the column shape means a data migration on records that are supposed
to be immutable history. So the claim gets tested on paper against the
hardest real scheme available **before** the migration lands, not after.

JEE Advanced is that scheme. It is the marking system in the Indian
entrance-exam landscape that most obviously does not look like GATE's:
multiple-correct questions carry a **partial-marking matrix** whose award
depends on *which* correct options were selected and whether any wrong one
was, not merely on whether the selected set matched.

The exercise below takes a real 2024-style JEE Advanced paper structure,
walks it into the schema, and reports what fits and what does not.

---

## The scheme being tested

A 2024-style JEE Advanced paper, per section:

| # | Section | Type | Full | Partial | Zero | Negative |
|---|---|---|---|---|---|---|
| 1 | Single-correct MCQ | one correct option | **+3** | — | 0 if unattempted | **−1** |
| 2 | Multiple-correct (MSQ) | one or more correct options | **+4** (all correct chosen, none wrong) | **+3 / +2 / +1** (see matrix) | 0 if unattempted | **−2** if any wrong option is chosen |
| 3 | Numeric | integer / decimal value | **+4** | — | 0 if unattempted | **0** |

The Section-2 partial matrix, stated exactly:

- **+4** — every correct option chosen, no wrong option chosen.
- **+3** — all but one of the correct options chosen, no wrong option chosen,
  and there are four correct options.
- **+2** — all but two of the correct options chosen, no wrong option chosen,
  and there are three or more correct options.
- **+1** — all but three of the correct options chosen, no wrong option
  chosen, and there are four correct options.
- **0** — no option chosen.
- **−2** — any wrong option chosen, regardless of how many correct ones
  were also chosen.

Two things in that matrix matter for the schema:

1. The award is a function of **how many** correct options were selected,
   not of set equality. `gate_2026`'s MSQ branch computes exactly one
   boolean (`want ≡ got`) and has no concept of a partially-correct
   selection to score.
2. The award depends on **how many correct options the item has** (the +3
   and +1 rows are conditioned on "there are four correct options"). That
   is item data, not contract data — and the item already carries it as
   `answerIndices.length`.

---

## Walking it into the schema

### Section 1 — single-correct MCQ

```json
"mcq": {
  "strategy": "jee_adv",
  "params": {
    "marks_correct": 3,
    "marks_wrong": -1
  }
}
```

**Pure params.** Note what is NOT needed: no per-mark-value table, because
this exam does not scale the penalty to the item's mark value the way GATE
does. That asymmetry is exactly why `marks_wrong_by_marks` is a param and
not a column — one exam needs the table, another needs a flat number, and
the schema has an opinion about neither.

`gate_2026` could very nearly grade this already (a `marks_wrong_by_marks`
of `{"3": -1}` produces the same numbers), but it is filed under `jee_adv`
below for a reason given in "One strategy or two".

### Section 2 — multiple-correct with the partial matrix

```json
"msq": {
  "strategy": "jee_adv",
  "params": {
    "marks_full": 4,
    "marks_any_wrong_selected": -2,
    "marks_none_selected": 0,
    "partial_award_by_missed": {
      "1": { "marks": 3, "requires_total_correct_at_least": 4 },
      "2": { "marks": 2, "requires_total_correct_at_least": 3 },
      "3": { "marks": 1, "requires_total_correct_at_least": 4 }
    }
  }
}
```

**Pure params — but for a strategy that does not exist yet.** Every number
in the matrix is data. What is not data is the *shape of the computation*:

```
if any selected option is wrong        → marks_any_wrong_selected
else if nothing selected               → marks_none_selected
else let missed = |correct| − |selected ∩ correct|
     if missed == 0                    → marks_full
     else look up partial_award_by_missed[missed]
          and check requires_total_correct_at_least against |correct|
          → its marks, or 0 if the condition fails
```

That is five branches over set arithmetic `gate_2026` never performs. Its
MSQ branch is:

```ts
const correct = want.size === got.size && [...want].every(i => got.has(i));
return graded(correct ? max : 0, ...);
```

No amount of parameterisation turns a boolean into a partial-credit
lookup — and, importantly, `gate_2026` does not *pretend* otherwise: it
already throws when handed `partial_credit: true`, and the new strategy
registered in this repo refuses non-zero `marks_wrong` on MSQ by name
rather than grading it as zero-penalty. So the failure mode here is a
refusal, not a wrong mark.

**This is the "one new registered strategy" case, and it is the only one.**

### Section 3 — numeric

```json
"nat": {
  "strategy": "jee_adv",
  "params": {
    "marks_correct": 4,
    "marks_wrong": 0,
    "tolerance_epsilon": 1e-9
  }
}
```

**Pure params.** Identical in shape to `gate_2026`'s numeric params. The
only structural note: JEE Advanced numeric answers are frequently specified
to two decimal places, which is an authoring rule about how `answerRange`
is written on the ITEM, not a marking rule. The contract has nothing to say
about it, correctly.

### The row

```
exam:                'jee'
paper:               'advanced-paper-1'
year:                2024
marking:             { the three blocks above }
official_source_url: the JAB/IIT notification the numbers were read from
verified_at:         when a human last checked it against that URL
```

`(exam, paper, year)` earns its three columns here rather than merely
tolerating them. JEE Advanced runs **two papers on the same day with
independent marking schemes** — Paper 1 and Paper 2 differ in section
composition — so `paper` is not decoration. And the matrix above is a 2024
matrix; JEE Advanced has revised its partial-marking rules more than once
in the last decade, so `year` is not decoration either. A schema keyed on
`exam` alone would have needed a migration the first time either fact
showed up.

---

## One strategy or two

A fair objection: Sections 1 and 3 could ride on `gate_2026` with different
numbers, leaving only Section 2 to need `jee_adv`. Two strategies would then
appear in one contract row's `marking` blob.

The schema permits that — `marking` is keyed per question type and each
entry names its own strategy independently, so a row can mix them freely.
That flexibility is real and was not designed in by accident.

The recommendation is nonetheless to file all three under `jee_adv`, for a
reason that is about operators rather than about code: a contract row whose
three sections name two different strategies invites the question "why is
the MCQ section marked by the other exam's rules?" every time someone reads
it, and the honest answer ("because the arithmetic happens to coincide")
is not a fact anyone should have to re-derive. One exam, one strategy id,
one place to look when the scheme is re-notified.

Nothing enforces this. It is a convention, stated here so the next person
knows it was a choice.

---

## What `jee_adv.grade()` must compute that `gate_2026.grade()` cannot

Stated precisely, so the follow-up PR has a spec and not a vibe:

1. **Partition the selected set against the correct set.** `gate_2026`
   computes one equality; `jee_adv` needs `|selected ∩ correct|`,
   `|selected \ correct|`, and `|correct|` separately.
2. **Short-circuit on any wrong selection.** The −2 applies regardless of
   how many correct options were also chosen. This is not "wrong answer
   penalty" in `gate_2026`'s sense (which only exists for single-correct
   items); it is a distinct rule on a partially-correct response.
3. **Look up an award by miss-count, conditioned on the item's own
   correct-option count.** The `requires_total_correct_at_least` guard
   makes the award depend on item shape, not only on the response.
4. **Distinguish "nothing selected" from "selected the wrong things".**
   `gate_2026` collapses both into 0; here they are 0 and −2.
5. **Flat, non-mark-scaled MCQ negatives.** Minor, but real: `gate_2026`'s
   MCQ negative is defined as a fraction of the item's mark value, and JEE
   Advanced's is a flat −1 that has nothing to do with the item being worth
   3.

Every one of those is arithmetic. None of them is a new column.

---

## Conclusion

**The `(exam, paper, year)` + per-question-type `{strategy, params}` JSONB
shape survives JEE Advanced unchanged. No schema change is needed, and
migration 050 shipped as designed.**

What JEE Advanced needs is exactly what Premise 7 predicted: one new
registered strategy (`jee_adv`), implementing `MarkingStrategy`, passing
`runMarkingStrategyContract`, added to the registry in
`src/scoring/marking-strategy.ts`. No new column, no change to
`assessment_contracts`, no fork of `GateDeterministicScorer`, no edit to any
existing strategy.

Two details the exercise surfaced that were NOT obvious before doing it,
and that the shipped migration reflects:

- **`paper` had to be a first-class key column, not part of the `id`
  slug.** JEE Advanced's two same-day papers with independent schemes are
  the proof. Had the exercise been skipped, `paper` would plausibly have
  been folded into the slug and the first two-paper exam would have forced
  a migration on live rows.
- **Params must be free-form per strategy, not a fixed union.** GATE needs
  a per-mark-value negative table; JEE Advanced needs a flat negative and a
  miss-count award map. A typed union of "the params any exam might need"
  would have had to be widened for the second exam — which is the same
  failure the exam-profile schema's own rule warns about ("a schema that
  grows a new column per exam is a schema quietly turning into a pile of
  special cases"). `params: Record<string, unknown>` at the seam, validated
  by the strategy that owns it, is the shape that does not.

### Honesty note (D17)

A contract row closes **step 2 of the ten** in
[add-an-exam-recipe.md](../add-an-exam-recipe.md) — "exam profile row",
the ~1-day step whose real cost is verifying the marking against the
official source. It closes nothing else.

Step 1 (curriculum pack, ~4–6 expert-days), step 3 (capability check
against [capability-register.md](../capability-register.md)), step 4
(launch bank through the same verification gauntlet every existing item
went through) and steps 5–10 are all untouched by anything in this
document. Step 4 in particular is the expensive one, and the plan's own
Premise 5 says why: verification labour, not generation, is the inventory
bottleneck.

**"One contract row" prices the marking seam. It never prices the exam.**

---

## See also

- `src/exams/marking-constants.ts` — the compiled marking truth (D7/E6)
- `src/scoring/marking-strategy.ts` — the `MarkingStrategy` seam and registry (D11)
- `src/scoring/marking-strategy-contract.ts` — `runMarkingStrategyContract`
- `supabase/migrations/050_assessment_contracts.sql` — the table and its seed row
- [EXTENDING.md](../../EXTENDING.md) — "Adding a new MarkingStrategy"
- [add-an-exam-recipe.md](../add-an-exam-recipe.md) — the other nine steps
