# Continuity

> GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.3

## Intuition First

A function is continuous if you can draw its graph without lifting your pen off the paper — no jumps, holes, or breaks. Intuitively: small changes in input cause small changes in output.

## Core Definition

**Continuity at a Point**: A function $f$ is continuous at $x = a$ if:
1. $f(a)$ is defined
2. $\lim_{x \to a} f(x)$ exists
3. $\lim_{x \to a} f(x) = f(a)$

**Continuity on an Interval**: $f$ is continuous on $(a,b)$ if it is continuous at every point in the interval. $f$ is continuous on the **closed interval** $[a,b]$ if it is continuous on $(a,b)$ and the one-sided limits at the endpoints equal the function values: $\lim_{x \to a^+} f(x) = f(a)$ and $\lim_{x \to b^-} f(x) = f(b)$.

**Types of Discontinuity:**
- **Removable discontinuity:** $\lim_{x \to a} f(x)$ exists but $\neq f(a)$ (or $f(a)$ undefined).
- **Jump discontinuity:** $\lim_{x \to a^-} f(x) \neq \lim_{x \to a^+} f(x)$.
- **Infinite discontinuity:** $\lim_{x \to a} f(x) = \pm \infty$.

## What Happens (Worked Example)

**Example 1: Removable Discontinuity**

$$f(x) = \begin{cases} \frac{x^2 - 1}{x - 1} & \text{if } x \neq 1 \\ 0 & \text{if } x = 1 \end{cases}$$

At $x = 1$: $\lim_{x \to 1} \frac{x^2 - 1}{x - 1} = \lim_{x \to 1} (x + 1) = 2$, but $f(1) = 0$.

**What happens:** The function has a "hole" at $(1, 2)$ because the defined value is $0$ instead of the limiting value $2$. This discontinuity can be "removed" by redefining $f(1) = 2$.

**Example 2: Jump Discontinuity**

$$f(x) = \begin{cases} x & \text{if } x < 0 \\ 1 & \text{if } x \geq 0 \end{cases}$$

At $x = 0$: $\lim_{x \to 0^-} f(x) = 0$ but $\lim_{x \to 0^+} f(x) = 1$. The function jumps from $0$ to $1$.

**Why it works:** Continuity is the glue that connects local behavior (the limit) to global properties (the actual value). Discontinuities prevent calculus operations like integration from working smoothly.

## GATE MA Relevance

> **Why it matters in GATE MA:** Continuity is essential for theorems like Intermediate Value Theorem and properties of derivatives. GATE asks: identify points of discontinuity (MCQ), verify continuity at a point (NAT), or recognize when a theorem applies. Often combined with limits (1–2 marks).
