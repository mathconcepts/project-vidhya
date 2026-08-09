---
id: numerical-ode.common-traps
concept_id: numerical-ode
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Order confusion**: Students mix up local truncation error (LTE) with global truncation error (GTE). LTE is what happens in one step; GTE is the cumulative error. For Euler, LTE is $O(h^2)$ but GTE is $O(h)$ because there are many steps. A question asking "which method is 2nd order?" expects the answer to refer to GTE order, which is 2 for Heun/RK2 but only 1 for Euler.
- **RK4 coefficient arithmetic**: The weights in RK4 are $\frac{1}{6}(k_1 + 2k_2 + 2k_3 + k_4)$. Students often write $\frac{1}{6}(k_1 + k_2 + k_3 + k_4)$ (equal weights), which is wrong. The 2-2-1 pattern is critical.
- **Forgetting to advance $t$**: Some students compute $k_2, k_3, k_4$ at the same time $t_n$ as $k_1$, forgetting that each $k$ is evaluated at a different time. For RK4, $k_2$ and $k_3$ are at $t_n + h/2$, while $k_4$ is at $t_n + h$. Forgetting this completely changes the answer.
