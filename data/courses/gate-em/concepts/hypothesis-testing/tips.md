# Teaching Tips: Hypothesis Testing

## Common Student Errors

- **Misinterpreting the p-value as "probability $H_0$ is true"**: The p-value is the conditional probability of the data **given** $H_0$, not the probability of $H_0$ being true. A small p-value suggests $H_0$ is implausible, but it's not a direct statement about $H_0$'s truth.
- **Confusing Type I and Type II errors**: Type I (false positive, $\alpha$) is rejecting a true $H_0$. Type II (false negative, $\beta$) is failing to reject a false $H_0$. The mnemonics: Type I = "Boy who cried wolf" (false alarm), Type II = "Missing the wolf" (missed detection).
- **Using wrong test statistic (z vs t)**: Students use $z$-test (normal distribution) when $\sigma$ is unknown and should use $t$-test instead. Red flag: if the problem says "sample SD" or $s$ instead of population SD $\sigma$, it's a $t$-test. Also, for large samples ($n > 30$), the $t$-test approximates the $z$-test, so either may be acceptable (but $t$ is more conservative and preferred).

## GATE Question Pattern

GATE tests hypothesis testing in three main forms: (1) **Setup and decision** — given sample data and a hypothesized parameter, compute the test statistic, find the p-value, and decide whether to reject $H_0$ (~2 marks, MCQ/NAT), (2) **Conceptual understanding** — interpret p-values, distinguish Type I/II errors, explain the role of $\alpha$ (~1–2 marks, MCQ), and (3) **Mixed inference** — combine hypothesis testing with confidence intervals or power calculations (~2 marks, comprehensive problem). GATE questions often embed hypothesis testing in real-world scenarios (quality control, clinical trials) to test applied understanding.

## Speed Tricks for MCQs

- **Memorize critical values for common $\alpha$**: $z_{0.05} = 1.645$ (one-tailed), $z_{0.025} = 1.96$ (two-tailed). For $t$-tests with large $df$ (say, $df > 30$), $t$ values are approximately equal to $z$ values.
- **One-tailed vs two-tailed**: One-tailed (directional $H_1$, e.g., $\mu > \mu_0$) uses all of $\alpha$ in one tail; two-tailed (non-directional $H_1$, e.g., $\mu \ne \mu_0$) splits $\alpha$ into both tails ($\alpha/2$ each). So the two-tailed critical value is larger, making it harder to reject (more conservative).
- **Power = $1 - \beta$**: Always. If you see "power of 0.90," that means $\beta = 0.10$. Larger sample sizes and larger effect sizes increase power; use this to eliminate wrong answers quickly.

## Must-Memorize Formulas / Results

**Null and Alternative Hypotheses:**
- One-tailed: $H_1: \\theta > \\theta_0$ or $H_1: \\theta < \\theta_0$
- Two-tailed: $H_1: \\theta \\ne \\theta_0$

**Test Statistic (Z-test, known $\\sigma$):**
$$Z = \\frac{\\bar{X} - \\mu_0}{\\sigma / \\sqrt{n}} \\sim N(0, 1) \\text{ under } H_0$$

**Test Statistic (t-test, unknown $\\sigma$):**
$$t = \\frac{\\bar{X} - \\mu_0}{S / \\sqrt{n}} \\sim t_{n-1} \\text{ under } H_0$$

**P-value (Definition):**
$$p = P(\\text{Test Stat} \\ge \\text{observed} \\,|\\, H_0)$$

**Decision Rule:**
- If $p < \\alpha$: Reject $H_0$
- If $p \\ge \\alpha$: Fail to reject $H_0$

**Type I Error ($\\alpha$):**
$$\\alpha = P(\\text{Reject } H_0 \\,|\\, H_0 \\text{ is true})$$

**Type II Error ($\\beta$):**
$$\\beta = P(\\text{Fail to reject } H_0 \\,|\\, H_0 \\text{ is false})$$

**Power:**
$$\\text{Power} = 1 - \\beta = P(\\text{Reject } H_0 \\,|\\, H_0 \\text{ is false})$$

**Critical Value (One-tailed, $\\alpha = 0.05$):**
$$z_{0.05} = 1.645 \\text{ (standard normal)}$$

**Critical Value (Two-tailed, $\\alpha = 0.05$):**
$$z_{0.025} = 1.96 \\text{ (standard normal)}$$

**Confidence Interval (Connection to Hypothesis Testing):**
A 95% confidence interval for $\\mu$ corresponds to a two-tailed test at $\\alpha = 0.05$. If the hypothesized $\\mu_0$ lies outside the CI, reject $H_0$.
