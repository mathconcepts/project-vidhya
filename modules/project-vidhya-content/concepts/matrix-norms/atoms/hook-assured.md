---
# Alternative body for matrix-norms.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinction that actually costs
# marks (scale-invariance vs. determinant) rather than re-teaching stretch.
id: matrix-norms.hook.assured
concept_id: matrix-norms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrix-norms.hook
for_stance: assured
---

You already solve $Ax=b$ without thinking about it. The number worth knowing before you do is the **condition number** $\kappa(A)=\sigma_{\max}/\sigma_{\min}$ — the ratio between $A$'s most-stretched and least-stretched directions.

Large $\kappa$ means a tiny error in $b$ can blow up into a large error in $x$. It has nothing to do with $\det(A)$ being small: $\det(cA)=c^n\det(A)$ scales with $c$, but $\kappa(cA)=\kappa(A)$ — condition number is scale-invariant, determinant isn't. A matrix can look "nearly singular" by determinant and still be perfectly well-conditioned, or the reverse.
