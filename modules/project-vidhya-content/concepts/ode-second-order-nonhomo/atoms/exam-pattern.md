---
id: ode-second-order-nonhomo.exam-pattern
concept_id: ode-second-order-nonhomo
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions give a forcing term plus an IVP and ask for $y$ at a point**, requiring: homogeneous roots, a resonance check against $f(x)$, the particular solution, then both constants. For $y''-3y'+2y=e^{3x}$ with $y(0)=y'(0)=0$, the answer $y=\tfrac12e^{x}-e^{2x}+\tfrac12e^{3x}$ evaluated at $x=0$ gives back $0$ — always re-check your own boundary values as a free sanity pass before submitting.

- **MCQ questions ask you to identify the correct trial form for $y_p$** given $f(x)$ and the homogeneous roots — distractors usually drop the required $x$-multiplier when $f(x)$ coincides with a root, or add one when it doesn't apply at all.

- **MSQ "which are true" questions probe the $y_h+y_p$ structure**, e.g. "$y_p$ can always be chosen with no arbitrary constants" (true) or "the general solution is unique once $f(x)$ is fixed, independent of initial conditions" (false — two arbitrary constants remain until an IVP or BVP pins them down).

- **Time budget:** the resonance check itself is a 10-second glance at the roots; a full undetermined-coefficients problem with a clean IVP fits under two minutes, while a forcing term needing variation of parameters (non-polynomial-exponential-trig) should be budgeted closer to three.
