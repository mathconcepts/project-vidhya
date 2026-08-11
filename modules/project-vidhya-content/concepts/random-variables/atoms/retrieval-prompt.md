---
id: random-variables.retrieval-prompt
concept_id: random-variables
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

A discrete random variable $X$ has PMF $p(x) = c \cdot x$ for $x \in \{1, 2, 3\}$ and $p(x) = 0$ otherwise. Find the constant $c$.

- **(A)** 1/6
- **(B)** 1/3
- **(C)** 1/2
- **(D)** 1/12

<details>
<summary>Answer</summary>

**A**. For a valid PMF, the probabilities must sum to 1:
$$\sum_x p(x) = 1$$

Given $p(x) = c \cdot x$ for $x \in \{1, 2, 3\}$:
$$p(1) + p(2) + p(3) = c \cdot 1 + c \cdot 2 + c \cdot 3 = c(1 + 2 + 3) = 6c = 1$$

Therefore:
$$c = \frac{1}{6}$$

We can verify: $p(1) = 1/6$, $p(2) = 2/6 = 1/3$, $p(3) = 3/6 = 1/2$, and $1/6 + 1/3 + 1/2 = 1/6 + 2/6 + 3/6 = 6/6 = 1$ ✓

</details>
