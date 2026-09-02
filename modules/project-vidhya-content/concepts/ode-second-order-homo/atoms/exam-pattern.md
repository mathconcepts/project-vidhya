---
id: ode-second-order-homo.exam-pattern
concept_id: ode-second-order-homo
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions give an IVP and ask for $y$ at a specific point**, requiring the full pipeline: form the characteristic equation, solve the roots, write the matching solution family, apply both conditions, then evaluate. For $y''+4y'+13y=0$ with $y(0)=0,\,y'(0)=3$, the particular solution $y=e^{-2x}\sin3x$ evaluated at $x=\pi/6$ gives $y=e^{-\pi/3}\sin(\pi/2)=e^{-\pi/3}\approx0.351$ — a clean single-term value is a good sign the algebra went right.

- **MCQ questions match an ODE to its solution family**, with distractors that keep the right exponential base but swap $\cos/\sin$ for a second exponential, or drop one arbitrary constant — always count that the answer has exactly two independent constants before picking.

- **MSQ "which are true" questions probe solution-space structure**, e.g. "the solution set of a linear homogeneous second-order ODE forms a 2-dimensional vector space" (true) or "any two solutions of the same homogeneous ODE are linearly independent" (false — two solutions can be scalar multiples of each other).

- **Time budget:** forming the characteristic equation and classifying the discriminant should take under 30 seconds; the full IVP, including both derivative-and-substitute steps, fits comfortably under 90 seconds when the roots are clean integers or simple complex pairs.
