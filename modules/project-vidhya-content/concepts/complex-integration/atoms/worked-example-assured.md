---
# Alternative body for complex-integration.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: complex-integration.worked-example.assured
concept_id: complex-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: complex-integration.worked-example
for_stance: assured
---

$\dfrac{z}{z^2-1}=\frac12\left(\dfrac1{z-1}+\dfrac1{z+1}\right)$, poles $\pm1$ both inside $|z|=2$. Cauchy's formula on each piece gives $\frac12(2\pi i)+\frac12(2\pi i)=2\pi i$; equivalently $2\pi i\sum\text{Res}=2\pi i(\frac12+\frac12)=2\pi i$ — same number either route, once the residues are this easy to read.

What separates right from wrong here: which poles are *inside*, not merely singularities of the integrand. Shrink the contour to $|z|=0.5$ and both poles move outside; the integral drops to $0$ by Cauchy's theorem — same function, smaller loop.

Applying the single-pole formula to the un-split integrand instead of splitting first is the error worth naming: the formula is stated for one interior singularity, so a two-pole integrand needs partial fractions (or the residue theorem) before it applies at all.

Common false generalization: a pole *on* the contour makes the integral undefined, not zero — check strict inequality, never $\le$, when deciding "inside".
