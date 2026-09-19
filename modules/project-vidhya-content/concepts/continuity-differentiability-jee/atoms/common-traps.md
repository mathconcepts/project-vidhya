---
id: continuity-differentiability-jee.common-traps
concept_id: continuity-differentiability-jee
atom_type: common_traps
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

- **Assuming continuous implies differentiable:** the implication only runs one way. $f(x)=|x|$ is continuous everywhere and fails to be differentiable at exactly one point — a continuous function can still have corners, cusps, or vertical tangents.
- **Checking only one side at a suspected corner:** differentiability needs the left-hand derivative and the right-hand derivative to *agree*. Computing one side, getting a clean number, and stopping — without checking the other side disagrees — is how a genuine non-differentiable point gets waved through.
- **Chain rule without the inner derivative:** differentiating $\sin(x^2)$ as $\cos(x^2)$, forgetting the extra factor of $2x$ from the inner function. The chain rule is a product of two rates, not just the outer one.
- **Implicit differentiation treating $y$ as a constant:** differentiating $x^2y$ with respect to $x$ as $2xy$ alone, dropping the $x^2\dfrac{dy}{dx}$ term the product rule demands whenever a term contains $y$.
- **Quoting a domain-restricted inverse-trig derivative outside its domain:** formulas like $\dfrac{d}{dx}\sin^{-1}\!\left(\dfrac{2x}{1+x^2}\right)=\dfrac{2}{1+x^2}$ hold only inside a specific range of $x$ (here $-1<x<1$) — past that range the sign flips, and treating the formula as universal is a standard, gradeable mistake.
