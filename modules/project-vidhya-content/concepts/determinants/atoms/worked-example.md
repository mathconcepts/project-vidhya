---
id: determinants.worked-example
concept_id: determinants
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Compute $\det(A)$ for $A = \begin{pmatrix} 2 & 1 & -1 \\ 1 & 3 & 2 \\ -1 & 2 & 0 \end{pmatrix}$.

---

**Step 1 — Pick the row/column with the most zeros.** Row 3 is $(-1, 2, 0)$ — one zero, so expand along it: $\det(A) = (-1)C_{31} + 2C_{32} + 0\cdot C_{33}$.

---

**Step 2 — Compute $C_{31}$.** $M_{31} = \begin{vmatrix} 1 & -1 \\ 3 & 2 \end{vmatrix} = (1)(2)-(-1)(3) = 5$, and $C_{31} = (-1)^{3+1}(5) = 5$.

---

**Step 3 — Compute $C_{32}$.** $M_{32} = \begin{vmatrix} 2 & -1 \\ 1 & 2 \end{vmatrix} = (2)(2)-(-1)(1) = 5$, and $C_{32} = (-1)^{3+2}(5) = -5$.

---

**Step 4 — Assemble.** $\det(A) = (-1)(5) + (2)(-5) + 0 = -5 - 10 = -15$.

$$\boxed{\det(A) = -15}$$

**Check:** negative sign means the transformation reverses orientation; magnitude $15$ means volumes scale by that factor. $A$ is invertible since $\det(A) \neq 0$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Cofactor expansion for 3×3 determinant","steps":[{"prompt":"Step 1: Why did we expand along row 3?","hint":"Look for a row or column with zeros—it reduces the number of 2×2 minors you need to compute.","answer":"Row 3 contains a zero in position (3,3), so we skip computing that cofactor entirely."},{"prompt":"Step 2: What is the sign $(-1)^{3+1}$ for $C_{31}$?","hint":"The sign in a cofactor is $(-1)^{i+j}$ where $i$ is the row and $j$ is the column. Calculate the exponent: $3 + 1 = ?$","answer":"$3 + 1 = 4$, which is even, so $(-1)^4 = +1$. The cofactor $C_{31}$ is positive."},{"prompt":"Step 3: Why must we include the $2 \\times 2$ minors in the final formula?","hint":"The cofactor expansion formula multiplies each matrix entry by its cofactor. Check: $-1 \\cdot C_{31} + 2 \\cdot C_{32} + 0 \\cdot C_{33}$.","answer":"Each entry in the expansion row (row 3 in this case) is multiplied by its corresponding cofactor. Entry $(3,1) = -1$ gets cofactor $C_{31} = 5$, so contribution is $(-1)(5) = -5$."}],"caption":"Cofactor expansion is systematic: find the row/column with most zeros, compute $2 \\times 2$ minors, apply sign rules, and sum weighted by row/column entries."}
```
