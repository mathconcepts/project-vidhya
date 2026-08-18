---
# Alternative body for positive-definite-matrices.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: positive-definite-matrices.intuition.assured
concept_id: positive-definite-matrices
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: positive-definite-matrices.intuition
for_stance: assured
---

Three equivalent tests, pick by what's cheapest for the matrix in front of you: eigenvalues all positive (fastest if you already need them), leading principal minors all positive (fastest for a small symmetric matrix given numerically), or Cholesky succeeds without pivoting (the one that matters computationally — it's what an optimizer actually runs).

The trap is treating "all principal minors" and "all leading principal minors" as the same check — they're not. Leading minors alone suffice for positive definiteness precisely because of the symmetric structure; for a general matrix or for semidefiniteness, you need every principal minor, not just the nested leading chain.

Where this actually shows up: a Hessian positive definite at a critical point certifies a strict local minimum — the payoff that makes this test worth carrying into optimization.
