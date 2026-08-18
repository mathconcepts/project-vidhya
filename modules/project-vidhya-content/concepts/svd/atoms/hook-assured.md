---
# Alternative body for svd.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: svd.hook.assured
concept_id: svd
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: svd.hook
for_stance: assured
---

## The decomposition that never refuses a matrix

$A = U\Sigma V^T$ exists for every matrix, square or not, invertible or not — where spectral decomposition demands symmetry, SVD asks for nothing. Singular values are eigenvalues of $A^TA$, square-rooted; $U$, $V$ are the eigenvectors of $AA^T$, $A^TA$ respectively.

Rank is singular values that survive nonzero; low-rank approximation is truncating the sum after the largest few. Where does that truncation actually lose information, and how would you bound it?
