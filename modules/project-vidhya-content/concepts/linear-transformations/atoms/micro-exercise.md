---
id: linear-transformations.micro-exercise
concept_id: linear-transformations
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Is the function $T(x, y) = (x + 1, y)$ a linear transformation from $\mathbb{R}^2$ to $\mathbb{R}^2$?

- **(A)** Yes
- **(B)** No, because $T(0, 0) \neq (0, 0)$
- **(C)** Cannot determine without more information
- **(D)** Yes only if we add a constant vector

<details>
<summary>Answer</summary>

**B**. A linear transformation must satisfy $T(\mathbf{0}) = \mathbf{0}$ (this follows from $T(0 \cdot \mathbf{v}) = 0 \cdot T(\mathbf{v}) = \mathbf{0}$).

For $T(x, y) = (x + 1, y)$: $T(0, 0) = (0 + 1, 0) = (1, 0) \neq (0, 0)$.

Therefore, $T$ is not linear. It's an affine transformation (a linear transformation followed by a translation).

</details>
