---
id: linear-algebra-eigenvalues.worked-example
concept_id: linear-algebra-eigenvalues
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find the eigenvalues of $A = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$.

---

**Step 1 — Form $A - \lambda I$.** $A - \lambda I = \begin{pmatrix} 4-\lambda & 1 \\ 2 & 3-\lambda \end{pmatrix}$.

---

**Step 2 — Compute the determinant.** $\det(A - \lambda I) = (4-\lambda)(3-\lambda) - (1)(2) = \lambda^2 - 7\lambda + 12 - 2 = \lambda^2 - 7\lambda + 10$.

---

**Step 3 — Solve $\det = 0$.** $\lambda^2 - 7\lambda + 10 = 0 \Rightarrow (\lambda - 5)(\lambda - 2) = 0$.

---

**Step 4 — Read off the eigenvalues.** $\lambda_1 = 5, \lambda_2 = 2$. Sanity check: $\lambda_1 + \lambda_2 = 7 = \text{tr}(A)$ ✓; $\lambda_1 \lambda_2 = 10 = \det(A)$ ✓.
