---
id: continuous-distributions.retrieval-prompt
concept_id: continuous-distributions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

A test score follows a normal distribution with mean 70 and standard deviation 10. What is the probability that a randomly selected student scores between 60 and 80?

- **(A)** 0.68
- **(B)** 0.95
- **(C)** 0.997
- **(D)** 0.34

<details>
<summary>Answer</summary>

**A**. Given $X \sim N(70, 10^2)$, we want $P(60 \le X \le 80)$.

**Standardize the bounds:**
$$Z_1 = \frac{60 - 70}{10} = -1$$
$$Z_2 = \frac{80 - 70}{10} = 1$$

So:
$$P(60 \le X \le 80) = P(-1 \le Z \le 1)$$

**Using the 68–95–99.7 rule:**
Approximately 68% of the data lies within $\mu \pm 1\sigma$ of the mean.

$$P(-1 \le Z \le 1) \approx 0.68$$

More precisely, using the standard normal CDF: $\Phi(1) - \Phi(-1) = 0.8413 - 0.1587 = 0.6826 \approx 0.68$.

</details>
