---
id: ode-second-order-homo.interleaved-drill
concept_id: ode-second-order-homo
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: ode-first-order → ode-second-order-homo.**

$y''-5y'+6y=0$, with the operator factored as $(D-2)(D-3)y=0$ where $D=d/dx$.

**Question 1 (build the first-order chain):** let $w=(D-3)y=y'-3y$. What first-order ODE does $w$ satisfy, and what is $w(x)$?

*Answer:* $(D-2)w=0$, i.e. $w'-2w=0$ — a plain first-order linear (in fact separable) ODE. Its solution is $w=Ae^{2x}$ for arbitrary constant $A$.

**Question 2 (solve the resulting first-order ODE for $y$):** using $w=Ae^{2x}$, solve $y'-3y=Ae^{2x}$ for $y$.

*Answer:* Linear first-order in $y$; integrating factor $\mu=e^{-3x}$. $\frac{d}{dx}(e^{-3x}y)=Ae^{-x}$, so $e^{-3x}y=-Ae^{-x}+C_1$, giving $y=-Ae^{2x}+C_1e^{3x}$. Renaming $-A=C_2$: $y=C_2e^{2x}+C_1e^{3x}$ — exactly the characteristic-equation answer for roots $r=2,3$.

**Why this drill exists:** factoring the operator turns a second-order homogeneous problem into two first-order linear problems solved back to back — the same integrating-factor skill from ode-first-order, applied twice. It shows the characteristic-equation shortcut isn't a separate trick; it's this reduction done in one step once you trust the pattern.
