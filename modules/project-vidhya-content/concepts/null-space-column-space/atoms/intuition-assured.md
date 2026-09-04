---
# Alternative body for null-space-column-space.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: null-space-column-space.intuition.assured
concept_id: null-space-column-space
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: null-space-column-space.intuition
for_stance: assured
---

For the matrix in the scene above, $C=\begin{pmatrix}1&-1\\-1&1\end{pmatrix}$: $\text{Null}(C)=\text{span}(1,1)$ and $\text{Col}(C)=\text{span}(1,-1)$ — rank 1 plus nullity 1 accounts for both columns directly. More generally: $\text{Null}(A)=\{x \in \mathbb{R}^n : Ax=0\}$ and $\text{Col}(A)=\{Ax : x \in \mathbb{R}^n\} \subseteq \mathbb{R}^m$ for an $m\times n$ matrix $A$ — kernel and image of the same linear map, living in different spaces ($\mathbb{R}^n$ vs. $\mathbb{R}^m$).

Rank-nullity ties their dimensions: $\dim\text{Col}(A)=\text{rank}(A)$, $\dim\text{Null}(A)=\text{nullity}(A)=n-\text{rank}(A)$.

To find a basis for each from RREF: pivot columns of the *original* $A$ span $\text{Col}(A)$; solving $Ax=0$ from the free variables spans $\text{Null}(A)$.

Where this earns marks: $\text{Col}(A)=\mathbb{R}^m \iff A$ surjective $\iff Ax=b$ solvable for every $b$; $\text{Null}(A)=\{0\} \iff A$ injective. Both, together, for square $A$: $A$ invertible.
