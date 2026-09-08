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

Think of it this way: drive at a steady $60$ km/h, and differentiating your distance-covered function gives back $60$ — the speed. Integration asks the inverse question: "which distance function, when differentiated, gives $60$?" The answer is $60t$ (up to a constant) — that is, $F(t)=60t$ km after $t$ hours.

The **indefinite integral** notation $\int f(t) \, dt$ represents "the antiderivative of $f$." We write:
$$\int 60 \, dt = 60t + C$$

where $C$ is the **constant of integration** — an unknown constant that disappears when we differentiate. Concretely, it's simply which km-mark you started from: $60t$ km and $60t+50$ km both differentiate back to the same $60$, since a fixed head-start never shows up in the rate. Different starting positions (initial conditions) produce different antiderivatives differing only by a constant.

**Basic integration formulas** are the reverses of differentiation rules:
- $\int x^n \, dx = \frac{x^{n+1}}{n+1} + C$ (power rule)
- $\int \sin x \, dx = -\cos x + C$
- $\int e^x \, dx = e^x + C$

These form the foundation for solving GATE problems involving areas, work, motion, and accumulation. Mastering antiderivatives of common functions is non-negotiable for exam success.