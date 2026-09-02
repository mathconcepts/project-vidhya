---
id: rank-nullity.worked-example
concept_id: rank-nullity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** For $A = \begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 2 & 3 \end{pmatrix}$, find (a) rank, (b) nullity, (c) a basis for the null space, (d) verify rank-nullity.

---

**Step 1 — Row-reduce.** $R_2 \to R_2 - 2R_1$, $R_3 \to R_3 - R_1$:

$$\begin{pmatrix} 1 & 2 & 3 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \end{pmatrix}$$

---

**Step 2 — Count non-zero rows.** One non-zero row: $\text{rank}(A) = 1$.

---

**Step 3 — Nullity from the theorem.** $n=3$ columns: $\text{nullity}(A) = 3 - 1 = 2$.

---

**Step 4 — Null space basis.** The reduced system is one equation: $x_1 + 2x_2 + 3x_3 = 0 \Rightarrow x_1 = -2x_2 - 3x_3$. Setting $(x_2,x_3)=(1,0)$ and $(0,1)$ gives

$$\mathbf{v}_1 = \begin{pmatrix} -2 \\ 1 \\ 0 \end{pmatrix}, \qquad \mathbf{v}_2 = \begin{pmatrix} -3 \\ 0 \\ 1 \end{pmatrix}$$

---

**Step 5 — Verify.**

$$\boxed{\text{rank}(A) + \text{nullity}(A) = 1 + 2 = 3 = n}$$

**Why it works out this way:** rank 1 means every row is a scalar multiple of every other (rows 2 and 3 are copies of row 1). The null space captures the 2 degrees of freedom the rank-1 constraint leaves unconstrained.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Find rank and nullity","steps":[{"prompt":"Step 1: Reduce $\\begin{pmatrix} 1 & 2 & 3 \\\\ 2 & 4 & 6 \\\\ 1 & 2 & 3 \\end{pmatrix}$ to row echelon form using row operations.","hint":"Subtract multiples of row 1 from rows 2 and 3.","answer":"$$\\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{pmatrix}$$"},{"prompt":"Step 2: How many non-zero rows are there? This is the rank.","hint":"Count the rows that are not all zeros.","answer":"Rank = 1 (only one non-zero row)"},{"prompt":"Step 3: Use rank-nullity theorem: nullity = n − rank. What is the nullity?","hint":"We have $n=3$ columns, so nullity = 3 − rank.","answer":"Nullity = 3 − 1 = 2"},{"prompt":"Step 4: Find vectors in the null space by solving $A\\mathbf{x} = \\mathbf{0}$. From row echelon form: $x_1 + 2x_2 + 3x_3 = 0$. Give one basis vector by setting $x_2=1, x_3=0$.","hint":"Solve for $x_1$ in terms of $x_2$ and $x_3$.","answer":"$\\mathbf{v}_1 = \\begin{pmatrix} -2 \\\\ 1 \\\\ 0 \\end{pmatrix}$"}],"caption":"Rank-nullity theorem: the rank (independent equations) plus nullity (free variables) sum to the number of columns."}
```
