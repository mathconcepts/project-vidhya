---
# Alternative body for matrix-inverse.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-inverse.intuition.assured
concept_id: matrix-inverse
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-inverse.intuition
for_stance: assured
---

For the invertible matrix in the scene above, $A=\begin{pmatrix}3&1\\1&1\end{pmatrix}$, $\det(A)=2\neq0$ confirms what the animation already showed geometrically — the plane stays spread out, so $A^{-1}=\begin{pmatrix}0.5&-0.5\\-0.5&1.5\end{pmatrix}$ exists. The ghost matrix $\begin{pmatrix}2&1\\4&2\end{pmatrix}$ has $\det=0$: row 2 is $2\times$ row 1, rank 1, and no adjugate formula rescues that — the collapse is real, not a rounding artefact. More generally: $A^{-1}$ exists iff $A$ is square and $\det(A) \neq 0$ — really one condition, since a non-square map can't have a two-sided inverse and a singular square matrix has already discarded a dimension nothing can restore.

Two routes to compute it: the adjugate formula $A^{-1} = \frac{1}{\det A}\text{adj}(A)$ is fast at $2\times2$ and workable at $3\times3$; past that, Gauss-Jordan on $[A \mid I]$ dominates, since cofactor-based methods are $O(n!)$.

Identities worth having automatic: $(AB)^{-1} = B^{-1}A^{-1}$ (order reverses), $(A^{-1})^{-1} = A$, $(A^T)^{-1} = (A^{-1})^T$, and $\det(A^{-1}) = 1/\det(A)$.

Where marks are actually lost: treating "invertible" as a property that degrades gracefully. It doesn't — a matrix a hair away from singular is exactly as invertible as one that isn't, and a question hinging on $\det(A)=0$ vs. $\det(A)=\epsilon$ is testing whether you check the determinant at all before reaching for the adjugate.
