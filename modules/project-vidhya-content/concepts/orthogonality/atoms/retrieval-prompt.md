---
id: orthogonality.retrieval-prompt
concept_id: orthogonality
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Is the matrix $Q = \begin{pmatrix} 1/\sqrt{2} & -1/\sqrt{2} \\ 1/\sqrt{2} & 1/\sqrt{2} \end{pmatrix}$ orthogonal?

- **(A)** Yes, $Q^T Q = I$
- **(B)** No, the columns are not orthogonal
- **(C)** No, the columns are not unit vectors
- **(D)** Cannot determine

<details>
<summary>Answer</summary>

**A**. For $Q$ to be orthogonal, we need $Q^T Q = I$.

First, compute $Q^T$:
$Q^T = \begin{pmatrix} 1/\sqrt{2} & 1/\sqrt{2} \\ -1/\sqrt{2} & 1/\sqrt{2} \end{pmatrix}$.

Now compute $Q^T Q$:
$Q^T Q = \begin{pmatrix} 1/\sqrt{2} & 1/\sqrt{2} \\ -1/\sqrt{2} & 1/\sqrt{2} \end{pmatrix} \begin{pmatrix} 1/\sqrt{2} & -1/\sqrt{2} \\ 1/\sqrt{2} & 1/\sqrt{2} \end{pmatrix}$

Element (1,1): $(1/\sqrt{2})(1/\sqrt{2}) + (1/\sqrt{2})(1/\sqrt{2}) = 1/2 + 1/2 = 1$ ✓

Element (1,2): $(1/\sqrt{2})(-1/\sqrt{2}) + (1/\sqrt{2})(1/\sqrt{2}) = -1/2 + 1/2 = 0$ ✓

Element (2,1): $(-1/\sqrt{2})(1/\sqrt{2}) + (1/\sqrt{2})(1/\sqrt{2}) = -1/2 + 1/2 = 0$ ✓

Element (2,2): $(-1/\sqrt{2})(-1/\sqrt{2}) + (1/\sqrt{2})(1/\sqrt{2}) = 1/2 + 1/2 = 1$ ✓

So $Q^T Q = I$, confirming $Q$ is orthogonal.

</details>
