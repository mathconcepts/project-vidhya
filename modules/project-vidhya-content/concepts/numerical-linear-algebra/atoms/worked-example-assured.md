---
# Alternative body for numerical-linear-algebra.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-linear-algebra.worked-example.assured
concept_id: numerical-linear-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-linear-algebra.worked-example
for_stance: assured
---

## Confirm LU exists, then skip to the factors

LU without pivoting exists only when every leading principal minor of $A$ is nonzero. Here they are $2$, $(2)(3)-(1)(4)=2$, and $\det A=\det U=2\cdot1\cdot2=4$ — all nonzero, so no permutation is needed.

$$L=\begin{pmatrix}1&0&0\\2&1&0\\4&3&1\end{pmatrix},\qquad U=\begin{pmatrix}2&1&1\\0&1&1\\0&0&2\end{pmatrix}$$

Forward substitution on $Ly=b$ gives $y=(4,2,2)^T$; back substitution on $Ux=y$ gives $x=(1,1,1)^T$ — both $O(n^2)$, cheap once $U$'s $O(n^3)$ factorization is already paid for, which is exactly why LU beats repeating Gaussian elimination for every new right-hand side.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: LU decomposition of A = [[2,1,1],[4,3,3],[8,7,9]]","steps":[{"prompt":"For A = [[2,1,1],[4,3,3],[8,7,9]], compute the two multipliers needed to eliminate x₁ from rows 2 and 3 in the first pass of LU decomposition.","hint":"The pivot is a₁₁ = 2. Multiplier mᵢ₁ = aᵢ₁ / a₁₁. So m₂₁ = 4/2 and m₃₁ = 8/2.","answer":"m₂₁ = 2, m₃₁ = 4"},{"prompt":"Write out the L and U matrices explicitly after completing both elimination passes.","hint":"L stores the multipliers below its unit diagonal: L[2,1]=m₂₁=2, L[3,1]=m₃₁=4, L[3,2]=m₃₂=3. U is the upper-triangular result: rows are [2,1,1], [0,1,1], [0,0,2].","answer":"L = [[1,0,0],[2,1,0],[4,3,1]]; U = [[2,1,1],[0,1,1],[0,0,2]]"},{"prompt":"Using Ly = b with b = (4,10,24)ᵀ via forward substitution, find y. Then solve Ux = y via back substitution to get x.","hint":"Forward: y₁=4; y₂=10−2(4)=2; y₃=24−4(4)−3(2)=2. Back: x₃=2/2=1; x₂=2−1=1; x₁=(4−1−1)/2=1.","answer":"y = (4, 2, 2)ᵀ; x = (1, 1, 1)ᵀ"}]}
```
