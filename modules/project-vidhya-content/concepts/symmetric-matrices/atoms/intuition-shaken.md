---
# Alternative body for symmetric-matrices.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: symmetric-matrices.intuition.shaken
concept_id: symmetric-matrices
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: symmetric-matrices.intuition
for_stance: shaken
---

$A = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$. Read down the diagonal, then read across: same entries, mirrored. $A^T = A$.

Picture the ellipse $2x^2 + 2xy + 3y^2 = 4$. Its two axes sit exactly perpendicular to each other — that's what symmetry guarantees. Those axis directions are the eigenvectors; how far the ellipse stretches along each is the eigenvalue.

No complex numbers ever show up here. Symmetric always means real eigenvalues, perpendicular eigenvectors.
