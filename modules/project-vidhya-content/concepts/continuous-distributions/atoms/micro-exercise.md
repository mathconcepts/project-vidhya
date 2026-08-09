---
id: continuous-distributions.micro-exercise
concept_id: continuous-distributions
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

A random variable $X$ follows a uniform distribution on $[2, 8]$. What is $P(X \le 5)$?

- **(A)** 0.5
- **(B)** 1/2
- **(C)** 1/3
- **(D)** 2/3

<details>
<summary>Answer</summary>

**A**. For a uniform distribution on $[a, b] = [2, 8]$:
$$f(x) = \frac{1}{b-a} = \frac{1}{8-2} = \frac{1}{6}$$

The probability is:
$$P(X \le 5) = \int_2^5 \frac{1}{6} \, dx = \frac{1}{6} \times (5 - 2) = \frac{3}{6} = \frac{1}{2} = 0.5$$

Geometrically, the interval $[2, 5]$ has length 3, and the total interval $[2, 8]$ has length 6, so the probability is the ratio: $3/6 = 1/2$.

</details>
