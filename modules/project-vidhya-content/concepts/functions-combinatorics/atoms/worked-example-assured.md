---
# Alternative body for functions-combinatorics.worked-example, stance `assured`.
id: functions-combinatorics.worked-example.assured
concept_id: functions-combinatorics
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: functions-combinatorics.worked-example
for_stance: assured
---

**Problem:** How many surjective functions are there from a $4$-element set onto a $2$-element set $\{a,b\}$?

For $2$ codomain elements, onto-count reduces to $2^4$ minus the two constant functions: $16-2=14$.

$$\boxed{14}$$

**Worth knowing:** this "subtract the constant functions" shortcut only survives because there are $2$ codomain elements. For $3$ or more, use the full inclusion-exclusion sum $\sum_i(-1)^i\binom{n}{i}(n-i)^k$ — naively subtracting just the constant functions undercounts what should be excluded. For $n=3,k=4$: the full sum gives $36$, while "subtract $3$ constants from $81$" wrongly gives $78$.
