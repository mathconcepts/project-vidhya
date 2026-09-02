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

**Worked micro-example.** An RL circuit gives $i' + 5i = 10$, $i(0)=0$. Transform: $sI+5I=10/s \Rightarrow I(s)=\dfrac{10}{s(s+5)}$. Solve/invert by cover-up: $A=2$ at $s=0$, $B=-2$ at $s=-5$, so $i(t)=2(1-e^{-5t})$. Check with step 4 before trusting it: $\lim_{s\to0}sI(s) = \dfrac{10}{5}=2$, matching the steady-state value $i(t)\to2$ read off the inverted answer.

**Sanity-check reflex:** the final-value theorem answer and the $t\to\infty$ limit of your inverted $y(t)$ must agree exactly — if they don't, the error is in step 2 or 3, not in the theorem.
