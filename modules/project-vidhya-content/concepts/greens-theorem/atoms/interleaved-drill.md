---
id: greens-theorem.interleaved_drill
concept_id: greens-theorem
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: greens-theorem → divergence-curl.**

Let $\mathbf F=(xy,\ x^2,\ 0)$ — a planar field with no $z$-component and no $z$-dependence.

**Question 1 (divergence-curl):** Compute $\operatorname{curl}\mathbf F$ using the general 3-D formula.

*Answer:* $\operatorname{curl}\mathbf F=\left(\dfrac{\partial R}{\partial y}-\dfrac{\partial Q}{\partial z},\ \dfrac{\partial P}{\partial z}-\dfrac{\partial R}{\partial x},\ \dfrac{\partial Q}{\partial x}-\dfrac{\partial P}{\partial y}\right)=(0,\,0,\,2x-x)=(0,0,x)$ — the first two components vanish because $R=0$ everywhere and nothing here depends on $z$.

**Question 2 (greens-theorem):** Use Green's Theorem to evaluate $\oint_C xy\,dx+x^2\,dy$ where $C$ is the boundary of the unit square $[0,1]\times[0,1]$, counterclockwise.

*Answer:* $\oint_C xy\,dx+x^2\,dy=\iint_D x\,dA=\int_0^1\int_0^1 x\,dy\,dx=\dfrac12$ — exactly the $\hat k$-component of $\operatorname{curl}\mathbf F$ from Question 1, integrated over the square.

**Why this drill exists:** students learn divergence-curl's curl formula and Green's Theorem's density $\partial_xQ-\partial_yP$ as two unrelated facts to memorize separately, when the second is nothing but the $\hat k$-component of the first for a field with $R=0$ and no $z$-dependence — precisely the case Green's Theorem restricts itself to. Seeing both computations land on $x$ side by side, rather than meeting the shortcut formula on its own, is what stops a student from re-deriving Green's Theorem from scratch the next time a field happens to have a zero $z$-component.
