# Hypothesis Testing

> GATE Engineering Mathematics | Probability & Statistics | medium frequency | difficulty: 0.6

## Intuition First
A factory claims its light bulbs last 1000 hours on average. You test 50 bulbs and find the average is only 980 hours. Is this difference real, or just due to random variation? Hypothesis testing provides a systematic framework to make this decision.

## Core Definition

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

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: A pharmaceutical company claims a drug reduces blood pressure by 20 mmHg on average. A clinical trial on 25 patients shows a mean reduction of 18 mmHg with sample SD = 5 mmHg. Test at $\alpha = 0.05$ whether the claim is supported.

**Step 1: Set up hypotheses.**
- $H_0: \mu = 20$ mmHg (the drug reduces BP by 20 mmHg)
- $H_1: \mu \ne 20$ mmHg (two-tailed, the drug does NOT reduce BP by exactly 20 mmHg)

**Step 2: Compute the test statistic** (using the $t$-test since $\sigma$ is unknown):
$$t = \frac{\bar{X} - \mu_0}{S / \sqrt{n}} = \frac{18 - 20}{5 / \sqrt{25}} = \frac{-2}{5 / 5} = \frac{-2}{1} = -2$$

**Step 3: Find the p-value.** With $df = n - 1 = 24$ degrees of freedom and $t = -2$:
- Two-tailed p-value: $P(|T| \ge 2) = 2 \times P(T \ge 2) \approx 2 \times 0.0283 = 0.0566$ (from $t$-table).

**Step 4: Compare to $\alpha = 0.05$.**
$$p\text{-value} = 0.0566 > 0.05 = \alpha$$

We fail to reject $H_0$. There is insufficient evidence at the 5% level to conclude that the drug does NOT reduce BP by 20 mmHg.

Label: "**Why it works:**"

The test statistic standardizes the sample mean relative to the hypothesized value, accounting for sample size and variability. Under $H_0$, this statistic follows a known distribution (here, $t$ with 24 df). The p-value measures how "surprising" our observation is under $H_0$; small p-values suggest $H_0$ is implausible. By comparing the p-value to a prespecified threshold $\alpha$, we control the false-positive rate.

## GATE MA Relevance
> **Why it matters in GATE MA:** Hypothesis testing appears in ~18% of GATE probability & statistics questions. GATE tests setup ($H_0$ vs $H_1$), test statistic selection (z vs t), p-value interpretation, and Type I/II error concepts. Often paired with confidence intervals and regression problems. Understanding this topic is critical for applied statistics and quality control questions in engineering contexts.
