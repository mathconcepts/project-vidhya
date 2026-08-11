---
id: recurrence-relations.retrieval-prompt
concept_id: recurrence-relations
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Solve the linear homogeneous recurrence $a_n = 5a_{n-1} - 6a_{n-2}$ with $a_0 = 0$, $a_1 = 1$.

- **(A)** $a_n = 3^n - 2^n$
- **(B)** $a_n = 2^n - 3^n$
- **(C)** $a_n = 3^n + 2^n$
- **(D)** $a_n = 2 \cdot 3^n - 3 \cdot 2^n$

<details>
<summary>Answer</summary>

**A**. Characteristic equation: $r^2 - 5r + 6 = 0 \Rightarrow (r-2)(r-3) = 0$. Distinct roots $r_1 = 2$, $r_2 = 3$. General solution: $a_n = A \cdot 2^n + B \cdot 3^n$. Apply ICs: $a_0 = 0$: $A + B = 0 \Rightarrow B = -A$. $a_1 = 1$: $2A + 3B = 1 \Rightarrow 2A - 3A = 1 \Rightarrow A = -1$, $B = 1$. So $a_n = -2^n + 3^n = 3^n - 2^n$. Verify: $a_2 = 9 - 4 = 5 = 5(1) - 6(0) = 5$ ✓.

</details>
