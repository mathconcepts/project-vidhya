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

**C**. A: $(0,0)$ gives $0\neq1$ — fails Test 1. B: $(1,0)$ and $(0,1)$ are each in the set, but their sum $(1,1)$ has $1\cdot1\neq0$ — fails closure under addition. D: $(0,0)$ isn't on the unit circle — fails Test 1. C: $x-y=0$ is the line $y=x$; contains $(0,0)$, and both $(a,a)+(b,b)=(a+b,a+b)$ and $c(a,a)=(ca,ca)$ stay on the line. Valid subspace.

</details>
