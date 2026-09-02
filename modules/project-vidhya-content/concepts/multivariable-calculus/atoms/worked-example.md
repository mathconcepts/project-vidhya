---
id: multivariable-calculus.worked_example
concept_id: multivariable-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** For $z=x^2+y^2$ with $x=\cos t$, $y=\sin t$, find $dz/dt$ at $t=\pi/4$ using the multivariable chain rule.

**Step 1 — Partial derivatives.** $\dfrac{\partial z}{\partial x}=2x$, $\dfrac{\partial z}{\partial y}=2y$.

**Step 2 — Path derivatives.** $\dfrac{dx}{dt}=-\sin t$, $\dfrac{dy}{dt}=\cos t$.

**Step 3 — Assemble the chain rule.**
$$
\frac{dz}{dt}=2x(-\sin t)+2y(\cos t)=-2\cos t\sin t+2\sin t\cos t.
$$

**Step 4 — Evaluate at $t=\pi/4$.** $\cos(\pi/4)=\sin(\pi/4)=\tfrac{\sqrt2}{2}\approx0.7071$. Both products equal $2(0.7071)(0.7071)\approx1$, one negative and one positive:
$$
\frac{dz}{dt}=-1+1=0.
$$

**Step 5 — Box the result.**
$$
\boxed{\left.\frac{dz}{dt}\right|_{t=\pi/4}=0}
$$

**Verification.** $z=\cos^2t+\sin^2t=1$ for EVERY $t$ — a constant — by the Pythagorean identity, so $dz/dt=0$ identically, not just at $t=\pi/4$. The chain-rule computation and this direct algebraic route agree, which is exactly what moving along a circle (constant $x^2+y^2$) should produce: the path stays on one level curve of $z$, and the gradient is perpendicular to the direction of motion there — zero rate of change along it.
