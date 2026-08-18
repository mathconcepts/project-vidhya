---
# Alternative body for positive-definite-matrices.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: positive-definite-matrices.hook.assured
concept_id: positive-definite-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: positive-definite-matrices.hook
for_stance: assured
---

$x^TAx > 0$ for every nonzero $x$ is the definition; eigenvalues all positive and Sylvester's leading-minors test are equivalent characterizations, not separate facts to memorize — pick whichever the question hands you cheaply.

Positive semidefinite (eigenvalues $\ge 0$, minors $\ge 0$) is the trap variant: a single zero eigenvalue breaks strict positivity but leaves Cholesky needing a rank-deficient variant. Where does that distinction actually bite in an optimization or covariance question?
