---
id: ode-exact.interleaved-drill
concept_id: ode-exact
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: ode-exact → ode-first-order.**

$y\,dx + 2x\,dy = 0$.

**Question 1 (exactness):** is this exact? If not, find an integrating factor.

*Answer:* $M=y$, $N=2x$. $M_y=1$, $N_x=2$ — unequal, not exact. But $\dfrac{M_y-N_x}{N} = \dfrac{1-2}{2x} = -\dfrac{1}{2x}$ depends on $x$ alone, so an integrating factor $\mu(x)$ exists: $\mu(x) = e^{\int -\frac{1}{2x}\,dx} = x^{-1/2}$.

**Question 2 (first-order link):** notice that $\mu(x)$ was built with the exact same formula, $e^{\int(\cdot)\,dx}$, used for a linear first-order ODE's integrating factor. Confirm the repaired equation is now exact, and solve it.

*Answer:* Multiplying through: $x^{-1/2}y\,dx + 2x^{1/2}\,dy=0$. Now $M_y = x^{-1/2} = N_x$ ✓ exact. $F = \int x^{-1/2}y\,dx = 2y\sqrt{x} + g(y)$; $\partial F/\partial y = 2\sqrt{x}+g'(y) = N' = 2\sqrt{x} \Rightarrow g'(y)=0$. Solution: $y\sqrt{x}=C$ — matching the separable solve of the equivalent equation $\dfrac{dy}{dx} = -\dfrac{y}{2x}$.

**Why this drill exists:** the exactness-repair integrating factor and the linear-ODE integrating factor are the *same construction* — $e^{\int(\cdot)\,dx}$ — applied to different equations. Treating them as two unrelated formulas to memorize is the exact confusion this drill is built to catch.
