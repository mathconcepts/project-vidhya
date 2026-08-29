---
# Alternative body for rank-nullity.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
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
id: rank-nullity.worked-example.shaken
concept_id: rank-nullity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: rank-nullity.worked_example
for_stance: shaken
---

## The matrix

$$A=\begin{pmatrix}1&2&3\\2&4&6\\1&2&3\end{pmatrix}
$$

Find rank, nullity, a basis for the null space, and check rank-nullity.

## Row-reduce

$R_2\leftarrow R_2-2R_1$, $R_3\leftarrow R_3-R_1$:

$$
\begin{pmatrix}1&2&3\\0&0&0\\0&0&0\end{pmatrix}
$$

Only one non-zero row: $\text{rank}(A)=1$.

## Get the nullity from the theorem

$n=3$ columns, so $\text{nullity}(A)=3-1=2$.

## Find the null space directly

The system reduces to one equation: $x_1+2x_2+3x_3=0 \Rightarrow x_1=-2x_2-3x_3$.

Set $x_2=1,x_3=0$: $\begin{pmatrix}-2\\1\\0\end{pmatrix}$. Set $x_2=0,x_3=1$: $\begin{pmatrix}-3\\0\\1\end{pmatrix}$.

## Check

$$\text{rank}(A)+\text{nullity}(A)=1+2=3=n \quad\checkmark$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Find rank and nullity","steps":[{"prompt":"Step 1: Reduce $\\begin{pmatrix} 1 & 2 & 3 \\\\ 2 & 4 & 6 \\\\ 1 & 2 & 3 \\end{pmatrix}$ to row echelon form using row operations.","hint":"Subtract multiples of row 1 from rows 2 and 3.","answer":"$$\\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{pmatrix}$$"},{"prompt":"Step 2: How many non-zero rows are there? This is the rank.","hint":"Count the rows that are not all zeros.","answer":"Rank = 1 (only one non-zero row)"},{"prompt":"Step 3: Use rank-nullity theorem: nullity = n − rank. What is the nullity?","hint":"We have $n=3$ columns, so nullity = 3 − rank.","answer":"Nullity = 3 − 1 = 2"},{"prompt":"Step 4: Find vectors in the null space by solving $A\\mathbf{x} = \\mathbf{0}$. From row echelon form: $x_1 + 2x_2 + 3x_3 = 0$. Give one basis vector by setting $x_2=1, x_3=0$.","hint":"Solve for $x_1$ in terms of $x_2$ and $x_3$.","answer":"$\\mathbf{v}_1 = \\begin{pmatrix} -2 \\\\ 1 \\\\ 0 \\end{pmatrix}$"}],"caption":"Rank-nullity theorem: the rank (independent equations) plus nullity (free variables) sum to the number of columns."}
```
