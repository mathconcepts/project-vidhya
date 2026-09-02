---
id: matrix-inverse.exam-pattern
concept_id: matrix-inverse
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **"Find one entry of $A^{-1}$" is a cofactor question, not an inverse question.** From $A^{-1} = \frac{1}{\det A}\,\text{adj}(A)$ and $\text{adj}(A) = C^T$:

  $$(A^{-1})_{ij} = \frac{C_{ji}}{\det A}$$

  Note the **swapped indices** — that transpose is the whole trap. For $A = \begin{pmatrix} 1 & 2 & 3 \\ 0 & 1 & 4 \\ 5 & 6 & 0 \end{pmatrix}$ ($\det A = 1$), asking for $(A^{-1})_{12}$ needs $C_{21} = -\det\begin{pmatrix} 2 & 3 \\ 6 & 0 \end{pmatrix} = 18$, so $(A^{-1})_{12} = 18$ — one $2\times2$ determinant, not nine.

- **Determinant facts, asked as MCQ/MSQ standards:**
  - $\det(A^{-1}) = 1/\det(A)$
  - $(kA)^{-1} = \frac{1}{k}A^{-1}$ — but $\det(kA) = k^n \det A$ for $n\times n$. The exponent $n$ is the distractor generator.
  - $(A^{-1})^T = (A^T)^{-1}$, and $(A^{-1})^{-1} = A$.

- **If the question ends in "solve $Ax = b$", do not compute $A^{-1}$.** Gaussian elimination on the augmented matrix is faster and drops fewer signs. The inverse is only worth building when the *same* $A$ is reused across several right-hand sides.

- **The singularity trap.** GATE likes stems such as "for which value of $k$ is $A$ **not** invertible?" — that's $\det A = 0$, one equation. Check the determinant *before* anything else.

- **Time budget:** a $2\times2$ inverse is 20 seconds. A single entry of a $3\times3$ inverse is under a minute. A full $3\times3$ adjugate is a 3-minute job — if you're doing one, re-read the question, because you probably don't need it.
