---
id: ode-exact-intuition
concept_id: ode-exact
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

## Exact ODEs: The Potential Function Idea

An ODE written as $M(x,y)\,dx + N(x,y)\,dy = 0$ is called **exact** when the left-hand side is the total differential of some function $F(x,y)$:

$$dF = \frac{\partial F}{\partial x}\,dx + \frac{\partial F}{\partial y}\,dy = M\,dx + N\,dy$$

**The exactness test.** Since mixed partial derivatives of a smooth function are equal, $\frac{\partial^2 F}{\partial y\,\partial x} = \frac{\partial^2 F}{\partial x\,\partial y}$, exactness requires:

$$\boxed{\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}}$$

**Why this is powerful.** When the condition holds, finding the solution reduces to finding the potential function $F$:

1. Integrate $M$ with respect to $x$, treating $y$ as a constant — this gives $F(x,y) = \int M\,dx + g(y)$.
2. Differentiate $F$ with respect to $y$ and set it equal to $N$ to determine $g'(y)$.
3. Integrate to get $g(y)$.
4. The **general solution** is simply $F(x,y) = C$.

**Memory anchor.** Think of $(M, N)$ as a 2-D "force field". If $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$, the field is **conservative** — a potential exists, and every solution curve is a level set $F = C$ of that potential.

**What GATE tests.** Checking the exactness condition, carrying out the two-step integration to find $F$, and writing $F(x,y) = C$ as the answer. Occasionally an integrating factor $\mu(x)$ or $\mu(y)$ converts a non-exact ODE into an exact one — the GATE syllabus covers both.
