# Improper Integrals

> GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.6

## Intuition First

An improper integral has either infinite limits or an integrand with a discontinuity. Evaluate it using limits: split at the problematic point and take the limit as you approach it.

## Core Definition

**Type 1: Infinite Limits**:
$$\int_a^{\infty} f(x) \, dx = \lim_{t \to \infty} \int_a^t f(x) \, dx$$

$$\int_{-\infty}^b f(x) \, dx = \lim_{t \to -\infty} \int_t^b f(x) \, dx$$

**Type 2: Discontinuity at an Endpoint**:
$$\int_a^b f(x) \, dx = \lim_{\epsilon \to 0^+} \int_a^{b-\epsilon} f(x) \, dx \quad \text{(if discontinuous at } b \text{)}$$

**Convergence**: The improper integral converges if the limit exists and is finite. Otherwise it diverges.

## What Happens (Worked Example)

**Example**: Evaluate $\int_1^{\infty} \frac{1}{x^2} dx$.

This is Type 1 (infinite limit).

$$\int_1^{\infty} \frac{1}{x^2} dx = \lim_{t \to \infty} \int_1^t \frac{1}{x^2} dx = \lim_{t \to \infty} [-\frac{1}{x}]_1^t$$

$$= \lim_{t \to \infty} (-\frac{1}{t} + 1) = 0 + 1 = 1$$

The integral converges to $1$.

## GATE MA Relevance

> **Why it matters in GATE MA:** Improper integrals appear in probability and physics (decay, convergence). GATE asks: does $\int_a^{\infty} f(x) dx$ converge (MCQ)? Or evaluate it (NAT, 2 marks). High difficulty due to limit evaluation.
