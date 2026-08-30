---
# Alternative body for multivariable-calculus.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multivariable-calculus.intuition.assured
concept_id: multivariable-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: multivariable-calculus.intuition
for_stance: assured
---

Mixed partials agreeing, $\frac{\partial^2f}{\partial x\partial y}=\frac{\partial^2f}{\partial y\partial x}$, is Clairaut's theorem, not an automatic algebraic identity — it requires both mixed partials to be continuous near the point. Manufactured counterexamples exist where the two disagree at a single point precisely because that continuity fails there; assuming the equality without checking the hypothesis is assuming a theorem's conclusion without its premise.

The gradient $\nabla f$ is not just "the partials in a row": its direction is the direction of steepest ascent at that point, and its magnitude $\|\nabla f\|$ is the value of that steepest rate — the directional derivative in any *other* unit direction $\hat{\mathbf v}$ is $\nabla f\cdot\hat{\mathbf v}\le\|\nabla f\|$, strictly smaller unless $\hat{\mathbf v}$ already points along the gradient.

For a vector-valued map $\mathbf F:\mathbb R^n\to\mathbb R^m$, the Jacobian is genuinely a matrix, one gradient row per output component — reducing it to a single row, as for scalar $f$, only works when $m=1$; treating a multi-output Jacobian as one combined gradient loses which row belongs to which output entirely.
