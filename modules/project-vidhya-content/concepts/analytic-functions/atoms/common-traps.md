---
id: analytic-functions.common-traps
concept_id: analytic-functions
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Sign error in Cauchy-Riemann.** Students often write $u_y=v_x$ instead of $u_y=-v_x$, dropping the minus sign. That sign encodes the $90°$ rotation built into complex multiplication — dropping it isn't a cosmetic slip, it changes which functions pass the test.

**Trap 2 — Assuming smooth $u,v$ implies analytic.** Continuous partial derivatives on $u$ and $v$ separately guarantee nothing about $f=u+iv$. $g(z)=|z|^2=x^2+y^2$ has continuous partials everywhere, yet CR fails except at the origin — $g$ is analytic nowhere.

**Trap 3 — Confusing analytic with holomorphic.** In GATE usage these are interchangeable. "Analytic" and "holomorphic" both mean complex-differentiable in a neighbourhood — don't let the terminology switch read as a different requirement.
