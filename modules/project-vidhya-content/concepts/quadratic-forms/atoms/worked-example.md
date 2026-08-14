---
id: quadratic-forms.worked_example
concept_id: quadratic-forms
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
---

**Problem:** Classify the quadratic form $f(x, y) = 2x^2 + 4xy + 5y^2$, and express it in canonical (diagonal) form.

---

**Step 1: Form the symmetric matrix**

Collect coefficients: the coefficient of $x^2$ is 2, of $y^2$ is 5, and of $2xy$ is 4, so the cross-term coefficient is $4/2 = 2$.

$$A = \begin{pmatrix} 2 & 2 \\ 2 & 5 \end{pmatrix}$$

---

**Step 2: Find eigenvalues**

Compute the characteristic polynomial:
$$\det(A - \lambda I) = \det\begin{pmatrix} 2-\lambda & 2 \\ 2 & 5-\lambda \end{pmatrix} = (2-\lambda)(5-\lambda) - 4 = \lambda^2 - 7\lambda + 6 = (\lambda - 1)(\lambda - 6)$$

So $\lambda_1 = 1$ and $\lambda_2 = 6$.

---

**Step 3: Classify definiteness**

Both eigenvalues are strictly positive ($\lambda_1 = 1 > 0$ and $\lambda_2 = 6 > 0$), so the quadratic form is **positive definite**.

---

**Step 4: Canonical form**

Under the change of variables $\mathbf{x} = P\mathbf{y}$ (where $P$ is the orthogonal matrix of eigenvectors), the form becomes:
$$f = \lambda_1 y_1^2 + \lambda_2 y_2^2 = y_1^2 + 6y_2^2$$

$$\boxed{\text{Positive definite; canonical form: } y_1^2 + 6y_2^2}$$

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Classify a quadratic form","steps":[{"prompt":"Write the symmetric matrix for $2x^2 + 4xy + 5y^2$. Remember: off-diagonal entries are half the cross-term coefficient.","hint":"The diagonal is [2, 5]. The off-diagonal is 4/2 = 2. So $A = \\begin{pmatrix} 2 & 2 \\\\ 2 & 5 \\end{pmatrix}$.","answer":"$A = \\begin{pmatrix} 2 & 2 \\\\ 2 & 5 \\end{pmatrix}$"},{"prompt":"Find the eigenvalues by solving $\\det(A - \\lambda I) = 0$.","hint":"$(2-\\lambda)(5-\\lambda) - 4 = \\lambda^2 - 7\\lambda + 6$. Factor this quadratic.","answer":"$\\lambda_1 = 1$, $\\lambda_2 = 6$"},{"prompt":"Classify the form based on the signs of the eigenvalues.","hint":"Both eigenvalues are positive. Check the definition of positive definiteness.","answer":"Positive definite (all eigenvalues > 0)"},{"prompt":"Write the canonical form. Replace the original variables with the diagonalized version.","hint":"The form becomes $\\lambda_1 y_1^2 + \\lambda_2 y_2^2$. Substitute the eigenvalues.","answer":"Canonical form: $y_1^2 + 6y_2^2$"}],"caption":"Classify a quadratic form by finding its matrix, eigenvalues, and signs."}
```