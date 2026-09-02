---
id: quadratic-forms.worked_example
concept_id: quadratic-forms
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Classify $f(x,y)=2x^2+4xy+5y^2$, and give its canonical (diagonal) form.

---

**Step 1 — Form the symmetric matrix.** Diagonal takes the square coefficients whole ($2$, $5$); the cross-term coefficient $4$ halves into both off-diagonal slots. $A = \begin{pmatrix} 2 & 2 \\ 2 & 5 \end{pmatrix}$.

---

**Step 2 — Find the eigenvalues.** $\det(A-\lambda I) = (2-\lambda)(5-\lambda)-4 = \lambda^2-7\lambda+6 = (\lambda-1)(\lambda-6)$. So $\lambda_1=1$, $\lambda_2=6$.

---

**Step 3 — Classify.** Both eigenvalues strictly positive $\Rightarrow$ **positive definite**.

---

**Step 4 — Canonical form.** Under the orthogonal change of variables to the eigenbasis, $f = \lambda_1y_1^2+\lambda_2y_2^2$.

$$\boxed{\text{Positive definite; canonical form } y_1^2 + 6y_2^2}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Classify a quadratic form","steps":[{"prompt":"Write the symmetric matrix for $2x^2 + 4xy + 5y^2$. Remember: off-diagonal entries are half the cross-term coefficient.","hint":"The diagonal is [2, 5]. The off-diagonal is 4/2 = 2. So $A = \\begin{pmatrix} 2 & 2 \\\\ 2 & 5 \\end{pmatrix}$.","answer":"$A = \\begin{pmatrix} 2 & 2 \\\\ 2 & 5 \\end{pmatrix}$"},{"prompt":"Find the eigenvalues by solving $\\det(A - \\lambda I) = 0$.","hint":"$(2-\\lambda)(5-\\lambda) - 4 = \\lambda^2 - 7\\lambda + 6$. Factor this quadratic.","answer":"$\\lambda_1 = 1$, $\\lambda_2 = 6$"},{"prompt":"Classify the form based on the signs of the eigenvalues.","hint":"Both eigenvalues are positive. Check the definition of positive definiteness.","answer":"Positive definite (all eigenvalues > 0)"},{"prompt":"Write the canonical form. Replace the original variables with the diagonalized version.","hint":"The form becomes $\\lambda_1 y_1^2 + \\lambda_2 y_2^2$. Substitute the eigenvalues.","answer":"Canonical form: $y_1^2 + 6y_2^2$"}],"caption":"Classify a quadratic form by finding its matrix, eigenvalues, and signs."}
```
