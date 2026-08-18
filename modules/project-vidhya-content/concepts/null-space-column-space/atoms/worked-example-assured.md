---
# Alternative body for null-space-column-space.worked_example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: null-space-column-space.worked-example.assured
concept_id: null-space-column-space
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: null-space-column-space.worked_example
for_stance: assured
---

$A=\begin{pmatrix}1&2&0&-1\\2&4&1&0\\1&2&1&1\end{pmatrix}$. RREF (via $R_2-2R_1$, $R_3-R_1$, then $R_3-R_2$):

$$\begin{pmatrix}1&2&0&-1\\0&0&1&2\\0&0&0&0\end{pmatrix}$$

Pivots: columns $1,3$. Free: $x_2,x_4$.

**Col(A):** pivot columns of the *original* matrix, not the reduced one — $\left\{\begin{pmatrix}1\\2\\1\end{pmatrix},\begin{pmatrix}0\\1\\1\end{pmatrix}\right\}$, rank $2$.

**Null(A):** solve $x_1=-2x_2+x_4$, $x_3=-2x_4$ from the free variables — $\left\{\begin{pmatrix}-2\\1\\0\\0\end{pmatrix},\begin{pmatrix}1\\0\\-2\\1\end{pmatrix}\right\}$, nullity $2$.

Check: $2+2=4=n$ ✓.

**The trap:** Col(A)'s basis comes from $A$'s original columns, never the RREF's — row operations preserve the null space but not the column space. Null(A)'s basis, conversely, is read directly off the RREF.

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
