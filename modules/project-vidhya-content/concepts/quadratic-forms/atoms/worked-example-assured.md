---
# Alternative body for quadratic-forms.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
id: quadratic-forms.worked-example.assured
concept_id: quadratic-forms
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: quadratic-forms.worked_example
for_stance: assured
---

**Problem.** Classify $f(x,y)=2x^2+4xy+5y^2$; canonical form.

$$A = \begin{pmatrix} 2 & 2 \\ 2 & 5 \end{pmatrix}$$

**Sylvester's criterion first — faster than eigenvalues here.** Leading minors: $2>0$ and $\det A = 10-4=6>0$. Both positive $\Rightarrow$ positive definite, no characteristic polynomial required.

**Eigenvalues, for the canonical form.** $\lambda^2-7\lambda+6=0 \Rightarrow \lambda_1=1,\ \lambda_2=6$ — matches the Sylvester verdict, as it must.

$$\boxed{\text{Positive definite; canonical form: } y_1^2 + 6y_2^2}$$

**Where the shortcut breaks.** Sylvester's test only certifies positive definite (or, run on $-A$, negative definite) — it does not distinguish indefinite from negative semidefinite. The moment leading minors alternate or vanish, fall back to the eigenvalue signs directly.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Classify a quadratic form","steps":[{"prompt":"Write the symmetric matrix for $2x^2 + 4xy + 5y^2$. Remember: off-diagonal entries are half the cross-term coefficient.","hint":"The diagonal is [2, 5]. The off-diagonal is 4/2 = 2. So $A = \\begin{pmatrix} 2 & 2 \\\\ 2 & 5 \\end{pmatrix}$.","answer":"$A = \\begin{pmatrix} 2 & 2 \\\\ 2 & 5 \\end{pmatrix}$"},{"prompt":"Find the eigenvalues by solving $\\det(A - \\lambda I) = 0$.","hint":"$(2-\\lambda)(5-\\lambda) - 4 = \\lambda^2 - 7\\lambda + 6$. Factor this quadratic.","answer":"$\\lambda_1 = 1$, $\\lambda_2 = 6$"},{"prompt":"Classify the form based on the signs of the eigenvalues.","hint":"Both eigenvalues are positive. Check the definition of positive definiteness.","answer":"Positive definite (all eigenvalues > 0)"},{"prompt":"Write the canonical form. Replace the original variables with the diagonalized version.","hint":"The form becomes $\\lambda_1 y_1^2 + \\lambda_2 y_2^2$. Substitute the eigenvalues.","answer":"Canonical form: $y_1^2 + 6y_2^2$"}],"caption":"Classify a quadratic form by finding its matrix, eigenvalues, and signs."}
```
