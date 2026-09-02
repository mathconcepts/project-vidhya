---
id: vector-fields.exam-pattern
concept_id: vector-fields
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want a single evaluated vector, not the general formula.** Given $\phi(x,y,z)$ and a point, the answer is $\nabla\phi$ evaluated there — three numbers, not the symbolic gradient.

  Example: for $\phi=x^2y+y^3$ at $(1,2)$, the expected answer is $(4,13)$ (verified above), not "$(2xy,\ x^2+3y^2)$" left unevaluated.

- **MCQ "is it conservative" questions test the mixed-partials check, not integration.** The fastest correct move is computing $\partial Q/\partial x$ and $\partial P/\partial y$ and comparing — finding the actual potential is only needed if the question asks for it.

- **MSQ "which of the following are true" stems mix scalar-field and vector-field facts on purpose** — e.g. "$\nabla\phi$ is a vector field" (true) alongside "$\phi$ has the same dimension count as $\nabla\phi$" (false: $\phi$ is one number, $\nabla\phi$ is $n$ numbers). Read each option against the scalar/vector distinction specifically.

- **Time budget:** a mixed-partials check plus one potential-function integration should take under two minutes; if the integration is producing terms that don't cancel cleanly with the second equation, re-check the mixed-partials test before continuing — a wrong "conservative" verdict is the usual cause.
