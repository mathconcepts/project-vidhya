---
id: differentiability.common_traps
concept_id: differentiability
atom_type: common_traps
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: differentiability.micro-exercise
---

**Trap 1 — Assuming continuity proves differentiability.** $f(x)=|x|$ is continuous at $x=0$ and not differentiable there. Continuity is necessary, never sufficient — every differentiability question needs its own separate check.

**Trap 2 — Solving a piecewise "find the constants" problem with only one equation.** Matching only the function values (continuity) leaves the derivative condition unchecked, and vice versa. Both conditions are independent; a correct answer needs both equations solved together, not either alone.

**Trap 3 — Eyeballing smoothness instead of computing one-sided derivatives.** A vertical tangent (like $x^{1/3}$ at $0$) can look "smooth" on a rough sketch while the actual derivative blows up to infinity there. Compute the limit definition directly rather than trusting how the curve looks.
