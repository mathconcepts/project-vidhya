---
id: integration-basics.intuition
concept_id: integration-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Integration as Reversal

**Integration is the reverse operation of differentiation.** If differentiation breaks down a function to find its rate of change (the derivative), integration reassembles that rate-of-change information to recover the original function — this recovered function is called the **antiderivative**.

Think of it this way: when you differentiate $f(x) = x^3$, you get $f'(x) = 3x^2$. Integration asks the inverse question: "Which function, when differentiated, gives me $3x^2$?" The answer is $x^3$ (up to a constant).

The **indefinite integral** notation $\int f(x) \, dx$ represents "the antiderivative of $f$." We write:
$$\int 3x^2 \, dx = x^3 + C$$

where $C$ is the **constant of integration** — an unknown constant that disappears when we differentiate. Different initial conditions produce different antiderivatives differing only by a constant.

**Basic integration formulas** are the reverses of differentiation rules:
- $\int x^n \, dx = \frac{x^{n+1}}{n+1} + C$ (power rule)
- $\int \sin x \, dx = -\cos x + C$
- $\int e^x \, dx = e^x + C$

These form the foundation for solving GATE problems involving areas, work, motion, and accumulation. Mastering antiderivatives of common functions is non-negotiable for exam success.