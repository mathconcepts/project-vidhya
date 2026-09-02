---
id: numerical-integration.common-traps
concept_id: numerical-integration
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

**Trap 1 — Forgetting the composite multiplier.** Simpson's weights $[1,4,2,4,\dots,2,4,1]$ apply to the *composite* (repeated) rule. A single application over just two subintervals is $\frac{h}{3}[f_0+4f_1+f_2]$ — no repeating 2's yet, since there's only one interior node.

**Trap 2 — Confusing subintervals with nodes.** $n$ subintervals means $n+1$ nodes. "Divide into 4 subintervals" needs 5 function evaluations, not 4 — using 4 gives the wrong $h$.

**Trap 3 — Weight arithmetic slips.** Simpson's interior weights alternate $4,2,4,2,\dots$ (ends are always $1$). Writing a $2$ where a $4$ belongs propagates through the whole sum.
