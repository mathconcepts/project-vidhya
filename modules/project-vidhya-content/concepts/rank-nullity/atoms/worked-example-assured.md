---
# Alternative body for rank-nullity.worked-example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: rank-nullity.worked-example.assured
concept_id: rank-nullity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: rank-nullity.worked-example
for_stance: assured
---

$$A=\begin{pmatrix}1&2&3\\2&4&6\\1&2&3\end{pmatrix} \to \begin{pmatrix}1&2&3\\0&0&0\\0&0&0\end{pmatrix}$$

(rows 2 and 3 are multiples of row 1). One pivot: $\text{rank}(A)=1$, so $\text{nullity}(A)=3-1=2$ by the theorem — no extra work needed for that number.

**Null space basis.** $x_1+2x_2+3x_3=0$ is the only surviving constraint. Free variables $x_2,x_3$ give:

$$\boxed{\left\{\begin{pmatrix}-2\\1\\0\end{pmatrix},\begin{pmatrix}-3\\0\\1\end{pmatrix}\right\}, \qquad \text{rank}(A)+\text{nullity}(A)=1+2=3=n}$$

**The pattern to notice.** Rank 1 here means every row is a scalar multiple of every other — the matrix genuinely has one independent direction. That's the fast tell: seeing the row dependence by inspection already gives the rank without finishing the elimination.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Find rank and nullity","steps":[{"prompt":"Step 1: Reduce $\\begin{pmatrix} 1 & 2 & 3 \\\\ 2 & 4 & 6 \\\\ 1 & 2 & 3 \\end{pmatrix}$ to row echelon form using row operations.","hint":"Subtract multiples of row 1 from rows 2 and 3.","answer":"$$\\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{pmatrix}$$"},{"prompt":"Step 2: How many non-zero rows are there? This is the rank.","hint":"Count the rows that are not all zeros.","answer":"Rank = 1 (only one non-zero row)"},{"prompt":"Step 3: Use rank-nullity theorem: nullity = n − rank. What is the nullity?","hint":"We have $n=3$ columns, so nullity = 3 − rank.","answer":"Nullity = 3 − 1 = 2"},{"prompt":"Step 4: Find vectors in the null space by solving $A\\mathbf{x} = \\mathbf{0}$. From row echelon form: $x_1 + 2x_2 + 3x_3 = 0$. Give one basis vector by setting $x_2=1, x_3=0$.","hint":"Solve for $x_1$ in terms of $x_2$ and $x_3$.","answer":"$\\mathbf{v}_1 = \\begin{pmatrix} -2 \\\\ 1 \\\\ 0 \\end{pmatrix}$"}],"caption":"Rank-nullity theorem: the rank (independent equations) plus nullity (free variables) sum to the number of columns."}
```
