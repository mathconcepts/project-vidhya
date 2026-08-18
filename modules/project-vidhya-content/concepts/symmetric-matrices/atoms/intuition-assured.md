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

$A^T = A$ is the condition under which $\langle Av, w\rangle = \langle v, Aw\rangle$ for every $v, w$ — self-adjointness in the finite-dimensional case. That inner-product identity is what forces real eigenvalues and an orthogonal eigenbasis; it isn't a coincidence about entries mirroring across the diagonal.

Two things worth having ready: repeated eigenvalues never cost you diagonalizability here (unlike the general case), and the quadratic form $x^TAx$ inherits its sign pattern directly from the eigenvalues — that's the bridge into positive-definiteness and Sylvester's criterion.

A common trap: symmetry is not preserved by an arbitrary similarity transform $P^{-1}AP$, only by an orthogonal one, $Q^TAQ$. Losing that distinction breaks every claim above.
