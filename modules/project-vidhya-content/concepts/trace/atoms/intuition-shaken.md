---
# Alternative body for trace.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: trace.intuition.shaken
concept_id: trace
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: trace.intuition
for_stance: shaken
---

Take $A=\begin{pmatrix}2&1\\0&3\end{pmatrix}$. The diagonal entries are $2$ and $3$; add them: $\text{tr}(A)=5$.

Here's the useful fact: that same number is also the sum of the eigenvalues. For this matrix (already triangular), the eigenvalues sit right on the diagonal — $2$ and $3$ — so the sum is $5$ either way, no coincidence.

The trace doesn't care how you look at the matrix: rotate your coordinate system and the individual entries change, but $\text{tr}(A)$ stays the same, because it's tied to the eigenvalues, and those don't move.

One more thing worth having: $\text{tr}(AB)=\text{tr}(BA)$ for any two matrices, even though $AB$ itself usually isn't equal to $BA$.
