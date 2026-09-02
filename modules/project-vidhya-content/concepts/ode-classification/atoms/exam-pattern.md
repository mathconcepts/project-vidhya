---
id: ode-classification.exam-pattern
concept_id: ode-classification
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions often ask for order + degree as a single number**, forcing you to get both right independently before adding. Example: for $x\,(y'')^2 + (y')^3 = \sin x$, the highest derivative is $y''$ (order $=2$); the equation is already polynomial in its derivatives, and the highest-order derivative $y''$ carries power $2$ (the $(y')^3$ term doesn't affect degree, since $y'$ isn't the highest-order derivative present), so degree $=2$. Order + degree $=4$.

- **MCQ questions test the "degree undefined" case directly** — an option reading "degree $=1$" is the standard distractor for an equation like $y'' + \log(y') = 0$, where the correct answer is that degree does not exist.

- **MSQ "select all true statements" questions mix order, degree, and linearity** in the same list — e.g. "this equation is order 2," "this equation is linear," "this equation has degree 1," where some are true and some are deliberately false, testing whether you check all three independently rather than assuming they move together.

- **Time budget:** a clean classification (no roots or transcendental derivatives to clear) should take under 30 seconds. One that requires clearing a root or fraction before degree can be read — like the worked example for this concept — should still stay under 90 seconds; if you're re-deriving from scratch past that, you've likely lost track of which derivative is the highest-order one.
