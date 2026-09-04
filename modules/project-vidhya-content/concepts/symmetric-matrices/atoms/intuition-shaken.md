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

$A=\begin{pmatrix}3&1\\1&3\end{pmatrix}$ — same matrix as the hook. Read down the diagonal ($3$, $3$), then read across: the off-diagonal entries are both $1$. Flip rows and columns and nothing changes. That's it: $A=A^T$, a *symmetric* matrix.

From the hook, you already know the two directions that don't turn: $(1,1)$, stretched by $4$, and $(1,-1)$, stretched by $2$. Symmetric matrices guarantee those two things always happen together: the stretch factors ($4$ and $2$) are real numbers, never complex, and the two directions always meet at a right angle, exactly like you watched.

No new arithmetic here — just a name for what the hook already showed you: real eigenvalues, perpendicular eigenvectors.
