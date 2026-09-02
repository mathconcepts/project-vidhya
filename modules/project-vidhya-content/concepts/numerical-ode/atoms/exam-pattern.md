---
id: numerical-ode.exam-pattern
concept_id: numerical-ode
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** give an ODE, an initial condition, a step size, and a method name, asking for $y$ after 1–3 steps to a stated number of decimal places.
- **MCQ questions** often test order (local vs. global) or ask which method requires no derivative of $f$ with respect to $y$ at all — every explicit method here qualifies, since none needs $\partial f/\partial y$, unlike implicit schemes.
- **A frequent MCQ pattern:** "Using Euler's method with $h=0.1$, approximate $y(0.1)$ for $y'=t+y$, $y(0)=1$" — worked exactly as $f(0,1)=1$, $y_1=1+0.1(1)=1.1$.
- **A frequent conceptual pattern:** a question states a step size and asks whether the method remains stable — testing whether "higher order" is mistakenly read as "always more stable," when stability and accuracy are separate properties.

**Time budget:** a single Euler step is a 1-minute item; a full RK4 step (four slope evaluations) runs 3–4 minutes if each $k_i$ is written out explicitly before combining.
