---
id: pde-basics.interleaved_drill
concept_id: pde-basics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: pde-basics → ode-second-order-homo.**

Separation always hands off a second-order linear homogeneous ODE with constant coefficients — $X''+\lambda X=0$ — and its solution shape is fixed entirely by the sign of $\lambda$, the same way a discriminant fixes it for any standalone ODE of this form.

**Question 1 (pde-basics):** Separating $u_t=u_{xx}$ with $u(0,t)=u(\pi,t)=0$ produces $X''+9X=0$. What is the general solution for $X(x)$?

*Answer:* Characteristic equation $r^2+9=0$ gives $r=\pm3i$ — a complex-conjugate pair. $X(x)=A\cos(3x)+B\sin(3x)$.

**Question 2 (ode-second-order-homo):** The same substitution instead produces $X''-9X=0$ (i.e. $\lambda=-9$). What is the general solution, and does it survive zero boundary data at two points without collapsing to trivial?

*Answer:* Characteristic equation $r^2-9=0$ gives $r=\pm3$ — two real, distinct roots. $X(x)=Ae^{3x}+Be^{-3x}$, growing and decaying, no oscillation. Forcing $X(0)=X(L)=0$ drives both constants to zero, so only the trivial solution fits.

**Why this drill exists:** a student drilled on characteristic-root cases in isolation still tends to assume $X''+\lambda X=0$ always gives sines and cosines, since that's the case every textbook example uses. The case split on $\lambda$'s sign — complex roots, real distinct roots, a repeated root — is ODE material already owned; the miss is not reaching for it once that equation sits inside a PDE separation step.
