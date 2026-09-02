---
id: numerical-ode.common-traps
concept_id: numerical-ode
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

**Trap 1 — Local vs. global order.** Euler's *local* error per step is $O(h^2)$, but the *global* error after accumulating over many steps is $O(h)$. "Which order is Euler?" on GATE means global order — 1, not 2.

**Trap 2 — RK4 weight pattern.** The correct combination is $\frac{1}{6}(k_1+2k_2+2k_3+k_4)$ — students often drop the $2$'s and average all four equally, which is wrong; the $1,2,2,1$ weighting is what makes the fourth-order accuracy work.

**Trap 3 — Evaluating $k_2,k_3$ at the wrong time.** In RK4, $k_2$ and $k_3$ are evaluated at $t_n+h/2$, not $t_n$; $k_4$ is at $t_n+h$. Reusing $t_n$ for every $k_i$ silently collapses RK4 back toward Euler's accuracy.
