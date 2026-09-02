---
id: systems-of-equations.worked-example
concept_id: systems-of-equations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Solve $2x+y-z=8$, $-3x-y+2z=-11$, $-2x+y+2z=-3$.

---

**Step 1 — Form the augmented matrix.**

$$[A\mid\mathbf{b}] = \begin{bmatrix} 2 & 1 & -1 & \mid & 8 \\ -3 & -1 & 2 & \mid & -11 \\ -2 & 1 & 2 & \mid & -3 \end{bmatrix}$$

---

**Step 2 — Clear column 1.** $R_2 \leftarrow R_2 + \tfrac32 R_1$ gives $(0,\ \tfrac12,\ \tfrac12,\mid\ 1)$. $R_3 \leftarrow R_3 + R_1$ gives $(0,\ 2,\ 1,\mid\ 5)$.

$$\begin{bmatrix} 2 & 1 & -1 & \mid & 8 \\ 0 & \tfrac12 & \tfrac12 & \mid & 1 \\ 0 & 2 & 1 & \mid & 5 \end{bmatrix}$$

---

**Step 3 — Clear column 2.** $R_3 \leftarrow R_3 - 4R_2$ gives $(0,\ 0,\ -1,\mid\ 1)$.

$$\begin{bmatrix} 2 & 1 & -1 & \mid & 8 \\ 0 & \tfrac12 & \tfrac12 & \mid & 1 \\ 0 & 0 & -1 & \mid & 1 \end{bmatrix}$$

Three non-zero rows: $\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) = 3 = n$, so a **unique solution** exists.

---

**Step 4 — Back-substitute.** From $R_3$: $-z=1 \Rightarrow z=-1$. From $R_2$: $\tfrac12y+\tfrac12(-1)=1 \Rightarrow y=3$. From $R_1$: $2x+3-(-1)=8 \Rightarrow x=2$.

$$\boxed{x=2,\ y=3,\ z=-1}$$

**Check:** $2(2)+3-(-1)=8$ ✓; $-3(2)-3+2(-1)=-11$ ✓; $-2(2)+3+2(-1)=-3$ ✓.

**GATE tip.** If the question only asks how many solutions the system has, stop after Step 3 — the ranks already answer it; back-substitution is only needed when the actual values are wanted.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gaussian elimination on a 3×3 system","steps":[{"prompt":"After forming the augmented matrix [A|b], what is the first row operation to eliminate the -3 entry in R2, column 1?","hint":"You want to make the entry in row 2, column 1 become zero. The pivot is 2 in row 1. Compute the multiplier: -(-3)/2 = 3/2.","answer":"R2 ← R2 + (3/2)·R1. This makes the first entry of R2 become -3 + (3/2)·2 = -3 + 3 = 0."},{"prompt":"After full row reduction, state rank(A) and rank([A|b]) and determine the solution type.","hint":"Count the number of non-zero rows in the echelon form of A and of [A|b].","answer":"rank(A) = 3 and rank([A|b]) = 3. Since both equal n = 3, the system has a unique solution."},{"prompt":"What is the solution (x, y, z)?","hint":"Back-substitute starting from the last row: R3 gives z, then R2 gives y, then R1 gives x.","answer":"x = 2, y = 3, z = -1. From R3: z = -1. Into R2: (1/2)y + (1/2)(-1) = 1 → y = 3. Into R1: 2x + 3 + 1 = 8 → x = 2."}]}
```
