---
id: linear-independence.worked-example
concept_id: linear-independence
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
---

**Problem (GATE-style).** Determine whether the following set of vectors in $\mathbb{R}^3$ is linearly independent. If not, express one as a linear combination of the others.

$$\mathbf{v}_1 = \begin{pmatrix} 1 \\ 2 \\ 1 \end{pmatrix}, \quad \mathbf{v}_2 = \begin{pmatrix} 2 \\ 1 \\ 0 \end{pmatrix}, \quad \mathbf{v}_3 = \begin{pmatrix} 5 \\ 4 \\ 1 \end{pmatrix}$$

---

**Step 1:** Write down the linear combination equation. We seek coefficients $c_1, c_2, c_3$ such that
$$c_1 \mathbf{v}_1 + c_2 \mathbf{v}_2 + c_3 \mathbf{v}_3 = \mathbf{0}$$

Substituting the vectors:
$$c_1 \begin{pmatrix} 1 \\ 2 \\ 1 \end{pmatrix} + c_2 \begin{pmatrix} 2 \\ 1 \\ 0 \end{pmatrix} + c_3 \begin{pmatrix} 5 \\ 4 \\ 1 \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \\ 0 \end{pmatrix}$$

---

**Step 2:** Expand into component equations:
- $c_1 + 2c_2 + 5c_3 = 0$ ... (i)
- $2c_1 + c_2 + 4c_3 = 0$ ... (ii)
- $c_1 + 0 \cdot c_2 + c_3 = 0$ ... (iii)

From (iii): $c_1 = -c_3$.

Substitute into (i): $-c_3 + 2c_2 + 5c_3 = 0 \Rightarrow 2c_2 + 4c_3 = 0 \Rightarrow c_2 = -2c_3$.

Check with (ii): $2(-c_3) + (-2c_3) + 4c_3 = -2c_3 - 2c_3 + 4c_3 = 0$. ✓

---

**Step 3:** The general solution is $(c_1, c_2, c_3) = t(-1, -2, 1)$ for any scalar $t \neq 0$. Since there exists a non-trivial solution, the set is **linearly dependent**.

Taking $t = 1$: $c_1 = -1, c_2 = -2, c_3 = 1$, we have
$$-\mathbf{v}_1 - 2\mathbf{v}_2 + \mathbf{v}_3 = \mathbf{0} \quad \Rightarrow \quad \boxed{\mathbf{v}_3 = \mathbf{v}_1 + 2\mathbf{v}_2}$$

---

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Determine linear independence",
  "steps": [
    {
      "prompt": "Set up the equation $c_1 \\mathbf{v}_1 + c_2 \\mathbf{v}_2 + c_3 \\mathbf{v}_3 = \\mathbf{0}$. How many scalar equations will you have?",
      "hint": "You have 3 vectors, each with 3 components. That gives 3 equations in 3 unknowns.",
      "answer": "3 equations (one per row of the vectors)"
    },
    {
      "prompt": "From the third equation $c_1 + c_3 = 0$, express $c_1$ in terms of $c_3$.",
      "hint": "Rearrange: $c_1 = -c_3$.",
      "answer": "$c_1 = -c_3$"
    },
    {
      "prompt": "Substitute $c_1 = -c_3$ into the first equation $c_1 + 2c_2 + 5c_3 = 0$. What is $c_2$ in terms of $c_3$?",
      "hint": "You get $-c_3 + 2c_2 + 5c_3 = 0$, so $2c_2 = -4c_3$, thus $c_2 = -2c_3$.",
      "answer": "$c_2 = -2c_3$"
    },
    {
      "prompt": "Since there is a non-trivial solution (e.g., $c_3 = 1 \\Rightarrow c_1 = -1, c_2 = -2$), is the set linearly independent or dependent?",
      "hint": "Non-trivial solution means linearly dependent.",
      "answer": "The set is linearly dependent; $\\mathbf{v}_3 = \\mathbf{v}_1 + 2\\mathbf{v}_2$"
    }
  ],
  "caption": "Walk through: checking linear independence by solving the homogeneous system"
}
```