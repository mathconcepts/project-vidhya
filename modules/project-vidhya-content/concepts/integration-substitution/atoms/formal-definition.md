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

**When to reach for substitution:** the integrand must contain a composite function $f(g(x))$ together with a factor that is (a constant multiple of) $g'(x)$ — the "shadow" of the inner function sitting right beside it. The tempting wrong alternative is integration by parts, reached for on sight of any product; but by-parts is for two genuinely independent factors, and applying it here (differentiating one factor, integrating the other) only produces a messier integral, since there was never an independent second factor to trade — just a composition and its own derivative.
