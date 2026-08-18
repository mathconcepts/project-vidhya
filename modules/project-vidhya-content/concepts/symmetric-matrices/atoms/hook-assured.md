---
# Alternative body for symmetric-matrices.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: symmetric-matrices.hook.assured
concept_id: symmetric-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: symmetric-matrices.hook
for_stance: assured
---

$A = A^T$ buys you two guarantees no other matrix class gets automatically: real eigenvalues, and an orthogonal eigenbasis. Together they mean $A = Q\Lambda Q^T$ always exists — no defectiveness, no complex conjugate pairs, ever.

That's the entire reason symmetric matrices carry the theory: covariance, stiffness, Hessians — every quadratic-form application leans on this guarantee holding without exception.
