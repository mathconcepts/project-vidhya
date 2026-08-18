---
# Alternative body for matrix-norms.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-norms.hook.assured
concept_id: matrix-norms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrix-norms.hook
for_stance: assured
---

$\kappa(A)=\|A\|\cdot\|A^{-1}\|$ bounds how much a relative error in $b$ can be amplified into a relative error in $x$, for $Ax=b$. $\kappa(A)\approx1$ is well-conditioned; $\kappa(A)\gg1$ means numerically unreliable even when $A$ is technically invertible — ill-conditioning is a spectrum, not a binary with singularity.
