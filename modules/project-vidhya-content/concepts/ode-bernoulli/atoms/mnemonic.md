---
id: ode-bernoulli.mnemonic
concept_id: ode-bernoulli
atom_type: mnemonic
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: mnemonic
---

**"Flip the power to $1-n$."** Spot $y' + P(x)y = Q(x)y^n$, read off $n$ from the power on $y$ on the right, and set $v = y^{1-n}$ — the exponent on $v$ is always one minus the exponent you just read.

**Worked micro-example:** $\dfrac{dy}{dx} - \dfrac{y}{x} = xy^3$. Here $n = 3$, so $v = y^{1-3} = y^{-2}$, and $\dfrac{dv}{dx} = -2y^{-3}\dfrac{dy}{dx}$. Dividing the original by $y^3$: $y^{-3}y' - \frac{1}{x}y^{-2} = x$. Multiply by $-2$: $-2y^{-3}y' + \frac{2}{x}y^{-2} = -2x$, i.e. $\dfrac{dv}{dx} + \dfrac{2}{x}v = -2x$ — linear in $v$, solvable by the usual integrating factor.

**Sanity-check reflex:** before substituting anything, check $n \neq 0, 1$ — those two cases are already linear or already separable, and running the Bernoulli machinery on them just wastes time re-deriving what a simpler method gives directly.
