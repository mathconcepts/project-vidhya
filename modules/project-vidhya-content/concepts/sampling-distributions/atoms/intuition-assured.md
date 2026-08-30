---
# Alternative body for sampling-distributions.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sampling-distributions.intuition.assured
concept_id: sampling-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
variant_of: sampling-distributions.intuition
for_stance: assured
---

## The trigger is "$\sigma$ unknown," not "$n$ small"

Swap $s$ for $\sigma$ and the statistic becomes $t_{n-1}$, never $z$ — the two often travel together (small $n$ usually means $\sigma$ unknown too), but the trigger is strictly about what's known, not sample size. As $n$ grows, $t_{n-1}\to z$ anyway, since $s\to\sigma$.

## The degrees-of-freedom bookkeeping

One-sample $t$: $df=n-1$ — one degree "spent" estimating $\bar{x}$ before $s$ can be computed from the same data. Chi-squared for variance uses the identical $n-1$, for the same reason.

## Where this is actually used

$\chi^2_{n-1}=(n-1)s^2/\sigma^2$ powers a confidence interval or test ON variance, not on the mean — a distinct question from everything $t$ and $z$ answer, and mixing them up (using $t$ to test a variance claim) is a real GATE trap.

## The CLT's actual claim, precisely

$\bar{X}$ trends normal regardless of the POPULATION's shape — it says nothing about any single observation, which can remain arbitrarily non-normal.
