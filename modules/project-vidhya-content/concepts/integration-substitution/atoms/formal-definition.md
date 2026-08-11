---
id: integration-substitution.formal-definition
concept_id: integration-substitution
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Substitution Rule**: If $u = g(x)$ and $du = g'(x) dx$, then:
$$\int f(g(x)) \cdot g'(x) \, dx = \int f(u) \, du$$

The strategy: identify the composite function, let the inner part be $u$, compute $du$, rewrite the integral, integrate with respect to $u$, and substitute back.
