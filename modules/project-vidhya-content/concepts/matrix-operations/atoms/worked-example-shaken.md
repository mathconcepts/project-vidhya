---
# Alternative body for matrix-operations.worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
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
id: matrix-operations.worked-example.shaken
concept_id: matrix-operations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-operations.worked-example
for_stance: shaken
---

$$A = \begin{pmatrix} 2 & 1 \\ 3 & -1 \end{pmatrix}, \quad B = \begin{pmatrix} 1 & 0 & 2 \\ -1 & 2 & 1 \end{pmatrix}$$

Find $AB$, then $(AB)^T$.

---

**Check the sizes.** $A$ is $2\times2$, $B$ is $2\times3$. Columns of $A$ match rows of $B$ — both $2$ — so $AB$ exists and is $2\times3$.

---

**Fill in $AB$, row by row.** Row 1 of $A$ is $(2,1)$:

$$2(1)+1(-1)=1, \quad 2(0)+1(2)=2, \quad 2(2)+1(1)=5$$

Row 2 of $A$ is $(3,-1)$:

$$3(1)+(-1)(-1)=4, \quad 3(0)+(-1)(2)=-2, \quad 3(2)+(-1)(1)=5$$

$$AB = \begin{pmatrix} 1 & 2 & 5 \\ 4 & -2 & 5 \end{pmatrix}$$

---

**Transpose: rows become columns.** Row 1 of $AB$ becomes column 1; row 2 becomes column 2.

$$\boxed{(AB)^T = \begin{pmatrix} 1 & 4 \\ 2 & -2 \\ 5 & 5 \end{pmatrix}}$$

Check: $(AB)^T$ also equals $B^TA^T$ — same nine numbers, reached the other way round.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Matrix multiplication and transpose","steps":[{"prompt":"Step 1: Before multiplying $AB$, check: what must be true about the dimensions of $A$ and $B$?","hint":"For $AB$ to exist, the number of columns in $A$ must equal the number of rows in $B$.","answer":"$A$ is $2 \\times 2$ (2 columns), $B$ is $2 \\times 3$ (2 rows). They match, so $AB$ exists and is $2 \\times 3$."},{"prompt":"Step 2: Compute the (1,2) entry of $AB$ using row 1 of $A$ and column 2 of $B$.","hint":"Multiply corresponding entries and sum: row 1 of $A$ is $[2, 1]$, column 2 of $B$ is $[0, 2]$.","answer":"$(AB)_{12} = 2 \\cdot 0 + 1 \\cdot 2 = 0 + 2 = 2$"},{"prompt":"Step 3: What is $(AB)^T$? Remember, transpose swaps rows and columns.","hint":"The first row of $AB$ becomes the first column of $(AB)^T$.","answer":"$(AB)^T = \\begin{pmatrix} 1 & 4 \\\\ 2 & -2 \\\\ 5 & 5 \\end{pmatrix}$"}],"caption":"Key insight: matrix multiplication is not commutative ($AB \\neq BA$), but the transpose property $(AB)^T = B^T A^T$ always holds and reverses the order."}
```
