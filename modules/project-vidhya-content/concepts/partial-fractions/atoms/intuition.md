---
id: partial-fractions-intuition
concept_id: partial-fractions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# What Are Partial Fractions?

A **rational function** is a ratio $\dfrac{P(x)}{Q(x)}$ where $P$ and $Q$ are polynomials and $\deg(P) < \deg(Q)$. Partial fraction decomposition breaks this complex fraction into a **sum of simpler fractions** that are much easier to integrate or invert.

## The Core Idea

Suppose you want to integrate $\displaystyle\int \frac{3x+5}{(x-1)(x+2)}\,dx$. Directly integrating the left side is hard. But if you can rewrite it as:

$$\frac{3x+5}{(x-1)(x+2)} = \frac{A}{x-1} + \frac{B}{x+2}$$

then you just integrate two simple logarithm forms. Partial fractions turns one hard problem into several easy ones.

## Types of Factors in $Q(x)$

Factor $Q(x)$ completely over the reals. Three cases arise:

| Factor type | Example | Partial fraction term |
|---|---|---|
| Distinct linear $(x-a)$ | $(x-1)(x+2)$ | $\dfrac{A}{x-a}$ for each |
| Repeated linear $(x-a)^k$ | $(x-3)^2$ | $\dfrac{A_1}{x-a} + \dfrac{A_2}{(x-a)^2} + \cdots + \dfrac{A_k}{(x-a)^k}$ |
| Irreducible quadratic $ax^2+bx+c$ | $x^2+1$ | $\dfrac{Ax+B}{ax^2+bx+c}$ |

## Why This Works

When you add fractions with different denominators, you get a combined numerator. Partial fractions does the reverse — it **undoes** that addition. The key fact is that the decomposition is **unique**: there is exactly one set of constants $A, B, C, \ldots$ that works.

## GATE Exam Relevance

Partial fractions appear in GATE Mathematics in:

- **Integration** of rational functions
- **Inverse Laplace transforms** — $\mathcal{L}^{-1}\!\left\{\frac{P(s)}{Q(s)}\right\}$ almost always requires partial fractions
- **Z-transforms** and **generating functions** in discrete mathematics

The method is mechanical: factor the denominator, write the template, multiply through, and solve for constants by substituting convenient values of $x$.
