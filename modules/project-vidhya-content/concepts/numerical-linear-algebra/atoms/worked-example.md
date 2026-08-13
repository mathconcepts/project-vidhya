---
id: numerical-linear-algebra-worked-example
concept_id: numerical-linear-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: LU Decomposition of a $3 \times 3$ System

**GATE-style problem:** Find the LU decomposition (without pivoting) of

$$A = \begin{pmatrix} 2 & 1 & 1 \\ 4 & 3 & 3 \\ 8 & 7 & 9 \end{pmatrix}$$

and use it to solve $Ax = b$ where $b = (4,\; 10,\; 24)^T$.

---

## Step 1 — First Elimination Column

Pivot element: $a_{11} = 2$.

Compute multipliers:

$$m_{21} = \frac{a_{21}}{a_{11}} = \frac{4}{2} = 2, \qquad m_{31} = \frac{a_{31}}{a_{11}} = \frac{8}{2} = 4$$

Eliminate $x_1$ from rows 2 and 3:

$$R_2 \leftarrow R_2 - 2\,R_1: \quad (4{-}4,\; 3{-}2,\; 3{-}2) = (0,\; 1,\; 1)$$

$$R_3 \leftarrow R_3 - 4\,R_1: \quad (8{-}8,\; 7{-}4,\; 9{-}4) = (0,\; 3,\; 5)$$

Current state:

$$\begin{pmatrix} 2 & 1 & 1 \\ 0 & 1 & 1 \\ 0 & 3 & 5 \end{pmatrix}$$

---

## Step 2 — Second Elimination Column

Pivot element: $a_{22}^{(2)} = 1$.

Multiplier:

$$m_{32} = \frac{a_{32}}{a_{22}} = \frac{3}{1} = 3$$

Eliminate $x_2$ from row 3:

$$R_3 \leftarrow R_3 - 3\,R_2: \quad (0,\; 3{-}3,\; 5{-}3) = (0,\; 0,\; 2)$$

---

## Result: $A = LU$

$$L = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 4 & 3 & 1 \end{pmatrix}, \qquad U = \begin{pmatrix} 2 & 1 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 2 \end{pmatrix}$$

**Verification:** The multipliers $m_{21}=2$, $m_{31}=4$, $m_{32}=3$ fill the below-diagonal entries of $L$.

$$LU = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 4 & 3 & 1 \end{pmatrix}\begin{pmatrix} 2 & 1 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 2 \end{pmatrix} = \begin{pmatrix} 2 & 1 & 1 \\ 4 & 3 & 3 \\ 8 & 7 & 9 \end{pmatrix} = A \checkmark$$

---

## Step 3 — Forward Substitution: Solve $Ly = b$

$$\begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 4 & 3 & 1 \end{pmatrix} \begin{pmatrix} y_1 \\ y_2 \\ y_3 \end{pmatrix} = \begin{pmatrix} 4 \\ 10 \\ 24 \end{pmatrix}$$

$$y_1 = 4$$

$$2y_1 + y_2 = 10 \;\Rightarrow\; y_2 = 10 - 2(4) = 2$$

$$4y_1 + 3y_2 + y_3 = 24 \;\Rightarrow\; y_3 = 24 - 4(4) - 3(2) = 24 - 16 - 6 = 2$$

$$y = (4,\; 2,\; 2)^T$$

---

## Step 4 — Back Substitution: Solve $Ux = y$

$$\begin{pmatrix} 2 & 1 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 2 \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix} = \begin{pmatrix} 4 \\ 2 \\ 2 \end{pmatrix}$$

$$2x_3 = 2 \;\Rightarrow\; x_3 = 1$$

$$x_2 + x_3 = 2 \;\Rightarrow\; x_2 = 2 - 1 = 1$$

$$2x_1 + x_2 + x_3 = 4 \;\Rightarrow\; 2x_1 = 4 - 1 - 1 = 2 \;\Rightarrow\; x_1 = 1$$

$$\boxed{x = (1,\; 1,\; 1)^T}$$

---

## Why LU Beats Repeated Gaussian Elimination

| Task | Gaussian per solve | LU approach |
|---|---|---|
| Factorize $A$ | $O(n^3)$ each time | $O(n^3)$ once |
| Solve for one $b$ | included above | $O(n^2)$ per solve |
| Solve for 100 RHS | $100 \times O(n^3)$ | $O(n^3) + 100 \times O(n^2)$ |

For a $1000 \times 1000$ system, LU decomposition with 100 RHS vectors uses $\sim 1000\times$ fewer operations.

---

## GATE Tips

- **LU without pivoting** exists only when all leading principal minors are non-zero.
- **With partial pivoting**, $A = PLU$ where $P$ is a permutation matrix.
- Know how to find $L$ (multiplier entries below diagonal) and $U$ (upper triangle after elimination).
- Gauss-Seidel convergence is guaranteed when $A$ is strictly diagonally dominant — check this condition first on MCQ options.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For A = [[2,1,1],[4,3,3],[8,7,9]], compute the two multipliers needed to eliminate x₁ from rows 2 and 3 in the first pass of LU decomposition.","hint":"The pivot is a₁₁ = 2. Multiplier mᵢ₁ = aᵢ₁ / a₁₁. So m₂₁ = 4/2 and m₃₁ = 8/2.","answer":"m₂₁ = 2, m₃₁ = 4"},{"prompt":"Write out the L and U matrices explicitly after completing both elimination passes.","hint":"L stores the multipliers below its unit diagonal: L[2,1]=m₂₁=2, L[3,1]=m₃₁=4, L[3,2]=m₃₂=3. U is the upper-triangular result: rows are [2,1,1], [0,1,1], [0,0,2].","answer":"L = [[1,0,0],[2,1,0],[4,3,1]]; U = [[2,1,1],[0,1,1],[0,0,2]]"},{"prompt":"Using Ly = b with b = (4,10,24)ᵀ via forward substitution, find y. Then solve Ux = y via back substitution to get x.","hint":"Forward: y₁=4; y₂=10−2(4)=2; y₃=24−4(4)−3(2)=2. Back: x₃=2/2=1; x₂=2−1=1; x₁=(4−1−1)/2=1.","answer":"y = (4, 2, 2)ᵀ; x = (1, 1, 1)ᵀ"}]}
```
