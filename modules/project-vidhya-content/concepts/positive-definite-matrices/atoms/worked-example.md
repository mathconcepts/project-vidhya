---
id: positive-definite-matrices.worked-example
concept_id: positive-definite-matrices
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Test whether $A = \begin{pmatrix} 4 & 2 \\ 2 & 3 \end{pmatrix}$ is positive definite using Sylvester's criterion, and verify by computing its eigenvalues.

---

**Step 1 — First leading principal minor.** $D_1 = A_{11} = 4 > 0$ ✓

---

**Step 2 — Second leading principal minor (full determinant).** $D_2 = \det(A) = (4)(3)-(2)(2) = 12-4 = 8 > 0$ ✓

---

**Step 3 — Apply Sylvester's criterion and verify with eigenvalues.** Both minors strictly positive, so $A$ is **positive definite** by Sylvester's criterion.

Verify: $\det(A-\lambda I) = (4-\lambda)(3-\lambda)-4 = \lambda^2-7\lambda+8=0 \Rightarrow \lambda = \frac{7\pm\sqrt{17}}{2}$. Since $\sqrt{17}\approx4.12<7$, both roots are positive: $\lambda_1\approx5.56$, $\lambda_2\approx1.44$ ✓.

$$\boxed{\text{$A$ is positive definite}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Testing Positive Definiteness via Sylvester's Criterion","steps":[{"prompt":"What is the first leading principal minor $D_1$?","hint":"It is just the element $A_{11}$.","answer":"$D_1 = 4$"},{"prompt":"Compute the full determinant $D_2 = \\det(A)$.","hint":"For a $2 \\times 2$ matrix, use $ad - bc$.","answer":"$D_2 = (4)(3) - (2)(2) = 8$"},{"prompt":"What is the conclusion from Sylvester's criterion?","hint":"Check: are both $D_1 > 0$ and $D_2 > 0$?","answer":"Yes, both strictly positive, so by Sylvester's criterion, $A$ is positive definite."}],"caption":"Sylvester's criterion: all leading principal minors must be strictly positive for positive definiteness."}
```
