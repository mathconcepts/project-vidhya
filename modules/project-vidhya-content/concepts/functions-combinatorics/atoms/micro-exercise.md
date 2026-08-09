---
id: functions-combinatorics.micro-exercise
concept_id: functions-combinatorics
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

How many bijections (one-to-one onto functions) exist from the set $\{1, 2, 3\}$ to the set $\{a, b, c\}$?

- **(A)** 6
- **(B)** 9
- **(C)** 3
- **(D)** 27

<details>
<summary>Answer</summary>

**A**. A bijection from an $n$-element set to another $n$-element set is a permutation of $n$ elements. Here $n = 3$, so the number of bijections = $3! = 3 \times 2 \times 1 = 6$. Explicitly: 1→a,2→b,3→c; 1→a,2→c,3→b; 1→b,2→a,3→c; 1→b,2→c,3→a; 1→c,2→a,3→b; 1→c,2→b,3→a. Option B (9) counts all functions from a 3-set to a 3-set that happen to be injective — which equals 6, not 9. Option D (27) counts all $3^3$ total functions.

</details>
