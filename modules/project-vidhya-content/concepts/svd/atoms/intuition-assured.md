---
# Alternative body for svd.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: svd.intuition.assured
concept_id: svd
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: svd.intuition
for_stance: assured
---

## What generalizes and what doesn't

SVD is the spectral theorem's answer to "what if $A$ isn't symmetric, or isn't even square." $U, V$ come from eigenvectors of $AA^T$ and $A^TA$ — both symmetric PSD by construction, so their eigendecompositions are guaranteed real and orthogonal even when $A$ itself gives you nothing to work with directly.

For symmetric $A$: $U = V$ up to sign, and singular values are $|\lambda_i|$, not $\lambda_i$ — a negative eigenvalue flips a column's sign between $U$ and $V$ rather than showing up as a negative singular value. That sign subtlety is the most common source of a wrong-looking but actually-correct SVD.

Rank, condition number, and best rank-$k$ approximation (Eckart-Young) all read directly off $\Sigma$: rank is the count of nonzero $\sigma_i$, condition number is $\sigma_1/\sigma_{\min}$, and truncating at $\sigma_k$ is provably the closest rank-$k$ matrix in Frobenius norm — not just a heuristic.
