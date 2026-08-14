---
id: null-space-column-space.worked_example
concept_id: null-space-column-space
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
---

**Problem:** Let $A = \begin{pmatrix} 1 & 2 & 0 & -1 \\ 2 & 4 & 1 & 0 \\ 1 & 2 & 1 & 1 \end{pmatrix}$. Find a basis for $\text{Null}(A)$ and $\text{Col}(A)$, and verify the rank-nullity theorem.

---

**Step 1:** Row reduce $A$ to reduced row echelon form (RREF).

Perform row operations:
- $R_2 \leftarrow R_2 - 2R_1$: second row becomes $[0, 0, 1, 2]$
- $R_3 \leftarrow R_3 - R_1$: third row becomes $[0, 0, 1, 2]$
- $R_3 \leftarrow R_3 - R_2$: third row becomes $[0, 0, 0, 0]$

RREF is:
$$\begin{pmatrix} 1 & 2 & 0 & -1 \\ 0 & 0 & 1 & 2 \\ 0 & 0 & 0 & 0 \end{pmatrix}$$

Pivot columns are **1 and 3**; free variables are **columns 2 and 4** ($x_2$ and $x_4$).

---

**Step 2:** Find the null space basis by solving $Ax = \mathbf{0}$.

From the RREF, the equations are:
- $x_1 + 2x_2 - x_4 = 0 \Rightarrow x_1 = -2x_2 + x_4$
- $x_3 + 2x_4 = 0 \Rightarrow x_3 = -2x_4$

Set $x_2 = 1, x_4 = 0$: $\mathbf{v}_1 = \begin{pmatrix} -2 \\ 1 \\ 0 \\ 0 \end{pmatrix}$

Set $x_2 = 0, x_4 = 1$: $\mathbf{v}_2 = \begin{pmatrix} 1 \\ 0 \\ -2 \\ 1 \end{pmatrix}$

**Basis for Null(A):** $\left\{ \begin{pmatrix} -2 \\ 1 \\ 0 \\ 0 \end{pmatrix}, \begin{pmatrix} 1 \\ 0 \\ -2 \\ 1 \end{pmatrix} \right\}$; **nullity** = 2.

---

**Step 3:** Find the column space basis.

The column space is spanned by the pivot columns of the original $A$—columns 1 and 3:

**Basis for Col(A):** $\left\{ \begin{pmatrix} 1 \\ 2 \\ 1 \end{pmatrix}, \begin{pmatrix} 0 \\ 1 \\ 1 \end{pmatrix} \right\}$; **rank** = 2.

---

**Step 4:** Verify rank-nullity.

$$\text{rank}(A) + \text{nullity}(A) = 2 + 2 = 4 = n \quad \checkmark$$

$$\boxed{\text{Null}(A) = \text{span}\left\{\begin{pmatrix} -2 \\ 1 \\ 0 \\ 0 \end{pmatrix}, \begin{pmatrix} 1 \\ 0 \\ -2 \\ 1 \end{pmatrix}\right\}, \quad \text{Col}(A) = \text{span}\left\{\begin{pmatrix} 1 \\ 2 \\ 1 \end{pmatrix}, \begin{pmatrix} 0 \\ 1 \\ 1 \end{pmatrix}\right\}}$$

---

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: finding null space and column space",
  "steps": [
    {
      "prompt": "What is the RREF of the matrix $A = \\begin{pmatrix} 1 & 2 & 0 & -1 \\\\ 2 & 4 & 1 & 0 \\\\ 1 & 2 & 1 & 1 \\end{pmatrix}$?",
      "hint": "Perform row operations: $R_2 - 2R_1$, then $R_3 - R_1$, then $R_3 - R_2$. Which columns contain pivots?",
      "answer": "$\\begin{pmatrix} 1 & 2 & 0 & -1 \\\\ 0 & 0 & 1 & 2 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$. Pivot columns: 1 and 3. Free variables: $x_2, x_4$."
    },
    {
      "prompt": "For the null space, set $x_2 = 1, x_4 = 0$. What is the first basis vector?",
      "hint": "From the RREF, $x_1 = -2x_2 + x_4$ and $x_3 = -2x_4$. Substitute $x_2 = 1, x_4 = 0$.",
      "answer": "$\\mathbf{v}_1 = \\begin{pmatrix} -2 \\\\ 1 \\\\ 0 \\\\ 0 \\end{pmatrix}$"
    },
    {
      "prompt": "Now set $x_2 = 0, x_4 = 1$. What is the second null space basis vector?",
      "hint": "From the RREF equations: $x_1 = -2x_2 + x_4$ and $x_3 = -2x_4$. Substitute the new values.",
      "answer": "$\\mathbf{v}_2 = \\begin{pmatrix} 1 \\\\ 0 \\\\ -2 \\\\ 1 \\end{pmatrix}$"
    },
    {
      "prompt": "Which columns of the original matrix $A$ form a basis for the column space?",
      "hint": "The column space basis is formed by the columns corresponding to pivot columns in the RREF. Pivot columns are 1 and 3.",
      "answer": "Columns 1 and 3: $\\left\\{ \\begin{pmatrix} 1 \\\\ 2 \\\\ 1 \\end{pmatrix}, \\begin{pmatrix} 0 \\\\ 1 \\\\ 1 \\end{pmatrix} \\right\\}$. Rank = 2, nullity = 2, so rank + nullity = 4."
    }
  ],
  "caption": "Follow the standard algorithm: row reduce to RREF, identify pivot/free variables, and build null space from free variables."
}
```