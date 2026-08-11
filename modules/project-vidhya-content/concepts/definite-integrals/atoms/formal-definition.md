---
id: definite-integrals.formal-definition
concept_id: definite-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Definite Integral**: 
$$\int_a^b f(x) \, dx = F(b) - F(a)$$

where $F$ is an antiderivative of $f$ (the Fundamental Theorem of Calculus).

**Properties**:
- $\int_a^a f(x) dx = 0$
- $\int_a^b f(x) dx = -\int_b^a f(x) dx$
- $\int_a^c f(x) dx + \int_c^b f(x) dx = \int_a^b f(x) dx$ (additivity)
- $\int_a^b [f(x) + g(x)] dx = \int_a^b f(x) dx + \int_a^b g(x) dx$ (linearity)
