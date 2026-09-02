---
# Alternative body for systems-of-equations.worked-example, served when the
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
id: systems-of-equations.worked-example.shaken
concept_id: systems-of-equations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: systems-of-equations.worked-example
for_stance: shaken
---

$$2x+y-z=8, \qquad -3x-y+2z=-11, \qquad -2x+y+2z=-3$$

---

**Write the augmented matrix.**

$$[A\mid\mathbf{b}]=\begin{bmatrix}2&1&-1&\mid&8\\-3&-1&2&\mid&-11\\-2&1&2&\mid&-3\end{bmatrix}$$

---

**Clear column 1 below the pivot.** $R_2\leftarrow R_2+\tfrac32R_1$ gives $R_2=(0,\ \tfrac12,\ \tfrac12,\mid\ 1)$. $R_3\leftarrow R_3+R_1$ gives $R_3=(0,\ 2,\ 1,\mid\ 5)$.

$$\begin{bmatrix}2&1&-1&\mid&8\\0&\tfrac12&\tfrac12&\mid&1\\0&2&1&\mid&5\end{bmatrix}$$

---

**Clear column 2 below the pivot.** $R_3\leftarrow R_3-4R_2$ gives $R_3=(0,\ 0,\ -1,\mid\ 1)$.

$$\begin{bmatrix}2&1&-1&\mid&8\\0&\tfrac12&\tfrac12&\mid&1\\0&0&-1&\mid&1\end{bmatrix}$$

Three non-zero rows: rank $3$, and $n=3$. One solution.

---

**Solve from the bottom up.** $-z=1 \Rightarrow z=-1$. $\tfrac12y+\tfrac12(-1)=1 \Rightarrow y=3$. $2x+3-(-1)=8 \Rightarrow x=2$.

$$\boxed{x=2,\ y=3,\ z=-1}$$

Plug back in: $2(2)+3-(-1)=8$ ✓, $-3(2)-3+2(-1)=-11$ ✓, $-2(2)+3+2(-1)=-3$ ✓

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gaussian elimination on a 3×3 system","steps":[{"prompt":"After forming the augmented matrix [A|b], what is the first row operation to eliminate the -3 entry in R2, column 1?","hint":"You want to make the entry in row 2, column 1 become zero. The pivot is 2 in row 1. Compute the multiplier: -(-3)/2 = 3/2.","answer":"R2 ← R2 + (3/2)·R1. This makes the first entry of R2 become -3 + (3/2)·2 = -3 + 3 = 0."},{"prompt":"After full row reduction, state rank(A) and rank([A|b]) and determine the solution type.","hint":"Count the number of non-zero rows in the echelon form of A and of [A|b].","answer":"rank(A) = 3 and rank([A|b]) = 3. Since both equal n = 3, the system has a unique solution."},{"prompt":"What is the solution (x, y, z)?","hint":"Back-substitute starting from the last row: R3 gives z, then R2 gives y, then R1 gives x.","answer":"x = 2, y = 3, z = -1. From R3: z = -1. Into R2: (1/2)y + (1/2)(-1) = 1 → y = 3. Into R1: 2x + 3 + 1 = 8 → x = 2."}]}
```
