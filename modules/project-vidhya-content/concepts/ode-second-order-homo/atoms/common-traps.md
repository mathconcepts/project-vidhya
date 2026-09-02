---
id: ode-second-order-homo.common-traps
concept_id: ode-second-order-homo
atom_type: common_traps
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
tested_by_atom: ode-second-order-homo.micro-exercise
---

**Trap 1 — Forgetting the $x$ on a repeated root.** With $\Delta=0$ students often write $y=C_1e^{rx}+C_2e^{rx}$, which is really $(C_1+C_2)e^{rx}$ — one constant in disguise, not two. The second solution is $xe^{rx}$; skip it and a two-condition IVP/BVP becomes unsolvable, since one constant can't satisfy two conditions.

**Trap 2 — Sign error building the characteristic equation from a rearranged ODE.** $y''-4y'+3y=0$ becomes $r^2-4r+3=0$, but the same equation written as $4y'-y''-3y=0$ tempts a hasty $4r-r^2-3=0$; always move every term to one side with $y''$'s coefficient positive first.

**Trap 3 — Reading $\alpha$ and $\beta$ off the wrong parts.** For $\alpha\pm i\beta$, the decay lives in $e^{\alpha x}$ and the oscillation in $\cos(\beta x),\sin(\beta x)$. Swapping which number goes where gives a solution that satisfies no actual ODE.

**Trap 4 — Assuming any two exponentials are independent.** $e^{2x}$ and $C\cdot e^{2x}$ are the same solution scaled, not two independent ones — independence requires genuinely different roots (or the $x$-multiplied pair for a repeated root).
