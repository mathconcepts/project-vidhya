---
# Alternative body for eigenvalues.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: eigenvalues.worked-example.assured
concept_id: eigenvalues
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: eigenvalues.worked-example
for_stance: assured
---

**Problem:** Find the eigenvalues of $A = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$.

**By inspection.** $\operatorname{tr}(A) = 7$, $\det(A) = 10$. For $2\times2$ the characteristic polynomial is always

$$\lambda^2 - \operatorname{tr}(A)\lambda + \det(A) = \lambda^2 - 7\lambda + 10 = 0$$

so $\boxed{\lambda = 5,\ 2}$ — no matrix subtraction, no expansion.

Use this form for every $2\times2$. Writing out $A - \lambda I$ and expanding the determinant reproduces these same two coefficients and gives you two extra chances to drop a sign.

---

**Worth knowing for the harder version of this question**

$3\times3$ has the same shape: $\lambda^3 - \operatorname{tr}(A)\lambda^2 + M\lambda - \det(A) = 0$, where $M$ is the sum of the three principal $2\times2$ minors. When a paper hands you a $3\times3$ with an obvious root, that form finds it faster than cofactor expansion.

The trace/determinant identities also work backwards, which is the more common exam framing: given $\lambda_1 = 5$ and $\det(A) = 10$, you get $\lambda_2 = 2$ immediately without touching $A$.

For $\begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$ specifically: distinct real eigenvalues, so it is diagonalisable and $A^k = PD^kP^{-1}$ is available if the question continues.

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
