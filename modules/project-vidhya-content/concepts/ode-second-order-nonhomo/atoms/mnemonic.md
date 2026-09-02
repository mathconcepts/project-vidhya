---
id: ode-second-order-nonhomo.mnemonic
concept_id: ode-second-order-nonhomo
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**M.A.T.C.H.** for undetermined coefficients, in order:

- **M**atch $f(x)$ to a trial family (polynomial, exponential, sine/cosine).
- **A**re the roots colliding with it? Solve the characteristic equation and compare.
- **T**ack on an $x$ (or $x^2$) if they collide.
- **C**ompute the coefficients by substitution.
- **H**old onto $y_h$ — the final answer is $y_h+y_p$, never $y_p$ alone.

**Worked micro-example:** $y''-4y=e^{2x}$. Match: exponential family, trial $Ae^{2x}$. Are roots colliding? $r^2-4=0\Rightarrow r=\pm2$ — yes, $2$ is a root. Tack on $x$: try $Axe^{2x}$. Compute: substituting gives $A=\tfrac14$, so $y_p=\tfrac{x}{4}e^{2x}$. Hold onto $y_h=C_1e^{2x}+C_2e^{-2x}$.

**Sanity-check reflex:** plug your finished $y_p$ back into the ODE by itself — if it doesn't reproduce $f(x)$ exactly, a step in M.A.T.C.H. was skipped.
