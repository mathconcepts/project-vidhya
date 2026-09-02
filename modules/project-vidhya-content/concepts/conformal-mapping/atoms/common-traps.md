---
id: conformal-mapping.common-traps
concept_id: conformal-mapping
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Confusing "analytic" with "conformal".** A function is analytic if it's complex-differentiable (Cauchy-Riemann holds). It is **conformal** only if it's analytic **and** $f'(z)\neq0$. $f(z)=z^2$ is analytic everywhere but NOT conformal at $z=0$, where $f'(0)=0$.

**Trap 2 — Forgetting angle preservation is local.** Conformal maps preserve angles only in a small neighborhood around a point; they can distort global shapes dramatically. $e^z$ maps the entire plane conformally onto $\mathbb{C}\setminus\{0\}$ — a huge global change in shape, with every local angle still preserved.

**Trap 3 — Skipping the derivative check.** When asked whether a map is conformal, always verify $f'(z)\neq0$ at the point in question, not just analyticity. A zero derivative means the map is NOT conformal there, no matter how well-behaved $f$ looks otherwise.
