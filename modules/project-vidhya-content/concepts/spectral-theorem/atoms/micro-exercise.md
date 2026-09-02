---
id: spectral-theorem.micro-exercise
concept_id: spectral-theorem
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
estimated_minutes: 2
---

$A = \begin{pmatrix} 5 & 2 \\ 2 & 5 \end{pmatrix}$ is symmetric with eigenvalues $3$ and $7$. Which statement is false: (A) eigenvectors can be chosen orthonormal (B) $A=Q\Lambda Q^T$ with $\Lambda=\text{diag}(3,7)$ (C) $\det A=21$ (D) $Q$ may be built from *any* two independent eigenvectors, unnormalized.

<details><summary>Answer</summary>

**(D) is false.** $Q\Lambda Q^T=A$ requires $Q$ genuinely orthogonal — unit-length *and* mutually orthogonal columns. Any independent eigenvectors span the right lines, but skipping normalization breaks $Q^TQ=I$ and the identity fails even though the directions were correct. (A), (B), (C) all follow directly from the theorem.
</details>
