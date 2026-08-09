---
id: hypothesis-testing.formal-definition
concept_id: hypothesis-testing
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Null Hypothesis ($H_0$)**: The default assumption (usually "no difference" or "no effect"). Example: $H_0: \mu = 1000$ hours.

**Alternative Hypothesis ($H_1$ or $H_a$)**: The claim we're testing against the null. Example: $H_1: \mu \ne 1000$ (two-tailed) or $H_1: \mu < 1000$ (one-tailed).

**Test Statistic**: A function of the sample data that measures how far the data deviates from $H_0$.
$$Z = \frac{\bar{X} - \mu_0}{\sigma / \sqrt{n}} \quad \text{(for normal with known } \sigma \text{)}$$

$$t = \frac{\bar{X} - \mu_0}{S / \sqrt{n}} \quad \text{(for normal with unknown } \sigma \text{)}$$

**P-value**: The probability of observing a test statistic as extreme (or more extreme) than the one computed, assuming $H_0$ is true.

**Significance Level ($\alpha$)**: The threshold for rejecting $H_0$. Common choice: $\alpha = 0.05$ (5%).

**Decision Rule**:
- If $p\text{-value} < \alpha$, reject $H_0$ (conclude $H_1$ is supported).
- If $p\text{-value} \ge \alpha$, fail to reject $H_0$ (insufficient evidence for $H_1$).

**Type I Error**: Rejecting $H_0$ when it is true. Probability = $\alpha$ (the significance level).

**Type II Error**: Failing to reject $H_0$ when it is false. Probability = $\beta$; Power = $1 - \beta$.

Geometric interpretation: the test statistic follows a known distribution under $H_0$ (e.g., standard normal $N(0, 1)$). The p-value is the tail area beyond the observed test statistic. If this tail area is smaller than $\alpha$, we reject $H_0$.
