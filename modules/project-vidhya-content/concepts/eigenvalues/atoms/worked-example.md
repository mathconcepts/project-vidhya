---
id: eigenvalues.worked-example
concept_id: eigenvalues
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
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

**Step 4 — Read off the eigenvalues.** $\boxed{\lambda_1 = 5,\ \lambda_2 = 2}$. Sanity check: $\lambda_1 + \lambda_2 = 7 = \text{tr}(A)$ ✓; $\lambda_1 \lambda_2 = 10 = \det(A)$ ✓.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: eigenvalues of A = [[4,1],[2,3]]",
  "steps": [
    {
      "prompt": "Step 1: What matrix do we form to start?",
      "hint": "Subtract λ times the identity matrix from A.",
      "answer": "A − λI =  [[4−λ, 1], [2, 3−λ]]",
      "eqn": "A - λI = | 4-λ   1  |\n         |  2   3-λ |"
    },
    {
      "prompt": "Step 2: Write the characteristic equation det(A − λI) = 0.",
      "hint": "Expand (4−λ)(3−λ) − (1)(2) and simplify.",
      "answer": "λ² − 7λ + 10 = 0",
      "eqn": "(4−λ)(3−λ) − 2 = λ² − 7λ + 12 − 2 = λ² − 7λ + 10 = 0"
    },
    {
      "prompt": "Step 3: Factor the quadratic λ² − 7λ + 10 = 0.",
      "hint": "Find two numbers that multiply to 10 and add to −7.",
      "answer": "(λ − 5)(λ − 2) = 0  ⟹  λ₁ = 5, λ₂ = 2",
      "eqn": "(λ − 5)(λ − 2) = 0"
    },
    {
      "prompt": "Step 4: Verify using trace and determinant of A.",
      "hint": "Sum of eigenvalues = tr(A) = 4+3 = 7; product = det(A) = 4·3−1·2 = 10.",
      "answer": "5 + 2 = 7 = tr(A) ✓   and   5 × 2 = 10 = det(A) ✓"
    }
  ],
  "caption": "This trace/det check catches algebraic errors instantly — always run it."
}
```
