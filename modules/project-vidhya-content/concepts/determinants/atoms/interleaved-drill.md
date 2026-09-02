---
id: determinants.interleaved-drill
concept_id: determinants
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: determinants.micro-exercise
---

**Cross-concept check: determinants → matrix inverse.**

$A = \begin{pmatrix} 1 & 2 & 3 \\ 0 & 1 & 4 \\ 5 & 6 & 0 \end{pmatrix}$

**Question 1 (determinants):** Compute $\det(A)$, and say what it tells you about $A^{-1}$.

*Answer:* Expand along **column 1** — it carries a zero, so only two cofactors are needed:

$$\det(A) = 1 \cdot \begin{vmatrix} 1 & 4 \\ 6 & 0\end{vmatrix} - 0 + 5 \cdot \begin{vmatrix} 2 & 3 \\ 1 & 4\end{vmatrix} = 1(0 - 24) + 5(8 - 3) = -24 + 25 = 1$$

Since $\det(A) = 1 \neq 0$, $A$ is invertible — and because the determinant is exactly $1$, $A^{-1} = \frac{1}{\det A}\text{adj}(A) = \text{adj}(A)$ has all-integer entries.

**Question 2 (matrix inverse):** Find the $(1,2)$ entry of $A^{-1}$ — that one entry only, without computing the other eight.

*Answer:* $A^{-1} = \frac{1}{\det A}\text{adj}(A)$ and $\text{adj}(A) = C^T$, so the $(1,2)$ entry of $A^{-1}$ uses the $(2,1)$ **cofactor**:

$$(A^{-1})_{12} = \frac{C_{21}}{\det A}, \qquad C_{21} = (-1)^{2+1}\begin{vmatrix} 2 & 3 \\ 6 & 0\end{vmatrix} = -(0 - 18) = 18$$

So $(A^{-1})_{12} = 18/1 = 18$ (checked against the full inverse $\begin{pmatrix} -24 & 18 & 5 \\ 20 & -15 & -4 \\ -5 & 4 & 1\end{pmatrix}$).

**Why this drill exists:** the misconception is "$\text{adj}(A)$ is the cofactor matrix." It is the **transpose** of it. Skip the transpose and you compute $C_{12} = -\begin{vmatrix} 0 & 4 \\ 5 & 0\end{vmatrix} = 20$ instead of $18$ — an integer, plausible, and wrong. A symmetric matrix would hide the error entirely; this deliberately non-symmetric one exposes it.
