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
$$
\begin{pmatrix} 1 & 2 & 0 & -1 \\ 0 & 0 & 1 & 2 \\ 0 & 0 & 0 & 0 \end{pmatrix}
$$

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
  "why": "This walkthrough breaks the standard method into 4 small steps: simplify the matrix first, then read the null space and column space off what's left. Tap Show hint anytime a step feels new.",
  "steps": [
    {
      "prompt": "First, simplify $A$ into its RREF — **Reduced Row Echelon Form**, the simplest version you can reach using row operations, where each row either starts with a leading 1 (with zeros below it) or is all zeros. What do you get for $A = \\begin{pmatrix} 1 & 2 & 0 & -1 \\\\ 2 & 4 & 1 & 0 \\\\ 1 & 2 & 1 & 1 \\end{pmatrix}$?",
      "hint": "Do the row operations one at a time, always aiming to turn the entry below a leading 1 into a zero: $R_2 \\leftarrow R_2 - 2R_1$ (kills the 2 at the start of row 2), then $R_3 \\leftarrow R_3 - R_1$ (kills the 1 at the start of row 3), then $R_3 \\leftarrow R_3 - R_2$ (row 3 becomes all zeros — that's fine, it just means row 3 had no new information). A **pivot column** is any column with one of these leading 1's — which columns end up with one?",
      "answer": "$\\begin{pmatrix} 1 & 2 & 0 & -1 \\\\ 0 & 0 & 1 & 2 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$. The leading 1's land in columns 1 and 3 — those are the **pivot columns**. Columns 2 and 4 have no leading 1, so they're **free variables**: you get to pick $x_2$ and $x_4$ yourself."
    },
    {
      "prompt": "Now build the **null space** — every vector $x$ that $A$ squashes down to the zero vector. Start by picking simple values for the free variables: set $x_2 = 1, x_4 = 0$. What is the first basis vector you get?",
      "hint": "Read each pivot row of the RREF as an equation, and solve it for the pivot variable in terms of the free ones: $x_1 = -2x_2 + x_4$ (from row 1) and $x_3 = -2x_4$ (from row 2). Now substitute $x_2 = 1, x_4 = 0$ into both.",
      "answer": "$\\mathbf{v}_1 = \\begin{pmatrix} -2 \\\\ 1 \\\\ 0 \\\\ 0 \\end{pmatrix}$"
    },
    {
      "prompt": "Same idea, second choice: set $x_2 = 0, x_4 = 1$ instead. What is the second null space basis vector?",
      "hint": "Same two equations as before — $x_1 = -2x_2 + x_4$ and $x_3 = -2x_4$ — just substitute the new values in.",
      "answer": "$\\mathbf{v}_2 = \\begin{pmatrix} 1 \\\\ 0 \\\\ -2 \\\\ 1 \\end{pmatrix}$"
    },
    {
      "prompt": "Last step — the **column space**. Which columns give you a basis for it, and from which matrix do you read them?",
      "hint": "Easy rule, easy to mix up: take the pivot column NUMBERS you found in Step 1 (columns 1 and 3), but go back and read the actual numbers from the ORIGINAL matrix $A$ — never from the row-reduced one, which has changed those columns.",
      "answer": "Columns 1 and 3 of the original $A$: $\\left\\{ \\begin{pmatrix} 1 \\\\ 2 \\\\ 1 \\end{pmatrix}, \\begin{pmatrix} 0 \\\\ 1 \\\\ 1 \\end{pmatrix} \\right\\}$. Rank = 2 (2 pivot columns), nullity = 2 (2 free variables), so rank + nullity = 4 — matching the 4 columns of $A$, exactly as the rank-nullity theorem promises."
    }
  ],
  "caption": "The pattern to remember: reduce the matrix, then split its columns in two — pivot columns build the column space, free-variable columns build the null space."
}
```