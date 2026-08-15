---
id: systems-of-equations-worked-example
concept_id: systems-of-equations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Gaussian Elimination on a 3×3 System

**Problem (GATE-style):** Solve the system

$$\begin{aligned}
2x + y - z &= 8 \\
-3x - y + 2z &= -11 \\
-2x + y + 2z &= -3
\end{aligned}$$

---

## Step 1 — Form the Augmented Matrix

$$[A\mid\mathbf{b}] = \begin{bmatrix} 2 & 1 & -1 & \mid & 8 \\ -3 & -1 & 2 & \mid & -11 \\ -2 & 1 & 2 & \mid & -3 \end{bmatrix}$$

## Step 2 — Eliminate the First Column

Use row operations to make entries below the pivot (row 1, column 1) equal to zero.

**$R_2 \leftarrow R_2 + \frac{3}{2}R_1$:**

$$R_2: \left(-3+3,\ -1+\tfrac{3}{2},\ 2-\tfrac{3}{2},\ \mid\ -11+12\right) = \left(0,\ \tfrac{1}{2},\ \tfrac{1}{2},\ \mid\ 1\right)$$

**$R_3 \leftarrow R_3 + R_1$:**

$$R_3: \left(-2+2,\ 1+1,\ 2-1,\ \mid\ -3+8\right) = \left(0,\ 2,\ 1,\ \mid\ 5\right)$$

After Step 2:

$$\begin{bmatrix} 2 & 1 & -1 & \mid & 8 \\ 0 & \frac{1}{2} & \frac{1}{2} & \mid & 1 \\ 0 & 2 & 1 & \mid & 5 \end{bmatrix}$$

## Step 3 — Eliminate the Second Column

**$R_3 \leftarrow R_3 - 4R_2$:**

$$R_3: \left(0-0,\ 2-2,\ 1-2,\ \mid\ 5-4\right) = \left(0,\ 0,\ -1,\ \mid\ 1\right)$$

Row echelon form achieved:

$$\begin{bmatrix} 2 & 1 & -1 & \mid & 8 \\ 0 & \frac{1}{2} & \frac{1}{2} & \mid & 1 \\ 0 & 0 & -1 & \mid & 1 \end{bmatrix}$$

$\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) = 3 = n$, so a **unique solution** exists.

## Step 4 — Back Substitution

**From $R_3$:** $-z = 1 \implies z = -1$

**From $R_2$:** $\dfrac{1}{2}y + \dfrac{1}{2}(-1) = 1 \implies \dfrac{1}{2}y = \dfrac{3}{2} \implies y = 3$

**From $R_1$:** $2x + 3 - (-1) = 8 \implies 2x + 4 = 8 \implies x = 2$

## Solution

$$\boxed{x = 2,\quad y = 3,\quad z = -1}$$

**Verification** (plug back into original equations):

- $2(2)+3-(-1) = 4+3+1 = 8$ ✓
- $-3(2)-3+2(-1) = -6-3-2 = -11$ ✓
- $-2(2)+3+2(-1) = -4+3-2 = -3$ ✓

---

## GATE Tip — Checking Solution Type Before Solving

Before spending time solving, always check the ranks:

1. Row-reduce $[A\mid\mathbf{b}]$ to echelon form.
2. Count non-zero rows to get both ranks.
3. Apply the consistency and uniqueness conditions.

If GATE asks only "how many solutions does the system have?", you can answer from ranks alone — no back-substitution needed. This saves 2–3 minutes.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gaussian elimination on 2x+y-z=8, -3x-y+2z=-11, -2x+y+2z=-3","steps":[{"prompt":"After forming the augmented matrix [A|b], what is the first row operation to eliminate the -3 entry in R2, column 1?","hint":"You want to make the entry in row 2, column 1 become zero. The pivot is 2 in row 1. Compute the multiplier: -(-3)/2 = 3/2.","answer":"R2 ← R2 + (3/2)·R1. This makes the first entry of R2 become -3 + (3/2)·2 = -3 + 3 = 0."},{"prompt":"After full row reduction, state rank(A) and rank([A|b]) and determine the solution type.","hint":"Count the number of non-zero rows in the echelon form of A and of [A|b].","answer":"rank(A) = 3 and rank([A|b]) = 3. Since both equal n = 3, the system has a unique solution."},{"prompt":"What is the solution (x, y, z)?","hint":"Back-substitute starting from the last row: R3 gives z, then R2 gives y, then R1 gives x.","answer":"x = 2, y = 3, z = -1. From R3: z = -1. Into R2: (1/2)y + (1/2)(-1) = 1 → y = 3. Into R1: 2x + 3 + 1 = 8 → x = 2."}]}
```
