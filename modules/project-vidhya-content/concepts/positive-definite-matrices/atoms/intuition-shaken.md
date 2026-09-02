---
# Alternative body for positive-definite-matrices.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
id: positive-definite-matrices.intuition.shaken
concept_id: positive-definite-matrices
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: positive-definite-matrices.intuition
for_stance: shaken
---

Picture a bowl, right-side up — bottom at the origin, curving upward everywhere else. $A = \begin{pmatrix} 2 & 0 \\ 0 & 3 \end{pmatrix}$ draws exactly that: $x^TAx = 2x_1^2 + 3x_2^2$, positive except at the origin.

If any direction curved downward instead, some vector would give a negative number. Positive definite rules that out.

Three equivalent checks: every eigenvalue positive, every leading principal minor positive, or Cholesky $A = LL^T$ succeeds with no row swaps.
