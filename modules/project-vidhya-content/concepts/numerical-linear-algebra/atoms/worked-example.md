---
id: numerical-linear-algebra.worked-example
concept_id: numerical-linear-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find the LU decomposition (no pivoting) of $A=\begin{pmatrix}2&1&1\\4&3&3\\8&7&9\end{pmatrix}$ and solve $Ax=b$ for $b=(4,10,24)^T$.

---

**Step 1 — Eliminate column 1.** $m_{21}=4/2=2$, $m_{31}=8/2=4$. $R_2\leftarrow R_2-2R_1=(0,1,1)$, $R_3\leftarrow R_3-4R_1=(0,3,5)$.

---

**Step 2 — Eliminate column 2.** $m_{32}=3/1=3$. $R_3\leftarrow R_3-3R_2=(0,0,2)$.

---

**Step 3 — Read off $L$ and $U$.**
$$L=\begin{pmatrix}1&0&0\\2&1&0\\4&3&1\end{pmatrix},\qquad U=\begin{pmatrix}2&1&1\\0&1&1\\0&0&2\end{pmatrix}$$

**Verification:** $LU=A$ ✓ (multiply out row by row), and $\det A=\det U=2\cdot1\cdot2=4$ — nonzero, so no pivot was ever in danger of being zero.

---

**Step 4 — Forward substitution, $Ly=b$.** $y_1=4$; $2(4)+y_2=10\Rightarrow y_2=2$; $4(4)+3(2)+y_3=24\Rightarrow y_3=2$.

**Step 5 — Back substitution, $Ux=y$.** $2x_3=2\Rightarrow x_3=1$; $x_2+1=2\Rightarrow x_2=1$; $2x_1+1+1=4\Rightarrow x_1=1$.

$$\boxed{x=(1,1,1)^T}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: LU decomposition of A = [[2,1,1],[4,3,3],[8,7,9]]","steps":[{"prompt":"For A = [[2,1,1],[4,3,3],[8,7,9]], compute the two multipliers needed to eliminate x₁ from rows 2 and 3 in the first pass of LU decomposition.","hint":"The pivot is a₁₁ = 2. Multiplier mᵢ₁ = aᵢ₁ / a₁₁. So m₂₁ = 4/2 and m₃₁ = 8/2.","answer":"m₂₁ = 2, m₃₁ = 4"},{"prompt":"Write out the L and U matrices explicitly after completing both elimination passes.","hint":"L stores the multipliers below its unit diagonal: L[2,1]=m₂₁=2, L[3,1]=m₃₁=4, L[3,2]=m₃₂=3. U is the upper-triangular result: rows are [2,1,1], [0,1,1], [0,0,2].","answer":"L = [[1,0,0],[2,1,0],[4,3,1]]; U = [[2,1,1],[0,1,1],[0,0,2]]"},{"prompt":"Using Ly = b with b = (4,10,24)ᵀ via forward substitution, find y. Then solve Ux = y via back substitution to get x.","hint":"Forward: y₁=4; y₂=10−2(4)=2; y₃=24−4(4)−3(2)=2. Back: x₃=2/2=1; x₂=2−1=1; x₁=(4−1−1)/2=1.","answer":"y = (4, 2, 2)ᵀ; x = (1, 1, 1)ᵀ"}]}
```
