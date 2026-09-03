---
# Alternative body for eigenvalues.worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
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

---

**Step 1 — Subtract $\lambda$ down the diagonal.**

$$A - \lambda I = \begin{pmatrix} 4-\lambda & 1 \\ 2 & 3-\lambda \end{pmatrix}$$

Only the $4$ and the $3$ moved.

---

**Step 2 — Set the determinant to zero.**

$$(4-\lambda)(3-\lambda) - (1)(2) = \lambda^2 - 7\lambda + 10$$

---

**Step 3 — Solve.**

$$(\lambda - 5)(\lambda - 2) = 0 \quad\Longrightarrow\quad \lambda_1 = 5,\ \lambda_2 = 2$$

---

**Step 4 — Check.**

$$\lambda_1 + \lambda_2 = 7 = \operatorname{tr}(A) \ \checkmark \qquad \lambda_1 \lambda_2 = 10 = \det(A) \ \checkmark$$

$$\boxed{\lambda_1 = 5,\ \lambda_2 = 2}$$

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "why": "Try each small step yourself with these exact numbers — one step at a time, no need to hold the whole problem in your head at once.",
  "title": "Walk through: eigenvalues of $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$",
  "steps": [
    {
      "prompt": "Step 1: What matrix do we form to start?",
      "hint": "We want a non-zero $v$ with $Av=\\lambda v$. Rewrite that as $(A-\\lambda I)v=0$. Building $A-\\lambda I$ means subtracting $\\lambda$ from each diagonal entry and leaving every other entry alone.",
      "answer": "$A-\\lambda I=\\begin{pmatrix}4-\\lambda&1\\\\2&3-\\lambda\\end{pmatrix}$",
      "eqn": "A - λI = | 4-λ   1  |\n         |  2   3-λ |"
    },
    {
      "prompt": "Step 2a: Expand $(4-\\lambda)(3-\\lambda)$ on its own first.",
      "hint": "Four products: $4\\cdot3$, $4\\cdot(-\\lambda)$, $(-\\lambda)\\cdot3$, $(-\\lambda)\\cdot(-\\lambda)$. Collect the two $\\lambda$ terms.",
      "answer": "$12-4\\lambda-3\\lambda+\\lambda^2=\\lambda^2-7\\lambda+12$",
      "eqn": "(4−λ)(3−λ) = λ² − 7λ + 12"
    },
    {
      "prompt": "Step 2b: Now write the characteristic equation $\\det(A-\\lambda I)=0$.",
      "hint": "A matrix sends a non-zero vector to zero only if it collapses space, which is what $\\det=0$ means. Subtract the off-diagonal product $(1)(2)$ from what you just expanded.",
      "answer": "$\\lambda^2-7\\lambda+10=0$",
      "eqn": "(4−λ)(3−λ) − 2 = λ² − 7λ + 12 − 2 = λ² − 7λ + 10 = 0"
    },
    {
      "prompt": "Step 3: Factor the quadratic $\\lambda^2-7\\lambda+10=0$.",
      "hint": "Find two numbers that multiply to 10 and add to $-7$. Both are negative.",
      "answer": "$(\\lambda-5)(\\lambda-2)=0 \\implies \\lambda_1=5,\\ \\lambda_2=2$",
      "eqn": "(λ − 5)(λ − 2) = 0"
    },
    {
      "prompt": "Step 4: Verify using trace and determinant of $A$.",
      "hint": "Sum of eigenvalues $=\\text{tr}(A)=4+3=7$; product $=\\det(A)=4\\cdot3-1\\cdot2=10$. If either fails, the slip is in the expansion.",
      "answer": "$5+2=7=\\text{tr}(A)\\ \\checkmark$ and $5\\times2=10=\\det(A)\\ \\checkmark$"
    }
  ],
  "caption": "This trace/det check catches algebraic errors instantly — always run it."
}
```
