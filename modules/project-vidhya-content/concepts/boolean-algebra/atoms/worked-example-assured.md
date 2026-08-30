---
# Alternative body for boolean-algebra.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: boolean-algebra.worked_example.assured
concept_id: boolean-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: boolean-algebra-worked-example
for_stance: assured
---

$F=A'BC+AB'C+ABC'+ABC$ plots at minterms $3,5,6,7$ on a 3-variable grid:

```
         C:  0    1
   AB: 00 |  0  |  0  |
       01 |  0  |  1  |  ← m3
       11 |  1  |  1  |  ← m6, m7
       10 |  0  |  1  |  ← m5
```

$AB=11$ absorbs $6,7\Rightarrow AB$; $C=1$ column absorbs $5,7\Rightarrow AC$; $B=C=1$ absorbs $3,7\Rightarrow BC$. Minimal SOP: $F=AB+AC+BC$ — three prime implicants, none redundant, since each covers a minterm the other two miss between them: drop $AB$ and $6$ is uncovered, drop $AC$ and $5$ is uncovered, drop $BC$ and $3$ is uncovered.

The trap here isn't the grouping, it's stopping at a *valid* SOP rather than the *minimal* one: $F=A'BC+AB'C+ABC'+ABC$ is already a correct sum-of-products for this function, and a rushed answer sometimes just re-lists it. Minimal means fewest literals across every valid grouping, confirmed by checking that each surviving term is essential.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: De Morgan's theorem and absorption law simplification","steps":[{"prompt":"Using De Morgan's theorem, simplify (A·B)'. Which law applies and what is the result?","hint":"'Break the bar, change the operation': (A·B)' → split the bar across both variables and flip AND to OR.","answer":"A' + B'"},{"prompt":"Simplify F = A + A'B using absorption. What is the result?","hint":"The absorption variant states A + A'B = A + B. Verify: if A=1, F=1=A+B. If A=0, F=B=A+B.","answer":"A + B"}]}
```
