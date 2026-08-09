---
id: discrete-distributions.retrieval-prompt
concept_id: discrete-distributions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

A call center receives an average of 3 calls per minute. Assuming calls follow a Poisson distribution, what is the probability of receiving exactly 2 calls in a given minute?

- **(A)** $\frac{9e^{-3}}{2}$
- **(B)** $9e^{-3}$
- **(C)** $\frac{3e^{-2}}{2}$
- **(D)** $6e^{-3}$

<details>
<summary>Answer</summary>

**A**. This is a Poisson distribution with parameter $\lambda = 3$ (the expected rate per minute).

The PMF for Poisson is:
$$P(X = k) = \frac{e^{-\lambda} \lambda^k}{k!}$$

For $X = 2$ and $\lambda = 3$:
$$P(X = 2) = \frac{e^{-3} \times 3^2}{2!} = \frac{e^{-3} \times 9}{2} = \frac{9e^{-3}}{2}$$

The numerator is the exponential decay $e^{-3}$ (probability of zero events per minute in the underlying process) times $3^2$ (rate-squared), divided by $2!$ (accounting for two specific event times).

</details>
