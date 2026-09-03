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
{"v":1,"kind":"guided_walkthrough","why":"Try each elimination step and substitution yourself — a 3×3 decomposition has more places to slip than the 2×2 examples above.","title":"Walk through: LU decomposition of $A=\\begin{pmatrix}2&1&1\\\\4&3&3\\\\8&7&9\\end{pmatrix}$","steps":[{"prompt":"For $A=\\begin{pmatrix}2&1&1\\\\4&3&3\\\\8&7&9\\end{pmatrix}$, compute the two multipliers needed to eliminate $x_1$ from rows 2 and 3 in the first pass of LU decomposition.","hint":"The pivot is $a_{11}=2$. Multiplier $m_{i1} = a_{i1}/a_{11}$. So $m_{21}=4/2$ and $m_{31}=8/2$.","answer":"$m_{21}=2,\\ m_{31}=4$"},{"prompt":"Write out the $L$ and $U$ matrices explicitly after completing both elimination passes.","hint":"$L$ stores the multipliers below its unit diagonal: $L_{21}=m_{21}=2$, $L_{31}=m_{31}=4$, $L_{32}=m_{32}=3$. $U$ is the upper-triangular result: rows $(2,1,1)$, $(0,1,1)$, $(0,0,2)$.","answer":"$L=\\begin{pmatrix}1&0&0\\\\2&1&0\\\\4&3&1\\end{pmatrix}$; $U=\\begin{pmatrix}2&1&1\\\\0&1&1\\\\0&0&2\\end{pmatrix}$"},{"prompt":"Using $Ly=b$ with $b=(4,10,24)^T$ via forward substitution, find $y$. Then solve $Ux=y$ via back substitution to get $x$.","hint":"Forward: $y_1=4$; $y_2=10-2(4)=2$; $y_3=24-4(4)-3(2)=2$. Back: $x_3=2/2=1$; $x_2=2-1=1$; $x_1=(4-1-1)/2=1$.","answer":"$y=(4,2,2)^T$; $x=(1,1,1)^T$"}]}
```
