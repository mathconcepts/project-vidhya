---
id: definite-integrals.intuition
concept_id: definite-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

Definite integrals measure the **net accumulation** of a quantity over an interval. Think of it as answering "if I sum up infinitely many infinitesimal slices, what's the total?" In GATE mathematics, definite integrals appear everywhere: computing areas, volumes, work done by forces, and moments of inertia.

The **Fundamental Theorem of Calculus (FTC)** bridges differentiation and integration: 
$$\int_a^b f(x) \, dx = F(b) - F(a)$$
where $F$ is any antiderivative of $f$. This means you don't actually need to think about "infinite slices"—you just find the antiderivative and evaluate it at the bounds.

Key properties save calculation time on exams:
- **Linearity:** $\int_a^b [cf(x) + g(x)] \, dx = c\int_a^b f(x) \, dx + \int_a^b g(x) \, dx$
- **Additivity:** $\int_a^b f(x) \, dx + \int_b^c f(x) \, dx = \int_a^c f(x) \, dx$
- **Symmetry:** Odd and even functions simplify integrals dramatically

These aren't just algebra—they're shortcuts that compress 10-minute problems into 2 minutes during the exam. The definite integral is **path-independent**: the value depends only on the function and the bounds, not on intermediate steps.
```

**FILE 2:
