---
# Alternative body for symmetric-matrices.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: symmetric-matrices.hook.shaken
concept_id: symmetric-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: symmetric-matrices.hook
for_stance: shaken
---

Take $A = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$. Flip it over its diagonal, rows become columns — you get the same matrix back.

That's symmetric: $A = A^T$.

These matrices get two guarantees free: every eigenvalue is real, and eigenvectors from different eigenvalues sit at right angles.
