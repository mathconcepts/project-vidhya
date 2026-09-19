---
id: straight-lines.common-traps
concept_id: straight-lines
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: straight-lines.micro-exercise
---

**Trap 1 — Skipping the same-sign check on $c_1,c_2$.** The rule "$-$ sign gives the acute bisector when $a_1a_2+b_1b_2>0$" only holds once $c_1$ and $c_2$ have been made the same sign, by multiplying one whole equation by $-1$ if needed. Apply the rule with mismatched signs and the acute/obtuse labels come out swapped — the arithmetic is otherwise identical, so nothing else warns you it went wrong.

**Trap 2 — Equating the lines without normalising first.** Writing $a_1x+b_1y+c_1=\pm(a_2x+b_2y+c_2)$ directly, skipping the division by $\sqrt{a^2+b^2}$, gives some line through the same crossing point — but not a bisector, unless both denominators happen to be equal (like $5$ and $5$ in a symmetric example). The division is what turns each side into an actual perpendicular distance, which is the only thing a bisector genuinely balances.

**Trap 3 — Treating $L_1+\lambda L_2=0$ as solvable with no extra condition.** This is a one-parameter FAMILY, not a single line. A question that gives you $L_1$ and $L_2$ and nothing else has not yet told you enough to find one specific member — some third fact (a point, a parallel or perpendicular direction) is what fixes $\lambda$.

**Trap 4 — Trusting $\Delta=0$ alone for a pair of straight lines.** $\Delta=abc+2fgh-af^2-bg^2-ch^2=0$ is necessary, but by itself it can describe a pair of IMAGINARY lines meeting at one real point, not two real lines you can actually draw. $h^2\ge ab$ is the second condition that must also hold — checked and confirmed: $a=1,h=1,b=2,g=1,f=1,c=1$ satisfies $\Delta=0$ exactly, yet the expression only factors into two complex-conjugate lines, because $h^2-ab=-1<0$.

**Trap 5 — Forgetting the $a+b=0$ special case in the pair's angle formula.** $\tan\theta=\dfrac{2\sqrt{h^2-ab}}{|a+b|}$ divides by zero exactly when the pair is perpendicular. Spot $a+b=0$ first and state "perpendicular" directly — do not try to force a $\tan\theta$ number out of a division by zero.
