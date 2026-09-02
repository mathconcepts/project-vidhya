---
id: multivariable-calculus.common_traps
concept_id: multivariable-calculus
atom_type: common_traps
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
tested_by_atom: multivariable-calculus.micro-exercise
---

**Trap 1 — Dropping a chain-rule term.** When both $x(t)$ and $y(t)$ vary, using only $\partial z/\partial x\cdot dx/dt$ and forgetting the $\partial z/\partial y\cdot dy/dt$ term collapses a two-variable rate into a one-variable one, understating it whenever the dropped term is nonzero.

**Trap 2 — Freezing the wrong value.** Computing $\partial f/\partial x$ at a specific point but plugging in a generic or remembered value for $y$ instead of the point's actual $y$-coordinate gives the slope of an entirely different slice.

**Trap 3 — Transposing the Jacobian.** Rows should correspond to output components, columns to input variables; swapping this convention silently transposes the linear map the Jacobian represents, changing which output responds to which input.
