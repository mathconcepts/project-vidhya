---
# Alternative body for numerical-linear-algebra.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-linear-algebra.worked-example.shaken
concept_id: numerical-linear-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-linear-algebra.worked-example
for_stance: shaken
---

Elimination is done once every entry below the diagonal is zero — the target, fixed before starting.

$$m_{21}=\frac{4}{2}=2,\qquad m_{31}=\frac{8}{2}=4$$

$$R_2\leftarrow R_2-2R_1:\ (4{-}4,\,3{-}2,\,3{-}2)=(0,1,1)$$

$$R_3\leftarrow R_3-4R_1:\ (8{-}8,\,7{-}4,\,9{-}4)=(0,3,5)$$

One pass finished, one left: clear the $3$ under row $2$'s pivot with $m_{32}=3$, and $U$ is complete. Collecting every multiplier below the diagonal builds $L$; forward- then back-substitution on $Ly=b$ and $Ux=y$ then hands back $x=(1,1,1)^T$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: LU decomposition of A = [[2,1,1],[4,3,3],[8,7,9]]","steps":[{"prompt":"For A = [[2,1,1],[4,3,3],[8,7,9]], compute the two multipliers needed to eliminate x₁ from rows 2 and 3 in the first pass of LU decomposition.","hint":"The pivot is a₁₁ = 2. Multiplier mᵢ₁ = aᵢ₁ / a₁₁. So m₂₁ = 4/2 and m₃₁ = 8/2.","answer":"m₂₁ = 2, m₃₁ = 4"},{"prompt":"Write out the L and U matrices explicitly after completing both elimination passes.","hint":"L stores the multipliers below its unit diagonal: L[2,1]=m₂₁=2, L[3,1]=m₃₁=4, L[3,2]=m₃₂=3. U is the upper-triangular result: rows are [2,1,1], [0,1,1], [0,0,2].","answer":"L = [[1,0,0],[2,1,0],[4,3,1]]; U = [[2,1,1],[0,1,1],[0,0,2]]"},{"prompt":"Using Ly = b with b = (4,10,24)ᵀ via forward substitution, find y. Then solve Ux = y via back substitution to get x.","hint":"Forward: y₁=4; y₂=10−2(4)=2; y₃=24−4(4)−3(2)=2. Back: x₃=2/2=1; x₂=2−1=1; x₁=(4−1−1)/2=1.","answer":"y = (4, 2, 2)ᵀ; x = (1, 1, 1)ᵀ"}]}
```
