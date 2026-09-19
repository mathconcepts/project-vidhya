---
id: parabola-ellipse-hyperbola.worked-example
concept_id: parabola-ellipse-hyperbola
atom_type: worked_example
bloom_level: 3
difficulty: 0.6
exam_ids: ["*"]
---

**Find the chord of contact of tangents drawn from $(10,8)$ to the ellipse $\dfrac{x^2}{25}+\dfrac{y^2}{16}=1$.**

**Step 1 — read off $a,b$ and confirm the point is genuinely outside.** Here $a^2=25$, $b^2=16$. A point is outside the ellipse when $S_1=\dfrac{x_1^2}{a^2}+\dfrac{y_1^2}{b^2}-1>0$. At $(10,8)$: $S_1=\dfrac{100}{25}+\dfrac{64}{16}-1=4+4-1=7>0$ — outside, so two real tangents genuinely exist.

**Step 2 — apply the $T$-substitution.** Chord of contact from $(x_1,y_1)$: $\dfrac{xx_1}{a^2}+\dfrac{yy_1}{b^2}=1$. With $(x_1,y_1)=(10,8)$: $\dfrac{10x}{25}+\dfrac{8y}{16}=1 \Rightarrow \dfrac{2x}{5}+\dfrac{y}{2}=1$. Multiplying through by $10$ to clear denominators: $4x+5y-10=0$.

**Step 3 — confirm it, don't just trust the substitution.** Solving the ellipse and this line together directly gives the two touch points $\left(\dfrac{5}{4}-\dfrac{5\sqrt7}{4},1+\sqrt7\right)$ and $\left(\dfrac{5}{4}+\dfrac{5\sqrt7}{4},1-\sqrt7\right)$. Both satisfy $\dfrac{x^2}{25}+\dfrac{y^2}{16}=1$ exactly (checked directly), confirming the line genuinely passes through two real points on the ellipse, not just an algebraic artefact.

**Step 4 — what changes for a different conic.** The SAME external point on the hyperbola $\dfrac{x^2}{25}-\dfrac{y^2}{9}=1$ instead would need $S_1=\dfrac{x_1^2}{a^2}-\dfrac{y_1^2}{b^2}-1$ checked against a DIFFERENT sign rule — for a hyperbola, two real tangents exist where $S_1<0$, the opposite convention from the ellipse and circle. Never carry the ellipse's ">0 means outside" rule over to a hyperbola question unchecked.

**Answer.**

$$\boxed{\text{Chord of contact: } 4x+5y-10=0}$$
