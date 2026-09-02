---
id: implicit-differentiation.common-traps
concept_id: implicit-differentiation
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: implicit-differentiation.micro-exercise
---

**Trap 1 — Treating $y$ as a constant.** Differentiating $y^2$ as $0$ (or skipping it) because "$y$ isn't $x$" is the single most common slip. $y$ is an unknown function of $x$; $\frac{d}{dx}[y^2] = 2y\,\frac{dy}{dx}$, never just $2y$.

**Trap 2 — Missing the product rule on mixed terms.** A term like $xy$ or $x^2y^3$ multiplies an $x$-part by a $y$-part; it needs the product rule *and* the chain rule on the $y$-factor: $\frac{d}{dx}[xy] = y + x\,\frac{dy}{dx}$, not $y'$ alone.

**Trap 3 — Substituting the point too early.** Plugging in numeric values before differentiating destroys the variable $y$ was standing for, so there is nothing left to differentiate. Differentiate the general relation first; substitute the point only in the final formula for $\frac{dy}{dx}$.

**Trap 4 — Sign or factoring slip while isolating $\frac{dy}{dx}$.** After collecting terms, $\frac{dy}{dx}$ often sits inside a factor like $(x+2y)$; dividing by the wrong side or dropping a minus sign here is an algebra error, not a calculus one — recheck by plugging the found slope back into the original equation at a known point.
