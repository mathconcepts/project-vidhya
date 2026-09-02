---
# Alternative body for matrix-operations.worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: matrix-operations.worked-example.assured
concept_id: matrix-operations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-operations.worked-example
for_stance: assured
---

$A = \begin{pmatrix} 2 & 1 \\ 3 & -1 \end{pmatrix}$ ($2\times2$), $B = \begin{pmatrix} 1 & 0 & 2 \\ -1 & 2 & 1 \end{pmatrix}$ ($2\times3$). Columns of $A$ = rows of $B$ = 2, so $AB$ is $2\times3$.

$$AB = \begin{pmatrix} 2(1)+1(-1) & 2(0)+1(2) & 2(2)+1(1) \\ 3(1)+(-1)(-1) & 3(0)+(-1)(2) & 3(2)+(-1)(1) \end{pmatrix} = \begin{pmatrix} 1 & 2 & 5 \\ 4 & -2 & 5 \end{pmatrix}$$

$$\boxed{(AB)^T = \begin{pmatrix} 1 & 4 \\ 2 & -2 \\ 5 & 5 \end{pmatrix}}$$

**Faster route when only the transpose is wanted:** skip forming $AB$ and use $(AB)^T = B^TA^T$ directly — $B^T$ ($3\times2$) times $A^T$ ($2\times2$) gives the same $3\times2$ result. Worth it whenever $A$ or $B$ is awkward to multiply but its transpose is easy to read off; dimensions alone confirm $B^TA^T$ is the only ordering that type-checks to a $3\times2$ answer.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Matrix multiplication and transpose","steps":[{"prompt":"Step 1: Before multiplying $AB$, check: what must be true about the dimensions of $A$ and $B$?","hint":"For $AB$ to exist, the number of columns in $A$ must equal the number of rows in $B$.","answer":"$A$ is $2 \\times 2$ (2 columns), $B$ is $2 \\times 3$ (2 rows). They match, so $AB$ exists and is $2 \\times 3$."},{"prompt":"Step 2: Compute the (1,2) entry of $AB$ using row 1 of $A$ and column 2 of $B$.","hint":"Multiply corresponding entries and sum: row 1 of $A$ is $[2, 1]$, column 2 of $B$ is $[0, 2]$.","answer":"$(AB)_{12} = 2 \\cdot 0 + 1 \\cdot 2 = 0 + 2 = 2$"},{"prompt":"Step 3: What is $(AB)^T$? Remember, transpose swaps rows and columns.","hint":"The first row of $AB$ becomes the first column of $(AB)^T$.","answer":"$(AB)^T = \\begin{pmatrix} 1 & 4 \\\\ 2 & -2 \\\\ 5 & 5 \\end{pmatrix}$"}],"caption":"Key insight: matrix multiplication is not commutative ($AB \\neq BA$), but the transpose property $(AB)^T = B^T A^T$ always holds and reverses the order."}
```
