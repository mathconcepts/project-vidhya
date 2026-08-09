---
id: random-variables.micro-exercise
concept_id: random-variables
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Let $X$ be the number obtained when a fair die is rolled. What is $P(X \leq 3)$?

- **(A)** 1/2
- **(B)** 1/3
- **(C)** 2/3
- **(D)** 1/6

<details>
<summary>Answer</summary>

**A**. The random variable $X$ takes values $\{1, 2, 3, 4, 5, 6\}$, each with probability $1/6$.

We need $P(X \le 3)$, which is the CDF at $x = 3$.

$$P(X \le 3) = P(X = 1) + P(X = 2) + P(X = 3) = \frac{1}{6} + \frac{1}{6} + \frac{1}{6} = \frac{3}{6} = \frac{1}{2}$$

The CDF accumulates probabilities: outcomes 1, 2, and 3 are favorable, and there are 6 equally-likely outcomes total.

</details>
