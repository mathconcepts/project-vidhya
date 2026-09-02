---
id: ode-exact.mnemonic
concept_id: ode-exact
atom_type: mnemonic
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
modality: mnemonic
---

**"$M_y = N_x$, exact as text."** Write the equation as $M\,dx + N\,dy=0$, cross-differentiate ($M$ with respect to $y$, $N$ with respect to $x$), and if the two match, the equation is exact.

**If they don't match, ask ONE ratio, not two:** compute $\dfrac{M_y-N_x}{N}$ — if it depends on $x$ alone, $\mu(x) = e^{\int \frac{M_y-N_x}{N}\,dx}$ repairs it. If that ratio still has $y$ in it, flip and try $\dfrac{N_x-M_y}{M}$ instead — if *that* depends on $y$ alone, $\mu(y) = e^{\int \frac{N_x-M_y}{M}\,dy}$ repairs it.

**Worked micro-example:** for $y\,dx + 2x\,dy=0$, $M_y=1$, $N_x=2$ — not exact. $\dfrac{M_y-N_x}{N} = \dfrac{-1}{2x}$, a function of $x$ alone, so $\mu(x)=e^{\int -\frac{1}{2x}dx}=x^{-1/2}$ fixes it.

**Sanity-check reflex:** after finding $F(x,y)=C$, differentiate it once with respect to $x$ (holding the implicit $y(x)$) and confirm the original $M\,dx+N\,dy=0$ falls back out.
