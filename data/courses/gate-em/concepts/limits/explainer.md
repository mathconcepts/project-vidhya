# Limits

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.3

## Intuition First

A limit asks: "What number does this function approach as $x$ gets close to some value?" It's like zooming in on a number line with a microscope — no matter how close you look, the function values cluster at one point.

## Core Definition

**Limit of a Function**: Let $f$ be defined in a neighborhood of $a$ (except possibly at $a$ itself). We say $\lim_{x \to a} f(x) = L$ if for every $\epsilon > 0$, there exists $\delta > 0$ such that $|f(x) - L| < \epsilon$ whenever $0 < |x - a| < \delta$.

**One-sided limits:**
- $\lim_{x \to a^+} f(x) = L$ (right limit): $x$ approaches $a$ from the right.
- $\lim_{x \to a^-} f(x) = L$ (left limit): $x$ approaches $a$ from the left.

The limit exists if and only if both one-sided limits exist and are equal.

## What Happens (Worked Example)

**Example: Computing $\lim_{x \to 2} \frac{x^2 - 4}{x - 2}$**

Direct substitution at $x = 2$ gives $\frac{0}{0}$ (indeterminate form). 

**What happens:** Factor the numerator:
$$\frac{x^2 - 4}{x - 2} = \frac{(x-2)(x+2)}{x-2}$$

For $x \neq 2$, we cancel:
$$= x + 2$$

As $x \to 2$:
$$\lim_{x \to 2} (x + 2) = 2 + 2 = 4$$

Geometrically: the function has a "hole" at $x = 2$, but the function values cluster at $y = 4$ as $x$ approaches $2$.

**Why it works:** The algebraic cancellation removes the indeterminacy. The limit captures the behavior of the function arbitrarily close to the point, not the value at the point itself.

## GATE MA Relevance

> **Why it matters in GATE MA:** Limits are foundational for continuity and derivatives. GATE asks: compute limits using factoring, rationalization, L'Hôpital's rule, or standard limit forms. Often worth 1–2 marks (MCQ). Key indeterminate forms: $0/0$, $\infty/\infty$, $0 \cdot \infty$, $\infty - \infty$.
