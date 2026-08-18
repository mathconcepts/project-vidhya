---
# Alternative body for quadratic-forms.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. The extra steps live in the walkthrough below, where they unfold
# one at a time when the student asks for them.
#
# The walkthrough may carry MORE steps than the base's, but every answer the
# base asserts survives here in order and the final answer is identical —
# scripts/check-variant-agreement.ts enforces that. Prompts and hints are the
# part that may differ, and they are where the gentler register lives.
id: quadratic-forms.worked-example.shaken
concept_id: quadratic-forms
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: quadratic-forms.worked_example
for_stance: shaken
---

**Problem:** Classify $f(x,y) = 2x^2 + 4xy + 5y^2$, and write its canonical form.

**Build the matrix.** Diagonal entries are the $x^2$ and $y^2$ coefficients: $2$ and $5$. The off-diagonal entry is *half* the $xy$ coefficient: $4/2=2$.

$$A = \begin{pmatrix} 2 & 2 \\ 2 & 5 \end{pmatrix}$$

**Find the eigenvalues.** $\det(A-\lambda I) = (2-\lambda)(5-\lambda)-4 = \lambda^2-7\lambda+6 = (\lambda-1)(\lambda-6)$, so $\lambda_1=1$, $\lambda_2=6$.

**Read the signs.** Both positive $\Rightarrow$ **positive definite**.

**Canonical form.** Replace with the eigenvalues: $f = \lambda_1y_1^2+\lambda_2y_2^2 = y_1^2+6y_2^2$.

$$\boxed{\text{Positive definite; canonical form: } y_1^2 + 6y_2^2}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Classify a quadratic form","steps":[{"prompt":"The diagonal of A is the coefficients of $x^2$ and $y^2$. What are they?","hint":"Read them straight off $2x^2+4xy+5y^2$: the $x^2$ coefficient and the $y^2$ coefficient.","answer":"Diagonal entries: 2 and 5."},{"prompt":"The off-diagonal entry is half the $xy$ coefficient. What is it, and what is A?","hint":"The $xy$ coefficient is 4. Half of 4 is the off-diagonal entry.","answer":"$A = \\begin{pmatrix} 2 & 2 \\\\ 2 & 5 \\end{pmatrix}$"},{"prompt":"Find the eigenvalues by solving $\\det(A - \\lambda I) = 0$.","hint":"$(2-\\lambda)(5-\\lambda) - 4 = \\lambda^2 - 7\\lambda + 6$. Factor this quadratic.","answer":"$\\lambda_1 = 1$, $\\lambda_2 = 6$"},{"prompt":"Classify the form based on the signs of the eigenvalues.","hint":"Both eigenvalues are positive. Check the definition of positive definiteness.","answer":"Positive definite (all eigenvalues > 0)"},{"prompt":"Write the canonical form. Replace the original variables with the diagonalized version.","hint":"The form becomes $\\lambda_1 y_1^2 + \\lambda_2 y_2^2$. Substitute the eigenvalues.","answer":"Canonical form: $y_1^2 + 6y_2^2$"}],"caption":"Classify a quadratic form by finding its matrix, eigenvalues, and signs."}
```
