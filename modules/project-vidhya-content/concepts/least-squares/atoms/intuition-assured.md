---
# Alternative body for least-squares.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
id: least-squares.intuition.assured
concept_id: least-squares
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: least-squares.intuition
for_stance: assured
---

$\hat x$ minimizes $\|b-Ax\|$ exactly when the residual $r=b-A\hat x$ is orthogonal to $\text{Col}(A)$ — i.e., $A^Tr=0$, which expands directly to the normal equations $A^TA\hat x = A^Tb$. That derivation *is* the geometry; there's no separate calculus argument to remember.

**Where it costs marks:** $A^TA$ is invertible iff $A$ has full column rank. If columns of $A$ are linearly dependent, $A^TA$ is singular and the normal equations have infinitely many solutions — check rank before reaching for $(A^TA)^{-1}$.
