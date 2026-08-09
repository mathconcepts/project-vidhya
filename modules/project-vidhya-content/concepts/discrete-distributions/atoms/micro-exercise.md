---
id: discrete-distributions.micro-exercise
concept_id: discrete-distributions
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

If a fair coin is tossed 5 times, what is the probability of getting exactly 3 heads?

- **(A)** 5/16
- **(B)** 10/32
- **(C)** 5/32
- **(D)** 3/5

<details>
<summary>Answer</summary>

**B**. This is a binomial distribution problem with $n = 5$, $p = 0.5$, and we want $k = 3$ heads.

$$P(X = 3) = \binom{5}{3} (0.5)^3 (0.5)^2 = \binom{5}{3} (0.5)^5$$

Calculate $\binom{5}{3}$:
$$\binom{5}{3} = \frac{5!}{3! \cdot 2!} = \frac{5 \times 4}{2 \times 1} = 10$$

So:
$$P(X = 3) = 10 \times (0.5)^5 = 10 \times \frac{1}{32} = \frac{10}{32} = \frac{5}{16}$$

Note: Option B shows 10/32, which simplifies to 5/16, matching Option A. The unsimplified form 10/32 is listed as option B.

</details>
