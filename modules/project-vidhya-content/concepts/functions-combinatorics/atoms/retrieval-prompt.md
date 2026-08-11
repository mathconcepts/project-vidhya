---
id: functions-combinatorics.retrieval-prompt
concept_id: functions-combinatorics
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Using inclusion-exclusion, how many surjections (onto functions) exist from a 4-element set $A = \{1,2,3,4\}$ to a 3-element set $B = \{a,b,c\}$?

- **(A)** 36
- **(B)** 81
- **(C)** 45
- **(D)** 24

<details>
<summary>Answer</summary>

**A**. Number of surjections from $|A|=m$ to $|B|=n$ is $\sum_{k=0}^{n} (-1)^k \binom{n}{k} (n-k)^m$. Here $m=4$, $n=3$: $\binom{3}{0}3^4 - \binom{3}{1}2^4 + \binom{3}{2}1^4 - \binom{3}{3}0^4 = 1 \cdot 81 - 3 \cdot 16 + 3 \cdot 1 - 1 \cdot 0 = 81 - 48 + 3 - 0 = 36$. Option B (81) counts ALL functions $3^4$ without the onto constraint. Option C (45) is a common arithmetic error. The inclusion-exclusion subtracts functions missing at least one element of $B$.

</details>
