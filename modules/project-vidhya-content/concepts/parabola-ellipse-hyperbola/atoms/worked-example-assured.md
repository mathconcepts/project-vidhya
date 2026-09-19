---
id: parabola-ellipse-hyperbola.worked-example-assured
concept_id: parabola-ellipse-hyperbola
atom_type: worked_example
bloom_level: 3
difficulty: 0.6
exam_ids: ["*"]
variant_of: parabola-ellipse-hyperbola.worked-example
for_stance: assured
---

Ellipse $\frac{x^2}{25}+\frac{y^2}{16}=1$, external point $(10,8)$: $S_1=4+4-1=7>0$, so chord of contact $\frac{10x}{25}+\frac{8y}{16}=1 \Rightarrow 4x+5y-10=0$, confirmed against the actual touch points on the curve.

**Where this genuinely diverges by conic — never assume the sign test transfers.** Swap the ellipse for the hyperbola $\frac{x^2}{25}-\frac{y^2}{9}=1$ and keep the SAME point-style check, $S_1=\frac{x_1^2}{25}-\frac{y_1^2}{9}-1$: a point with $S_1>0$ (e.g. $(8,0)$, giving $S_1=1.56$) turns out to have ZERO real tangent lines at all — verified directly by solving for tangent slopes through it and finding the discriminant-in-$m$ equation never touches zero. A point with $S_1<0$ instead, like $(4,3)$ ($S_1=-1.36$), genuinely has two real tangents. The hyperbola's "outside, two tangents" region is where $S_1<0$ — the mirror image of the ellipse's rule, not an extension of it.

For a parabola, the analogous test is simpler and does behave like the ellipse: $S_1=y_1^2-4ax_1>0$ means outside, two real tangents — confirmed on $(1,4)$ against $y^2=8x$, giving $S_1=8>0$ and a genuine two-tangent chord of contact, $y=x+1$.
