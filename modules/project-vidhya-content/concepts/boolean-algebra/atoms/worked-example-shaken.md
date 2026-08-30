---
# Alternative body for boolean-algebra.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: boolean-algebra.worked_example.shaken
concept_id: boolean-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: boolean-algebra-worked-example
for_stance: shaken
---

Take $F = A'BC + AB'C + ABC' + ABC$.

Find the minterm number for each term. $A'BC$: bits $0,1,1$, minterm $3$. $AB'C$: bits $1,0,1$, minterm $5$. $ABC'$: bits $1,1,0$, minterm $6$. $ABC$: bits $1,1,1$, minterm $7$.

Plot only those four cells as $1$ on a three-variable grid, rows for $AB$, columns for $C$:

```
         C:  0    1
   AB: 00 |  0  |  0  |
       01 |  0  |  1  |  ← m3
       11 |  1  |  1  |  ← m6, m7
       10 |  0  |  1  |  ← m5
```

Group them. Row $AB=11$ holds cells $6$ and $7$: label $AB$, since $C$ changed across the group and gets dropped. Column $C=1$ holds cells $5$ and $7$: label $AC$. Cells $3$ and $7$ share $B=1,C=1$: label $BC$.

Sum the labels: $F=AB+AC+BC$. Check each of the four original minterms — $3,5,6,7$ — against the three labels; each is covered.

A second check, kept separate: $F=AB+AB'+A'B$. Factor $A$ from the first two terms: $F=A(B+B')+A'B$. Replace $B+B'$ with $1$: $F=A\cdot1+A'B$. Drop the $\cdot1$: $F=A+A'B$. Apply absorption: $F=A+B$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: De Morgan's theorem and absorption law simplification","steps":[{"prompt":"Using De Morgan's theorem, simplify (A·B)'. Which law applies and what is the result?","hint":"'Break the bar, change the operation': (A·B)' → split the bar across both variables and flip AND to OR.","answer":"A' + B'"},{"prompt":"Simplify F = A + A'B using absorption. What is the result?","hint":"The absorption variant states A + A'B = A + B. Verify: if A=1, F=1=A+B. If A=0, F=B=A+B.","answer":"A + B"}]}
```

Minimization is grouping equal outputs that are physically adjacent — nothing more.
