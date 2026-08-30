---
# Alternative body for taylor-laurent.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: taylor-laurent.intuition.assured
concept_id: taylor-laurent
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: taylor-laurent.intuition
for_stance: assured
---

Taylor is Laurent with a zero principal part — same object, special case, valid only where $f$ is analytic ($a_n=f^{(n)}(z_0)/n!$ needs the derivatives to exist).

The mark-losing distinction: classifying a singularity by counting negative powers is valid only in the Laurent series **centered at that singularity itself**. $\frac1{z-1}$ expanded around $0$ for $|z|>1$ has infinitely many negative powers of $z$ — that does not make $z=1$ essential; centered *at* $z=1$, the same function is just $(z-1)^{-1}$, a simple pole. Wrong center, wrong conclusion, same function.

Fast classification once centered correctly: zero negative terms is removable; finitely many, worst term $(z-z_0)^{-m}$, is a pole of order $m$; infinitely many is essential.

$a_{-1}$ is the residue, read off directly — no limit needed once the series is in hand.
