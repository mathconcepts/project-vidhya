---
id: ode-first-order.exam-pattern
concept_id: ode-first-order
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions give an initial condition and ask for $y$ at a specific $x$-value**, requiring the full pipeline: classify, solve for the general solution, apply the initial condition, then evaluate. Example: for $\frac{dy}{dx} + 2y = e^{-x}$ with $y(0) = 2$, the particular solution is $y(x) = e^{-x} + e^{-2x}$; evaluating at $x = \ln 2$ gives $y(\ln 2) = \frac{1}{2} + \frac{1}{4} = \frac{3}{4}$ — a clean fraction is a good sign the algebra is right.

- **MCQ questions ask you to match a differential equation to its general solution form**, often with distractors that swap a sign in the exponent or drop the arbitrary constant entirely — always confirm which distractor is missing $+C$ before picking.

- **MSQ "which of the following are true" questions test solution *structure***, e.g.: "every solution of a linear first-order ODE can be written as (a particular solution) + (constant) × (homogeneous solution)," or "the general solution of a first-order ODE always contains exactly one arbitrary constant" — both true, and both worth recognizing without re-deriving.

- **Time budget:** a standard linear first-order ODE (identify type, find $\mu(x)$, integrate, apply IC) should take under 90 seconds. If the integrating factor itself needs a substitution or partial fractions, budget closer to two minutes.
