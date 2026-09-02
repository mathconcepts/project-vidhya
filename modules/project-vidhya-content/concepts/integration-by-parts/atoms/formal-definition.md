---
id: integration-by-parts.formal-definition
concept_id: integration-by-parts
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Integration by Parts Formula**:
$$\int u \, dv = uv - \int v \, du$$

**Strategy**: Choose $u$ and $dv$ such that:
1. $du$ is simpler than $u$
2. $v$ is easy to find from $dv$
3. The new integral $\int v \, du$ is easier than the original

**LIATE Rule**: Prioritize choosing $u$ as (in order): Logarithm, Inverse trig, Algebraic (polynomial), Trigonometric, Exponential.

**When to reach for by-parts:** the integrand is a product of two factors from *different* families (polynomial × exponential/trig/log) with no substitution reducing it — no factor is a constant multiple of the derivative of the other's argument. The tempting wrong alternative is substitution, tried on sight of any product; but substitution needs a composition and its own shadow-derivative sitting beside it, and a plain product like $xe^x$ has no such composition, so LIATE's $u$-choice is the correct route, not a search for a $u$ whose derivative also appears.
