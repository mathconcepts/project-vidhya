---
# Alternative body for counting-principles.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: counting-principles.intuition.assured
concept_id: counting-principles
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: counting-principles.intuition
for_stance: assured
---

## The one distinction that costs marks

$C(n,r)=P(n,r)/r!$ — same underlying selection; permutation over-counts by every internal ordering of the chosen $r$. Reading "arrange" as "select," or the reverse, changes the answer by a factor of $r!$, never by a rounding error.

## Where this bites in mixed problems

"Select a committee of 3, then assign chair, secretary, treasurer among them" is $C(n,3)\times3!=P(n,3)$ — pure combination undercounts by $3!$, and pure permutation applied too early overcounts. Split the problem at its seam: unordered selection first, ordered assignment second.

## Pigeonhole proves existence, not a count

$n+1$ objects into $n$ boxes forces a repeat — it proves something exists without computing a probability or a size. GATE uses it to force a conclusion ("some two of these must coincide") in a single line; reaching for $C$ or $P$ here wastes a step.
