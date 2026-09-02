---
id: numerical-ode.interleaved-drill
concept_id: numerical-ode
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: numerical-ode → root-finding.**

Implicit Euler for $\frac{dy}{dt}=-y^2$, $y(0)=1$, step $h=0.5$: the update is $y_1=y_0+h\,f(t_1,y_1)=1-0.5\,y_1^2$, an equation for $y_1$ that involves $y_1$ on both sides.

**Q1.** Rearranged, this is $0.5y_1^2+y_1-1=0$ — solve for the positive root.
**A1.** By the quadratic formula, $y_1=\dfrac{-1+\sqrt{1+2}}{1}=\sqrt3-1\approx0.7321$ (the negative root, $\approx-2.732$, is discarded since $y$ stays positive here).

**Q2.** For a nonlinear right-hand side where the quadratic formula doesn't apply — say $f(y)=-y^3$ instead of $-y^2$ — how would you actually find $y_1$ from $y_1=1-0.5y_1^3$?
**A2.** Rearrange to $g(y_1)=y_1-1+0.5y_1^3=0$ and hand it to Newton-Raphson: exactly the root-finding machinery, applied once per implicit step.

**Why this drill exists:** students treat "implicit method" as just a label to memorize, missing that every implicit step is a root-finding problem in disguise — solvable by hand only when the algebra happens to be quadratic, and by Newton-Raphson otherwise.
