---
id: jordan-normal-form.intuition
concept_id: jordan-normal-form
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Think of diagonalization as the ideal: a matrix decomposes into isolated eigenvalue "buckets." But some matrices are defective — not enough independent eigenvectors fill those buckets. The Jordan Normal Form relaxes the ideal: instead of pure diagonal blocks, use **Jordan blocks**, which are diagonal plus a superdiagonal of 1's. A $2 \times 2$ Jordan block for eigenvalue $\lambda$ looks like $\begin{pmatrix} \lambda & 1 \\ 0 & \lambda \end{pmatrix}$, capturing an eigenvalue paired with a "generalized eigenvector." The blocks stack along the diagonal — just like diagonalization, but allowing this slightly richer structure. Every matrix has a Jordan form; it's the unique "almost-diagonal" home every matrix can reach.