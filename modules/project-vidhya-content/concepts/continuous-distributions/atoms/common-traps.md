---
id: continuous-distributions.common-traps
concept_id: continuous-distributions
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to standardize before using normal tables**: Students compute $P(X \le 70)$ directly without converting to $Z = \frac{70 - \mu}{\sigma}$ first, then trying to read from a standard normal table (which won't match). Always standardize to $N(0, 1)$ before consulting tables.
- **Confusing "between" with one-sided probabilities**: $P(a \le X \le b)$ requires two CDF lookups ($F(b) - F(a)$), but students often report only $F(b)$. Similarly, for exponential, $P(X > x) = e^{-\lambda x}$ (one-sided), not $1 - e^{-\lambda x}$ (which is $F(x)$).
- **Misapplying the 68–95–99.7 rule outside its range**: The rule is precise for $\mu \pm 1\sigma$ (68.27%), $\mu \pm 2\sigma$ (95.45%), and $\mu \pm 3\sigma$ (99.73%), but students sometimes try to use it for arbitrary intervals like $\mu \pm 0.5\sigma$ (which is ~38%, not obvious from the rule).
