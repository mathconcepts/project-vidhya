---
# Alternative body for numerical-linear-algebra.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-linear-algebra.intuition.assured
concept_id: numerical-linear-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: numerical-linear-algebra.intuition
for_stance: assured
---

## The number deciding whether the answer means anything

Before trusting a computed solution to $Ax=b$, check $\kappa(A)=\|A\|\cdot\|A^{-1}\|$, not the residual. A small residual $\|Ax_{\text{computed}}-b\|$ looks like success, but it bounds $\|\delta x\|/\|x\|$ tightly only when $\kappa(A)$ is modest — for $\kappa(A)\approx10^k$, roughly $k$ digits of accuracy are lost regardless of how clean the elimination looked.

The plausible failure worth naming: a well-executed elimination on a matrix that happens to be ill-conditioned. The computed $x$ can still land far from the true solution even though every intermediate step was correct, because the trouble was never in the arithmetic — it was in the sensitivity of the problem itself. Pivoting fixes a different failure (instability during elimination), not this one.
