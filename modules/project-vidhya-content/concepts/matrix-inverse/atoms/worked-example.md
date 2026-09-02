---
id: matrix-inverse.worked-example
concept_id: matrix-inverse
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find the inverse of $A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$ and verify $AA^{-1} = I$.

---

**Step 1 — Check the inverse exists.** $\det(A) = (1)(4)-(2)(3) = 4-6 = -2 \neq 0$. ✓

---

**Step 2 — Form the adjugate.** For $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$, the adjugate is $\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$: $\text{adj}(A) = \begin{pmatrix} 4 & -2 \\ -3 & 1 \end{pmatrix}$.

---

**Step 3 — Divide by the determinant.**

$$A^{-1} = \frac{1}{-2}\begin{pmatrix} 4 & -2 \\ -3 & 1 \end{pmatrix} = \boxed{\begin{pmatrix} -2 & 1 \\ 1.5 & -0.5 \end{pmatrix}}$$

---

**Step 4 — Verify.**

- $(1)(-2)+(2)(1.5) = -2+3 = 1$
- $(1)(1)+(2)(-0.5) = 1-1 = 0$
- $(3)(-2)+(4)(1.5) = -6+6 = 0$
- $(3)(1)+(4)(-0.5) = 3-2 = 1$

$$AA^{-1} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = I \quad\checkmark$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding a 2×2 matrix inverse","steps":[{"prompt":"Step 1: Calculate the determinant of $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$. What is $\\det(A)$?","hint":"Use the formula $\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$.","answer":"$\\det(A) = (1)(4) - (2)(3) = -2$"},{"prompt":"Step 2: Write the adjugate matrix by swapping the diagonal elements, negating the off-diagonal elements. What is $\\text{adj}(A)$?","hint":"For $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$, swap 1 and 4, negate 2 and 3.","answer":"$\\text{adj}(A) = \\begin{pmatrix} 4 & -2 \\\\ -3 & 1 \\end{pmatrix}$"},{"prompt":"Step 3: Apply $A^{-1} = \\frac{1}{\\det(A)} \\cdot \\text{adj}(A)$. Compute $A^{-1}$.","hint":"Divide each entry of the adjugate by $\\det(A) = -2$.","answer":"$A^{-1} = \\begin{pmatrix} -2 & 1 \\\\ 1.5 & -0.5 \\end{pmatrix}$"}],"caption":"The adjugate method is fastest for small matrices. For large matrices in exams, recognize that $A^{-1}$ exists iff $\\det(A) \\neq 0$."}
```
