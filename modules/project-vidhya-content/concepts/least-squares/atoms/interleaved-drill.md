---
id: least-squares.interleaved-drill
concept_id: least-squares
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: least-squares.micro_exercise
---

**Cross-concept check: least squares → inner product spaces.**

$A = \begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix}$, $b = \begin{pmatrix} 1 \\ 2 \\ 2 \end{pmatrix}$, with least-squares solution $\hat{x} = \left(\tfrac{7}{6}, \tfrac{1}{2}\right)^T$ (verified) and residual $\hat{r} = b - A\hat{x} = \tfrac{1}{6}(-1, 2, -1)^T$.

**Question 1 (least squares):** Verify $\hat{x}$ without re-solving — using only the defining orthogonality.

*Answer:* Check $\hat{r}$ against each column. With $a_1 = (1,1,1)^T$ and $a_2 = (0,1,2)^T$:

$$\langle \hat{r}, a_1 \rangle = \tfrac{1}{6}(-1 + 2 - 1) = 0, \qquad \langle \hat{r}, a_2 \rangle = \tfrac{1}{6}(0 + 2 - 2) = 0$$

Both zero, so $A^T\hat{r} = 0$ ✓ — and that *is* the normal equations, just written as two inner products instead of one matrix equation.

**Question 2 (inner product spaces):** $\hat{r} \perp A\hat{x}$, since $A\hat{x} \in \text{col}(A)$. What identity does that hand you for free, and does it hold here?

*Answer:* The Pythagorean theorem in an inner product space: if $\langle u, v \rangle = 0$ then $\|u + v\|^2 = \|u\|^2 + \|v\|^2$. Applied to $b = A\hat{x} + \hat{r}$:

$$\|b\|^2 = \|A\hat{x}\|^2 + \|\hat{r}\|^2$$

Check: $\|b\|^2 = 1 + 4 + 4 = 9$. $A\hat{x} = \tfrac{1}{6}(7, 10, 13)^T$, so $\|A\hat{x}\|^2 = \tfrac{49 + 100 + 169}{36} = \tfrac{53}{6}$. And $\|\hat{r}\|^2 = \tfrac{1 + 4 + 1}{36} = \tfrac{1}{6}$. Sum: $\tfrac{53}{6} + \tfrac{1}{6} = 9$ ✓ (verified).

So $\|\hat{r}\|^2 = \|b\|^2 - \|A\hat{x}\|^2$ — the minimum squared error, obtainable without ever forming $\hat{r}$.

**Why this drill exists:** students file the normal equations as a formula to reproduce, not as the sentence "the residual is orthogonal to the column space." Once it's the sentence, three things become obvious that were previously separate facts to memorise: the equations themselves, the Pythagorean split of $\|b\|^2$, and why the whole method transfers verbatim to a weighted or function-space inner product where $A^TA$ is no longer the right object.
