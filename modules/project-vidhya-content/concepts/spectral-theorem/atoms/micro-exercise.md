---
id: spectral-theorem.micro-exercise
concept_id: spectral-theorem
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

**Question (1 mark):**

The matrix $A = \begin{pmatrix} 5 & 2 \\ 2 & 5 \end{pmatrix}$ is symmetric. Its eigenvalues are $\lambda_1 = 3$ and $\lambda_2 = 7$. Which of the following statements is **false**?

A) The eigenvectors of $A$ can be chosen to be orthonormal.

B) $A$ can be written as $A = Q\Lambda Q^{\mathrm{T}}$ where $Q$ is orthogonal and $\Lambda = \begin{pmatrix} 3 & 0 \\ 0 & 7 \end{pmatrix}$.

C) The determinant of $A$ equals $\lambda_1 \cdot \lambda_2 = 21$.

D) If $B = (A)^3$, then $B = Q\Lambda^3 Q^{\mathrm{T}}$ where $\Lambda^3 = \begin{pmatrix} 27 & 0 \\ 0 & 343 \end{pmatrix}$.

E) $Q$ can be built from *any* two linearly independent eigenvectors of $A$, without normalizing them to unit length.

<details><summary>Answer</summary>

**E is false.** A, B, C, D all follow directly from the Spectral Theorem for a real symmetric matrix: eigenvectors for distinct eigenvalues (here $3 \neq 7$) are automatically orthogonal, so choosing unit eigenvectors gives an orthonormal — hence orthogonal — $Q$ with $A = Q\Lambda Q^{\mathrm T}$, and matrix powers follow the same decomposition with $\Lambda$ raised elementwise ($3^3=27$, $7^3=343$).

E is the trap: picking *any* linearly independent eigenvectors (e.g. unnormalized ones) is not enough. $Q\Lambda Q^{\mathrm T} = A$ only holds when $Q$ is genuinely orthogonal — $Q^{\mathrm T}Q = I$, meaning its columns are unit length **and** mutually orthogonal. Skip the normalization step and the identity breaks even though the eigenvectors themselves are correct. This is the single most common slip when writing out a spectral decomposition by hand.

</details>