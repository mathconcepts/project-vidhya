---
id: continuity-intuition
concept_id: continuity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Continuity of Functions — Intuition

## The Three-Condition Test

A function $f$ is **continuous at a point $x = a$** if and only if all three of the following hold:

1. **$f(a)$ is defined** — the function exists at $a$.
2. **$\lim_{x \to a} f(x)$ exists** — both one-sided limits agree.
3. **$\lim_{x \to a} f(x) = f(a)$** — the limit equals the function value.

If any one condition fails, $f$ is discontinuous at $a$. GATE problems test each condition independently — learn to name which one breaks.

## Types of Discontinuity

**Removable discontinuity** — the limit exists, but either $f(a)$ is undefined or $f(a) \neq \lim_{x \to a} f(x)$. The "hole" can be plugged by redefining $f$ at that one point.

$$f(x) = \frac{x^2 - 4}{x - 2} \quad \text{at } x = 2 \quad \Rightarrow \quad \text{hole at } (2,\, 4)$$

**Jump discontinuity** — left-hand and right-hand limits both exist but are unequal. The function "jumps" from one value to another.

$$f(x) = \begin{cases} 0, & x < 0 \\ 1, & x \geq 0 \end{cases} \quad \Rightarrow \quad \lim_{x \to 0^-} f = 0 \neq 1 = \lim_{x \to 0^+} f$$

**Infinite discontinuity** — at least one one-sided limit is $\pm\infty$.

$$f(x) = \frac{1}{x} \quad \text{at } x = 0$$

**Essential (oscillatory) discontinuity** — the limit does not exist and does not diverge to infinity (e.g., $\sin(1/x)$ at $x = 0$).

## Continuity on an Interval

$f$ is continuous on **open interval** $(a, b)$ if it is continuous at every interior point. $f$ is continuous on **closed interval** $[a, b]$ if it is continuous on $(a, b)$ and the one-sided limits match $f(a)$ and $f(b)$ at the endpoints.

## The Intermediate Value Theorem (IVT)

If $f$ is continuous on $[a, b]$ and $f(a) \neq f(b)$, then $f$ takes on **every value between $f(a)$ and $f(b)$** at least once.

**GATE use cases:**
- Proving a root exists (if $f(a)$ and $f(b)$ have opposite signs, a zero lies in $(a,b)$).
- Proving a fixed point exists for continuous maps on $[0,1]$.

## Algebra of Continuity

Sums, differences, products, and (non-zero) quotients of continuous functions are continuous. Compositions of continuous functions are continuous. This means polynomials, $\sin$, $\cos$, $e^x$, and $\ln x$ (on their domains) are continuous everywhere they are defined.
