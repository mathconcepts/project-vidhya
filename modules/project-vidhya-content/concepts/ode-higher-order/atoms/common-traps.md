---
id: ode-higher-order.common-traps
concept_id: ode-higher-order
atom_type: common_traps
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
tested_by_atom: ode-higher-order.micro-exercise
---

**Trap 1 — Stopping after the first root found.** A degree-$n$ auxiliary polynomial has $n$ roots; finding one by inspection (say $r=1$) and writing $y=Ce^x$ as if solved leaves $n-1$ roots undiscovered and the solution missing most of its constants.

**Trap 2 — Multiplying only one trig term for a repeated complex root.** For a double pair $\alpha\pm i\beta$, both $\cos\beta x$ and $\sin\beta x$ need the same $x$-power — $e^{\alpha x}[(A_1+A_2x)\cos\beta x+(B_1+B_2x)\sin\beta x]$, not $x$ on only one of them.

**Trap 3 — Losing track of how many constants the answer needs.** An $n$-th order equation always needs exactly $n$ arbitrary constants total, summed across every root's contribution — a quick count against $n$ catches a dropped term before it costs the whole problem.

**Trap 4 — Sign errors in synthetic division on a degree-$3$+ polynomial.** Once one root is found, dividing it out by hand is where most arithmetic slips happen; re-multiplying the quotient back against $(r-r_1)$ and comparing to the original polynomial is a cheap check.
