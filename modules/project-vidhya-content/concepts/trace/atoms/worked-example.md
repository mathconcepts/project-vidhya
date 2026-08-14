---
id: trace.worked_example
concept_id: trace
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
---

## Problem

Consider the matrix $A = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 3 & -1 \\ 2 & 0 & 1 \end{pmatrix}$.

Compute $\text{tr}(A)$ and verify that it equals the sum of the eigenvalues by examining the characteristic polynomial.

---

**Step 1: Extract and sum the diagonal elements**

The diagonal of $A$ is: $a_{11} = 2$, $a_{22} = 3$, $a_{33} = 1$.

$$\text{tr}(A) = 2 + 3 + 1 = 6$$

---

**Step 2: Recall the characteristic polynomial structure**

The characteristic polynomial of a $3 \times 3$ matrix $A$ is:
$$\det(A - \lambda I) = -\lambda^3 + (\text{tr}(A))\lambda^2 + \text{(other terms)}$$

By Vieta's formulas, the sum of the roots $\lambda_1 + \lambda_2 + \lambda_3$ equals the coefficient of $\lambda^2$ with sign flipped, which is $\text{tr}(A)$.

---

**Step 3: Conclude the verification**

Therefore, without computing eigenvalues explicitly:
$$\lambda_1 + \lambda_2 + \lambda_3 = \text{tr}(A) = 6$$

$$\boxed{\text{tr}(A) = 6 \text{ and this equals the sum of eigenvalues}}$$

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Compute and verify trace","steps":[{"prompt":"What are the three diagonal elements of $A$?","hint":"Read top-left, middle-middle, and bottom-right entries.","answer":"2, 3, and 1"},{"prompt":"Sum the diagonal elements to find $\\text{tr}(A)$.","hint":"Add: 2 + 3 + 1","answer":"$\\text{tr}(A) = 6$"},{"prompt":"By theory, what must $\\lambda_1 + \\lambda_2 + \\lambda_3$ equal?","hint":"Recall: trace equals sum of eigenvalues.","answer":"$\\lambda_1 + \\lambda_2 + \\lambda_3 = 6$"}],"caption":"The trace is both the sum of diagonal entries AND the sum of eigenvalues."}
```
