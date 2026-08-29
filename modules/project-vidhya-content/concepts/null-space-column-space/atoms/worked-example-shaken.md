---
# Alternative body for null-space-column-space.worked_example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: null-space-column-space.worked-example.shaken
concept_id: null-space-column-space
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: null-space-column-space.worked_example
for_stance: shaken
---

$A=\begin{pmatrix}1&2&0&-1\\2&4&1&0\\1&2&1&1\end{pmatrix}$. Find bases for $\text{Null}(A)$ and $\text{Col}(A)$.

Row-reduce: $R_2\leftarrow R_2-2R_1$, $R_3\leftarrow R_3-R_1$, then $R_3\leftarrow R_3-R_2$:

$$
\begin{pmatrix}1&2&0&-1\\0&0&1&2\\0&0&0&0\end{pmatrix}
$$

Pivots in columns $1$ and $3$; free variables $x_2,x_4$.

From the rows: $x_1=-2x_2+x_4$, $x_3=-2x_4$.

Set $x_2=1,x_4=0$: $\begin{pmatrix}-2\\1\\0\\0\end{pmatrix}$. Set $x_2=0,x_4=1$: $\begin{pmatrix}1\\0\\-2\\1\end{pmatrix}$ — that's the null space basis.

For the column space, take the **pivot columns of the original $A$**: columns $1$ and $3$, giving $\begin{pmatrix}1\\2\\1\end{pmatrix}$ and $\begin{pmatrix}0\\1\\1\end{pmatrix}$.

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
