---
id: ode-higher-order.interleaved-drill
concept_id: ode-higher-order
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: ode-second-order-nonhomo → ode-higher-order.**

$y'''-6y''+11y'-6y=e^{4x}$ (same left side as the worked example, roots $1,2,3$).

**Question 1 (resonance-check skill, extended):** does the forcing term $e^{4x}$ collide with a homogeneous root?

*Answer:* No — the roots are $1,2,3$, and $4$ is not among them, so the plain trial $y_p=Ae^{4x}$ is safe. The resonance check from second-order forcing generalizes unchanged: compare the forcing exponent against the FULL list of roots, however many there are.

**Question 2 (solve for the coefficient):** find $A$.

*Answer:* For a plain exponential trial against a constant-coefficient operator, substituting $y_p=Ae^{4x}$ always gives $A\cdot P(4)e^{4x}$, where $P(r)=r^3-6r^2+11r-6$ is the same auxiliary polynomial evaluated at the forcing exponent. $P(4)=64-96+44-6=6$, so $6A=1\Rightarrow A=\tfrac16$, giving $y_p=\tfrac16e^{4x}$.

**Why this drill exists:** the "is it a root?" test from second-order forcing doesn't change shape at higher order — it's still one number ($P(\text{exponent})$) that's either zero (resonance, needs an $x$-multiplier) or not (plain trial works); only the length of the root list to check against grows.
