---
id: vector-fields.common-traps
concept_id: vector-fields
atom_type: common_traps
bloom_level: 3
difficulty: 0.50
exam_ids: ["*"]
---

**Trap 1 — Guessing a potential without the mixed-partials check.** A field that fails $\partial Q/\partial x=\partial P/\partial y$ has no scalar potential at all; writing one down anyway by pattern-matching produces a $\phi$ whose gradient reproduces only one of the two components.

**Trap 2 — Dropping the constant of integration mid-way.** After $\phi=\int P\,dx = x^3y+g(y)$, treating $g(y)$ as zero instead of solving for it from the second equation throws away information the field still carries in $y$.

**Trap 3 — Confusing a scalar field with a vector field of the same name.** $\phi$ and $\nabla\phi$ answer different questions — a "field" without qualification in a question stem should be read from context, not assumed to be one or the other.

**Trap 4 — Treating every vector field as a gradient field.** $(-y,x)$ has no scalar potential; assuming a potential exists and hunting for one that doesn't wastes the whole attempt before the mixed-partials check would have said no in one line.
