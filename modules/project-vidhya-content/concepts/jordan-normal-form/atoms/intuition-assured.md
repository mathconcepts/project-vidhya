---
# Alternative body for jordan-normal-form.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching the chain metaphor.
id: jordan-normal-form.intuition.assured
concept_id: jordan-normal-form
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: jordan-normal-form.intuition
for_stance: assured
---

Hook's $A=\begin{pmatrix}5&1&0\\0&5&1\\0&0&5\end{pmatrix}$ is already written in Jordan form — its own chain, $v=(1,0,0)\to w_1=(0,1,0)\to w_2=(0,0,1)$, is exactly the $1$'s sitting above its diagonal.

$Av=\lambda v$ and $(A-\lambda I)w=v$ are the same statement about **invariant subspaces**, one dimension apart: an eigenvector spans a $1$-dimensional invariant line; a Jordan chain spans a higher-dimensional invariant subspace on which $A$ acts as $\lambda I$ plus a nilpotent shift.

## What actually costs marks

**Block count vs. block size.** Geometric multiplicity, $\dim\ker(A-\lambda I)$, gives the *number* of Jordan blocks for $\lambda$. Algebraic multiplicity gives their *combined* size. A repeated eigenvalue with geometric multiplicity $1$ is always exactly one block, whatever the algebraic multiplicity is.

**Minimal polynomial reads off the largest block.** The exponent of $(x-\lambda)$ in the minimal polynomial equals the size of $\lambda$'s *largest* Jordan block — not the number of blocks, and not their total size (that's the characteristic polynomial's job).

**$A$ is similar to $J$, not equal to it.** $A=PJP^{-1}$, where $P$'s columns are the eigenvector/generalized-eigenvector chain, in chain order. Reordering the chain reorders $P$'s columns, never $J$ itself.
