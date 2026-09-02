---
# Alternative body for numerical-linear-algebra.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-linear-algebra.hook.assured
concept_id: numerical-linear-algebra
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-linear-algebra.hook
for_stance: assured
---

A clean elimination with no arithmetic slips can still hand back a solution that's practically meaningless: if $\kappa(A)=\|A\|\|A^{-1}\|$ is large, a tiny perturbation in $b$ (rounding, measurement noise) amplifies into a large error in $x$, regardless of how carefully $L$ and $U$ were computed. Pivoting fixes a different problem — numerical instability *during* elimination — and does nothing for a matrix that is simply, structurally, close to singular.
