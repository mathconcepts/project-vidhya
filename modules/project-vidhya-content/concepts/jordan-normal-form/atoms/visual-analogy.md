---
id: jordan-normal-form.visual_analogy
concept_id: jordan-normal-form
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Imagine defective matrices as a "corruption" of the ideal diagonal form. Diagonalization says: "This matrix is secretly a stack of independent 1D scales." Jordan form says: "If the matrix is defective, some scales are coupled — they're no longer independent, so we link them with a superdiagonal of 1's. The 1 in position $(i, i+1)$ means the $(i+1)$-th component is 'dragged along' by the $i$-th component, since there aren't enough eigenvectors to decouple them."

A $2 \times 2$ defective matrix with one repeated eigenvalue $\lambda$ (and only one eigenvector) is similar to $\begin{pmatrix} \lambda & 1 \\ 0 & \lambda \end{pmatrix}$: both components scale by $\lambda$, but the second also picks up a contribution from the first. It's the minimal "corruption" you need to tolerate when the matrix refuses to diagonalize.