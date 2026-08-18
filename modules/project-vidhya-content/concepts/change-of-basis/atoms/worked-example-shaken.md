---
# Alternative body for change-of-basis.worked-example, served when the
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
id: change-of-basis.worked-example.shaken
concept_id: change-of-basis
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: change-of-basis.worked-example
for_stance: shaken
---

**Problem:** Basis $B=\{v_1,v_2\}$ with $v_1=\begin{pmatrix}1\\1\end{pmatrix}$, $v_2=\begin{pmatrix}1\\-1\end{pmatrix}$. A vector has $[x]_B=\begin{pmatrix}2\\1\end{pmatrix}$. Find $[x]_E$ in the standard basis, then check it.

---

**Step 1 — Stack the basis vectors as columns.** No computation yet, just writing $v_1$ next to $v_2$.

$$P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$

---

**Step 2 — Multiply $P$ by the given coordinates.**

$$[x]_E = P[x]_B = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}\begin{pmatrix}2\\1\end{pmatrix} = \begin{pmatrix}1(2)+1(1)\\1(2)+(-1)(1)\end{pmatrix} = \begin{pmatrix} 3 \\ 1 \end{pmatrix}$$

---

**Step 3 — Check by building $x$ directly, without $P$.**

$$2v_1 + 1v_2 = 2\begin{pmatrix}1\\1\end{pmatrix} + \begin{pmatrix}1\\-1\end{pmatrix} = \begin{pmatrix}3\\1\end{pmatrix}$$

Same answer both ways.

$$\boxed{P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}, \quad [x]_E = \begin{pmatrix} 3 \\ 1 \end{pmatrix}}$$

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: Converting coordinates from basis B to standard basis E",
  "steps": [
    {
      "prompt": "The columns of P are v₁ and v₂ — nothing to compute, just write them side by side. What is P?",
      "hint": "v₁ = (1,1) becomes column 1, v₂ = (1,-1) becomes column 2.",
      "answer": "P = [v₁ | v₂] = [[1, 1], [1, -1]]"
    },
    {
      "prompt": "Multiply row 1 of P by [x]_B, then row 2. What are the two entries of P[x]_B?",
      "hint": "Row 1: (1)(2) + (1)(1). Row 2: (1)(2) + (-1)(1). Do each multiplication separately before adding.",
      "answer": "[x]_E = [[3], [1]]"
    },
    {
      "prompt": "Now check without P: compute 2v₁ + 1v₂ directly. Same numbers?",
      "hint": "2(1,1) + 1(1,-1) = (2,2) + (1,-1). Add the two vectors.",
      "answer": "Verification complete: 2v₁ + 1v₂ = [[3],[1]] ✓"
    }
  ],
  "caption": "Converting a vector's coordinates when you switch from basis B to the standard basis E"
}
```
