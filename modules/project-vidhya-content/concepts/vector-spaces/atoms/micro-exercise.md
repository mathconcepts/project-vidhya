---
id: vector-spaces.micro-exercise
concept_id: vector-spaces
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Which of the following is a subspace of $\mathbb{R}^2$?

- **(A)** $\{(x, y) : x + y = 1\}$
- **(B)** $\{(x, y) : xy = 0\}$
- **(C)** $\{(x, y) : x - y = 0\}$
- **(D)** $\{(x, y) : x^2 + y^2 = 1\}$

<details>
<summary>Answer</summary>

**C**. A subspace must: (1) contain $(0, 0)$, (2) be closed under addition, (3) be closed under scalar multiplication.

A: $(0, 0)$ gives $0 + 0 = 0 \neq 1$, so $(0, 0) \notin W$. Not a subspace.

B: $(1, 0) \in W$ (since $1 \cdot 0 = 0$) and $(0, 1) \in W$, but $(1, 0) + (0, 1) = (1, 1) \notin W$ (since $1 \cdot 1 \neq 0$). Not closed under addition.

C: $x - y = 0 \implies y = x$. Contains $(0, 0)$ ✓. For $(a, a)$ and $(b, b)$: $(a, a) + (b, b) = (a+b, a+b)$, which satisfies the condition. For scalar $c$: $c(a, a) = (ca, ca)$, which also satisfies. This is the line $y = x$, a valid subspace.

D: $(0, 0)$ gives $0 + 0 = 0 \neq 1$, not on the unit circle. Not a subspace.

</details>
