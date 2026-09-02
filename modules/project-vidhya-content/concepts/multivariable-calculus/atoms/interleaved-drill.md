---
id: multivariable-calculus.interleaved_drill
concept_id: multivariable-calculus
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: chain-rule → multivariable-calculus.**

**Q1 (chain rule, single variable).** Differentiate $h(t)=\sin(t^2)$.

**A1.** $h'(t)=\cos(t^2)\cdot2t=2t\cos(t^2)$.

**Q2 (multivariable calculus).** Now treat $z=uv$ with $u=t^2$, $v=t$ as a two-variable composition, and find $dz/dt$ at $t=1$ using the multivariable chain rule.

**A2.** $\dfrac{\partial z}{\partial u}=v$, $\dfrac{\partial z}{\partial v}=u$, $\dfrac{du}{dt}=2t$, $\dfrac{dv}{dt}=1$.
$$
\frac{dz}{dt}=v(2t)+u(1)=t(2t)+t^2=3t^2.
$$
At $t=1$: $dz/dt=3$.
$$
\boxed{\left.\frac{dz}{dt}\right|_{t=1}=3}
$$

**Verification.** Directly, $z=uv=t^2\cdot t=t^3$, so $dz/dt=3t^2$ — matching without the chain rule at all, and confirming the two-term sum was assembled correctly.

**Why this drill exists.** Having just practiced the single-variable chain rule (ONE inner function, ONE term), it's tempting to keep using only one term when the composition actually has TWO moving inner variables — dropping the $u\cdot dv/dt$ term here would report $2t^2$ instead of $3t^2$, an error invisible unless cross-checked against the direct substitution $z=t^3$.
