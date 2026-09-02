---
id: ode-bernoulli.interleaved-drill
concept_id: ode-bernoulli
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: ode-bernoulli → ode-exact.**

$\dfrac{dy}{dx} - y = xy^2$.

**Question 1 (Bernoulli):** solve this using the Bernoulli substitution ($n=2$).

*Answer:* $v = y^{-1}$, $\frac{dv}{dx} = -y^{-2}y'$. Dividing by $y^2$: $y^{-2}y' - y^{-1} = x$, so $-\frac{dv}{dx} - v = x$, i.e. $\frac{dv}{dx} + v = -x$ — linear. Integrating factor $\mu=e^x$: $\frac{d}{dx}(ve^x) = -xe^x$, and $\int -xe^x\,dx = -xe^x + e^x + C$, so $v = -x + 1 + Ce^{-x}$. Back-substituting $v=1/y$: $y = \dfrac{1}{1-x+Ce^{-x}}$.

**Question 2 (exactness check):** rewrite the same equation as $M\,dx + N\,dy = 0$ and check whether it's exact *without* substituting anything.

*Answer:* $-y-xy^2)\,dx + dy = 0$, so $M = -y-xy^2$, $N=1$. $\partial M/\partial y = -1-2xy$, $\partial N/\partial x = 0$ — unequal, not exact, and $(M_y-N_x)/N = -1-2xy$ depends on both $x$ and $y$, so no simple integrating factor $\mu(x)$ or $\mu(y)$ exists either.

**Why this drill exists:** exactness fails here precisely *because* the nonlinearity is a pure power of $y$ tangled into $M$ itself — that's the signal to recognize a Bernoulli equation and substitute, rather than searching for an integrating factor that doesn't exist.
