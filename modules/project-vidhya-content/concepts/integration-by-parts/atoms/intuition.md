---
id: integration-by-parts.intuition
concept_id: integration-by-parts
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Integration by Parts: Trading Complexity

Integration by parts is the reverse of the product rule from differentiation. Just as the product rule lets us differentiate products of functions, integration by parts lets us handle integrals of products.

## The Core Idea

The formula $\int u \, dv = uv - \int v \, du$ works because we're making a strategic trade: instead of integrating a hard product directly, we rewrite it using this formula and hope that $\int v \, du$ is simpler to solve.

## The LIATE Rule

Choosing the right $u$ is crucial. The **LIATE** acronym prioritizes which function to differentiate (make it $u$):

- **L**ogarithmic functions (ln, log)
- **I**nverse trigonometric functions (arcsin, arctan)
- **A**lgebraic functions (polynomials like $x$, $x^2$)
- **T**rigonometric functions (sin, cos)
- **E**xponential functions ($e^x$, $a^x$)

If your integrand contains two functions from this list, the one appearing *earlier* should be $u$.

## Why It Works

This strategy works because we're **lowering the degree** of polynomials (differentiating) while moving the harder exponential or trig part to the other term. When done right, each application simplifies the problem. Some integrals (like $\int x^2 e^x \, dx$) need repeated application—but each step gets easier.

**Key insight for exams:** Always check whether your final integral $\int v \, du$ is simpler than the original.
```

---

## ATOM 2: VISUAL_ANALOGY

**File:**
