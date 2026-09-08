---
id: laplace-applications.mnemonic
concept_id: laplace-applications
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**The device: TSIC — Transform, Solve, Invert, Check.** Four steps, always in this order, for any linear constant-coefficient ODE with given initial conditions:

1. **T**ransform both sides, folding initial conditions into $\mathcal{L}\{y'\}$, $\mathcal{L}\{y''\}$.
2. **S**olve the resulting algebraic equation for $Y(s)$.
3. **I**nvert using partial fractions and the table.
4. **C**heck the answer against the final-value theorem — no inversion needed for this step.

**Worked micro-example.** The concept's own running example, $y'+3y=0$, $y(0)=2$. **T**ransform: $sY-2+3Y=0\Rightarrow Y(s)=\dfrac{2}{s+3}$. **S**olve: already done — one algebra line, no separate step needed here. **I**nvert using the table: $y(t)=2e^{-3t}$. **C**heck with step 4 before trusting it: $\lim_{s\to0}sY(s)=\dfrac{2\cdot0}{0+3}=0$, matching the steady-state value $y(t)\to0$ read off the inverted answer — the same fade to zero the hook's animation already showed.

**Sanity-check reflex:** the final-value theorem answer and the $t\to\infty$ limit of your inverted $y(t)$ must agree exactly — if they don't, the error is in step 2 or 3, not in the theorem.
