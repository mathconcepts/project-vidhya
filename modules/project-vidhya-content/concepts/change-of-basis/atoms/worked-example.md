---
id: change-of-basis.worked-example
concept_id: change-of-basis
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
scaffold_fade: true
exam_ids: ["*"]
---

**Problem.** For the standard basis $E$ and $B=\{v_1,v_2\}$ with $v_1=(1,1)$, $v_2=(1,-1)$, a vector $x$ has $[x]_B=(2,1)$. Find $[x]_E$, and verify directly.

---

**Step 1 — Build $P$.** Columns are $B$'s vectors in standard coordinates:

$$P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$

---

**Step 2 — Apply $[x]_E = P[x]_B$.**

$$[x]_E = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}\begin{pmatrix} 2 \\ 1 \end{pmatrix} = \begin{pmatrix} 1(2)+1(1) \\ 1(2)+(-1)(1) \end{pmatrix} = \begin{pmatrix} 3 \\ 1 \end{pmatrix}$$

---

**Step 3 — Verify directly.** $x$ should equal $2v_1+1v_2$:

$$2(1,1) + 1(1,-1) = (2,2)+(1,-1) = (3,1) \quad\checkmark$$

$$\boxed{[x]_E = (3,1)}$$

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: converting coordinates from basis B to standard basis E",
  "steps": [
    {
      "prompt": "What are the columns of the change-of-basis matrix P?",
      "hint": "The columns of P are the basis vectors v1 and v2, written in standard coordinates.",
      "answer": "P = [v1 | v2] = [[1, 1], [1, -1]]"
    },
    {
      "prompt": "Now compute P times [x]_B. Multiply [[1,1],[1,-1]] by [[2],[1]].",
      "hint": "Row 1: (1)(2) + (1)(1) = 3. Row 2: (1)(2) + (-1)(1) = 1.",
      "answer": "[x]_E = [[3], [1]]"
    },
    {
      "prompt": "Verify: compute 2v1 + 1v2 directly and check you get [[3],[1]].",
      "hint": "2[[1],[1]] + 1[[1],[-1]] = [[2],[2]] + [[1],[-1]] = [[3],[1]]",
      "answer": "Verification complete: 2v1 + 1v2 = [[3],[1]]"
    }
  ],
  "caption": "Converting a vector's coordinates when you switch from basis B to the standard basis E"
}
```
