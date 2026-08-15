---
id: improper-integrals.worked_example
concept_id: improper-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Convergence of Improper Integrals

## Problem

Evaluate the improper integral:
$$\int_1^\infty \frac{1}{x^2}\,dx$$

Determine whether it converges or diverges, and if it converges, find its value.

## Solution

**Step 1: Set up the limit definition**

Since the upper limit is infinite, we write this as a limit of proper integrals:
$$\int_1^\infty \frac{1}{x^2}\,dx = \lim_{R \to \infty} \int_1^R \frac{1}{x^2}\,dx$$

**Step 2: Compute the antiderivative**

Rewrite $\frac{1}{x^2} = x^{-2}$ and integrate:
$$\int x^{-2}\,dx = \frac{x^{-1}}{-1} = -\frac{1}{x}$$

**Step 3: Evaluate the definite integral**

$$\lim_{R \to \infty} \int_1^R \frac{1}{x^2}\,dx = \lim_{R \to \infty} \left[-\frac{1}{x}\right]_1^R$$

$$= \lim_{R \to \infty} \left(-\frac{1}{R} - \left(-\frac{1}{1}\right)\right)$$

$$= \lim_{R \to \infty} \left(-\frac{1}{R} + 1\right)$$

**Step 4: Take the limit**

As $R \to \infty$, $-\frac{1}{R} \to 0$, so:
$$\lim_{R \to \infty} \left(-\frac{1}{R} + 1\right) = 0 + 1 = 1$$

**Conclusion:** The improper integral **converges** to $\boxed{1}$.

This demonstrates the p-test for integrals: $\int_a^\infty \frac{1}{x^p}\,dx$ converges if and only if $p > 1$. Here, $p=2 > 1$, so convergence is guaranteed.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Evaluating $\\int_1^\\infty 1/x^2\\,dx$","steps":[{"prompt":"Step 1: Rewrite the improper integral using a limit. What is the definition?","hint":"An improper integral with an infinite upper bound is defined as $\\int_a^\\infty f(x)\\,dx = \\lim_{R \\to \\infty} \\int_a^R f(x)\\,dx$","answer":"$$\\int_1^\\infty \\frac{1}{x^2}\\,dx = \\lim_{R \\to \\infty} \\int_1^R \\frac{1}{x^2}\\,dx$$"},{"prompt":"Step 2: Find the antiderivative of $1/x^2$. Rewrite as $x^{-2}$ and apply the power rule.","hint":"The power rule states $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}$ for $n \\neq -1$. Here, $n = -2$.","answer":"$$\\int x^{-2}\\,dx = \\frac{x^{-1}}{-1} = -\\frac{1}{x} + C$$"},{"prompt":"Step 3: Evaluate the definite integral from 1 to $R$, then find the limit as $R \\to \\infty$.","hint":"Use the Fundamental Theorem: $\\int_1^R \\frac{1}{x^2}\\,dx = \\left[-\\frac{1}{x}\\right]_1^R = -\\frac{1}{R} - (-1)$. Then take $\\lim_{R \\to \\infty}$.","answer":"$$\\lim_{R \\to \\infty} \\left(-\\frac{1}{R} + 1\\right) = 0 + 1 = 1$$"}],"caption":"Key exam insight: Improper integrals converge when the integrand decays fast enough. Use the p-test as a quick check."}
```

---

DONE:improper-integrals
