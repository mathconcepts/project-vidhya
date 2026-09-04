---
# Alternative body for symmetric-matrices.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: symmetric-matrices.intuition.assured
concept_id: symmetric-matrices
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: symmetric-matrices.intuition
for_stance: assured
---

$A^T = A$ is the condition under which $\langle Av, w\rangle = \langle v, Aw\rangle$ for every $v, w$ — matrices with this property are called *self-adjoint* (in finite dimensions, exactly the symmetric ones). That inner-product identity is what forces real eigenvalues and an orthogonal eigenbasis; it isn't a coincidence about entries mirroring across the diagonal. Check it on the hook's own $A=\begin{pmatrix}3&1\\1&3\end{pmatrix}$: eigenvalues $4,2$ (real), eigenvectors $(1,1),(1,-1)$ (orthogonal), exactly as promised.

Two things worth having ready: repeated eigenvalues never cost you diagonalizability here (unlike the general case), and the quadratic form $x^TAx$ (a single number built by squaring and cross-multiplying $A$'s entries against $x$) inherits its sign pattern directly from the eigenvalues — plug $x=(1,-1)$ into $3x_1^2+2x_1x_2+3x_2^2$ and you get $4$, exactly $\lambda=2$ times $\|x\|^2=2$. Both eigenvalues positive here is the seed of positive-definiteness and Sylvester's criterion, a later topic.

A common trap: symmetry is not preserved by an arbitrary similarity transform $P^{-1}AP$, only by an orthogonal one, $Q^TAQ$. Losing that distinction breaks every claim above.
