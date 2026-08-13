---
id: limits-intuition
concept_id: limits
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Limits and Continuity — Intuition

## What Is a Limit?

A **limit** answers the question: *What value does $f(x)$ approach as $x$ gets arbitrarily close to some point $a$?*

$$\lim_{x \to a} f(x) = L$$

This says: as $x$ approaches $a$ (from either side), the output $f(x)$ gets as close to $L$ as we like — **regardless of what $f(a)$ actually equals, or whether it is even defined**.

## Left-Hand and Right-Hand Limits

Approach matters. For $\lim_{x \to a} f(x)$ to exist, both one-sided limits must agree:

$$\lim_{x \to a^-} f(x) = L \quad \text{and} \quad \lim_{x \to a^+} f(x) = L$$

If they disagree, the two-sided limit **does not exist** (DNE). This is the standard test for jump discontinuities on GATE.

## Key Limit Laws

For $\lim_{x \to a} f(x) = L$ and $\lim_{x \to a} g(x) = M$:

| Law | Statement |
|-----|-----------|
| Sum | $\lim [f + g] = L + M$ |
| Product | $\lim [f \cdot g] = L \cdot M$ |
| Quotient | $\lim \dfrac{f}{g} = \dfrac{L}{M}$, provided $M \neq 0$ |
| Power | $\lim [f(x)]^n = L^n$ |
| Composition | $\lim_{x \to a} g(f(x)) = g(L)$ if $g$ is continuous at $L$ |

## The Squeeze Theorem

If $g(x) \leq f(x) \leq h(x)$ near $a$, and $\lim_{x \to a} g(x) = \lim_{x \to a} h(x) = L$, then:

$$\lim_{x \to a} f(x) = L$$

Classic application: $\lim_{x \to 0} x \sin\!\left(\dfrac{1}{x}\right) = 0$, since $-|x| \leq x\sin(1/x) \leq |x|$.

## L'Hôpital's Rule — When Direct Substitution Fails

When a limit yields an indeterminate form ($0/0$ or $\infty/\infty$), differentiate numerator and denominator separately:

$$\lim_{x \to a} \frac{f(x)}{g(x)} \stackrel{\text{L'H}}{=} \lim_{x \to a} \frac{f'(x)}{g'(x)}$$

Apply repeatedly until the form is determinate. Remember: this is differentiation, **not** the quotient rule.

## Essential Limits to Memorise

$$\lim_{x \to 0} \frac{\sin x}{x} = 1 \qquad \lim_{x \to 0} \frac{e^x - 1}{x} = 1 \qquad \lim_{x \to 0} \frac{\ln(1+x)}{x} = 1$$

$$\lim_{x \to \infty} \left(1 + \frac{1}{x}\right)^x = e \qquad \lim_{x \to 0} \frac{a^x - 1}{x} = \ln a$$

These appear verbatim in GATE Engineering Mathematics problems nearly every year.
