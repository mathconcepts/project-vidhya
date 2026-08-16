---
# Alternative body for eigenvalues.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: eigenvalues.worked-example.shaken
concept_id: eigenvalues
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: eigenvalues.worked-example
for_stance: shaken
---

**Problem:** Find the eigenvalues of $A = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$.

We are looking for numbers $\lambda$ where $Av = \lambda v$ has a solution other than $v = 0$. Four steps, and the only new thing is step 1.

---

**Step 1 — Subtract $\lambda$ down the diagonal.**

Rewrite $Av = \lambda v$ as $(A - \lambda I)v = 0$. Building $A - \lambda I$ means subtracting $\lambda$ from each diagonal entry and leaving everything else alone:

$$A - \lambda I = \begin{pmatrix} 4-\lambda & 1 \\ 2 & 3-\lambda \end{pmatrix}$$

Only the $4$ and the $3$ changed. The $1$ and the $2$ are untouched.

---

**Step 2 — Take the determinant and set it to zero.**

We want a non-zero $v$ with $(A-\lambda I)v = 0$. A matrix can only send a non-zero vector to zero if it collapses space — and that is exactly what $\det = 0$ means. So:

$$\det(A - \lambda I) = (4-\lambda)(3-\lambda) - (1)(2)$$

Expand the first product: $(4-\lambda)(3-\lambda) = 12 - 4\lambda - 3\lambda + \lambda^2 = \lambda^2 - 7\lambda + 12$.

Subtract the $2$: $\lambda^2 - 7\lambda + 10$.

---

**Step 3 — Solve the quadratic.**

$$\lambda^2 - 7\lambda + 10 = 0$$

Two numbers multiplying to $10$ and adding to $-7$: that is $-5$ and $-2$.

$$(\lambda - 5)(\lambda - 2) = 0 \quad\Longrightarrow\quad \lambda_1 = 5,\ \lambda_2 = 2$$

---

**Step 4 — Check it, every time.**

$$\lambda_1 + \lambda_2 = 5 + 2 = 7 \quad\text{and}\quad \operatorname{tr}(A) = 4 + 3 = 7 \ \checkmark$$

$$\lambda_1 \lambda_2 = 5 \times 2 = 10 \quad\text{and}\quad \det(A) = 4(3) - 1(2) = 10 \ \checkmark$$

Both match, so the arithmetic is right. This check takes five seconds and catches almost every sign and expansion slip. Make it automatic.

$$\boxed{\lambda_1 = 5,\ \lambda_2 = 2}$$

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
