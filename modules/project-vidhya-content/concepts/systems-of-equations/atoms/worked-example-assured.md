---
# Alternative body for systems-of-equations-worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `systems-of-equations-worked-example` (no
# dot), a legacy naming drift check-content-integrity.ts tolerates.
# variant_of points at that exact id; this file's own id follows the normal
# convention instead of propagating the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: systems-of-equations.worked-example.assured
concept_id: systems-of-equations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: systems-of-equations-worked-example
for_stance: assured
---

## Setup

$$2x+y-z=8, \quad -3x-y+2z=-11, \quad -2x+y+2z=-3$$

## Row-reduce once

$$
\begin{bmatrix}2&1&-1&\mid&8\\-3&-1&2&\mid&-11\\-2&1&2&\mid&-3\end{bmatrix} \to \begin{bmatrix}2&1&-1&\mid&8\\0&\tfrac12&\tfrac12&\mid&1\\0&0&-1&\mid&1\end{bmatrix}
$$

via $R_2\leftarrow R_2+\tfrac32R_1$, $R_3\leftarrow R_3+R_1$, then $R_3\leftarrow R_3-4R_2$.

## Read the solution type before back-substituting

$\text{rank}(A)=\text{rank}([A\mid\mathbf b])=3=n$: unique solution. Worth stating even before finishing the arithmetic — if this is an MCQ asking only for solution count, stop here.

## Back-substitute

$$z=-1, \quad y=3, \quad x=2 \qquad \boxed{(x,y,z)=(2,3,-1)}$$

## Where marks slip

Sign errors compound fastest in the last elimination row — recompute the final pivot row independently as a check rather than trusting the running arithmetic. And remember: rank equality alone answers "how many solutions"; full elimination is only needed when the question wants the actual values.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gaussian elimination on 2x+y-z=8, -3x-y+2z=-11, -2x+y+2z=-3","steps":[{"prompt":"After forming the augmented matrix [A|b], what is the first row operation to eliminate the -3 entry in R2, column 1?","hint":"You want to make the entry in row 2, column 1 become zero. The pivot is 2 in row 1. Compute the multiplier: -(-3)/2 = 3/2.","answer":"R2 ← R2 + (3/2)·R1. This makes the first entry of R2 become -3 + (3/2)·2 = -3 + 3 = 0."},{"prompt":"After full row reduction, state rank(A) and rank([A|b]) and determine the solution type.","hint":"Count the number of non-zero rows in the echelon form of A and of [A|b].","answer":"rank(A) = 3 and rank([A|b]) = 3. Since both equal n = 3, the system has a unique solution."},{"prompt":"What is the solution (x, y, z)?","hint":"Back-substitute starting from the last row: R3 gives z, then R2 gives y, then R1 gives x.","answer":"x = 2, y = 3, z = -1. From R3: z = -1. Into R2: (1/2)y + (1/2)(-1) = 1 → y = 3. Into R1: 2x + 3 + 1 = 8 → x = 2."}]}
```
