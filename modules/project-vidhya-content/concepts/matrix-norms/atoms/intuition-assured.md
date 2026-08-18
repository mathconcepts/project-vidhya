---
# Alternative body for matrix-norms.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-norms.intuition.assured
concept_id: matrix-norms
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: matrix-norms.intuition
for_stance: assured
---

$\|A\|_2$ (the spectral norm) is $\sigma_{\max}(A)$, the largest singular value — the induced-2-norm definition and the eigenvalue-of-$A^TA$ computation are the same fact, not two facts. $\kappa_2(A)=\sigma_{\max}/\sigma_{\min}$ follows immediately once you have both singular values.

**The shortcut that backfires when skipped:** $\|A\|_1$ (max column-abs-sum) and $\|A\|_\infty$ (max row-abs-sum) are cheap and exact by inspection — reach for these before computing eigenvalues of $A^TA$ unless the question specifically asks for the spectral norm or condition number.

**Degenerate case worth knowing:** for a normal matrix (symmetric included), $\|A\|_2 = \max|\lambda_i|$ directly — no need to form $A^TA$ at all.
