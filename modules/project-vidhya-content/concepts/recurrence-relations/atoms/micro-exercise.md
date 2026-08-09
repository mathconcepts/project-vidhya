---
id: recurrence-relations.micro-exercise
concept_id: recurrence-relations
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the closed-form (explicit formula) for the recurrence $a_n = 2 \cdot a_{n-1}$, $a_0 = 1$.

- **(A)** $a_n = 2n$
- **(B)** $a_n = n^2$
- **(C)** $a_n = 2^n$
- **(D)** $a_n = 2^{n-1}$

<details>
<summary>Answer</summary>

**C**. This is a geometric recurrence: each term is 2 times the previous. Unrolling: $a_n = 2 \cdot a_{n-1} = 2^2 a_{n-2} = \cdots = 2^n a_0 = 2^n \cdot 1 = 2^n$. Verify: $a_0 = 2^0 = 1$ ✓, $a_1 = 2^1 = 2 = 2 \cdot 1$ ✓. Option A ($2n$) is linear growth, not geometric. Option D ($2^{n-1}$) gives $a_0 = 2^{-1} = 0.5 \neq 1$, failing the initial condition.

</details>
