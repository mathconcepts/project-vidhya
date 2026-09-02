---
id: numerical-linear-algebra.interleaved-drill
concept_id: numerical-linear-algebra
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: numerical-linear-algebra → numerical-error-analysis.**

$A=\begin{pmatrix}1&1\\1&1.0001\end{pmatrix}$ has $\det A=0.0001$ (nearly singular) and $\kappa(A)\approx4\times10^4$.

**Q1.** If $b$ carries a relative error of $10^{-6}$ (from rounding a measured quantity), what is the resulting bound on the relative error in the computed $x$?
**A1.** Using $\|\delta x\|/\|x\|\le\kappa(A)\cdot\|\delta b\|/\|b\|$: bound $\approx(4\times10^4)(10^{-6})=0.04$, i.e. up to $4\%$ relative error in $x$ from a $b$ error a thousand times smaller.

**Q2.** How many decimal digits of accuracy does this cost, roughly?
**A2.** $\kappa(A)\approx10^{4.6}$, so roughly $4$–$5$ significant digits are lost — a computation carried to 10 correct digits in $b$ can trust only about 5–6 digits in $x$.

**Why this drill exists:** students treat "small residual" as proof a solution is accurate, missing that condition number — not the elimination arithmetic — is what actually bounds how much a tiny input error can grow.
