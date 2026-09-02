---
id: recurrence-relations.exam-pattern
concept_id: recurrence-relations
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT "find $a_n$ for a specific $n$" questions** usually give a 2-term linear recurrence plus two initial conditions and ask for a term several steps out — solving for the closed form is faster than iterating once $n$ is large ($n\ge6$ or so); for small $n$, direct iteration can be quicker than setting up the characteristic equation.

  Example: for $a_n=5a_{n-1}-6a_{n-2}$, $a_0=2,a_1=5$, the value $a_4=97$ is reachable either way, but $a_{15}$ strongly favors the closed form.

- **MCQ "identify the recurrence's order/type" questions** test recognizing linear vs. nonlinear, homogeneous vs. nonhomogeneous, and constant vs. variable coefficients from the stated formula alone.

- **MSQ questions on root behavior** ask which combinations of root type (real distinct, real repeated, complex) are possible for a given characteristic equation's discriminant sign.

- **Time budget:** setting up and solving a degree-$2$ characteristic equation with two initial conditions should take under $90$ seconds; budget more if the equation doesn't factor over the integers.
