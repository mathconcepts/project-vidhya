---
id: parabola-ellipse-hyperbola.common-traps
concept_id: parabola-ellipse-hyperbola
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: parabola-ellipse-hyperbola.micro-exercise
---

**Trap 1 — Carrying the ellipse's "$S_1>0$ means outside" rule over to a hyperbola unchanged.** For a hyperbola, the region from which two real tangents can be drawn is where $S_1<0$ — the OPPOSITE sign convention. Confirmed directly: for $\frac{x^2}{25}-\frac{y^2}{9}=1$, the point $(8,0)$ has $S_1=1.56>0$ yet has zero real tangent lines at all, while $(4,3)$ has $S_1=-1.36<0$ and genuinely has two.

**Trap 2 — Assuming every hyperbola has a director circle.** $x^2+y^2=a^2-b^2$ is only real when $a>b$. A rectangular hyperbola ($a=b$) has no director circle at all — no point in the plane admits two mutually perpendicular tangents to it, which feels backwards until you check the formula directly.

**Trap 3 — Confusing director circle with auxiliary circle.** They share the word "circle" and nothing else. Auxiliary circle ($x^2+y^2=a^2$) is a construction tool for the parametric form, built from ONE curve; director circle ($x^2+y^2=a^2+b^2$ for an ellipse) is a locus built from PAIRS of perpendicular tangents. Neither one substitutes for the other in a formula.

**Trap 4 — Applying the $T$-substitution with the wrong sign for a hyperbola.** The rule is $x^2\to xx_1$, $y^2\to yy_1$ — but the hyperbola's OWN equation already carries a minus sign on the $y^2$ term. Writing $\frac{xx_1}{a^2}+\frac{yy_1}{b^2}=1$ for a hyperbola (copying the ellipse's $+$ sign instead of keeping the hyperbola's own $-$) gives a line for the wrong curve entirely.

**Trap 5 — Looking for perpendicular parabola tangents to meet on the axis or at the focus.** They meet on the DIRECTRIX, $x=-a$ — a fact that holds for every pair of perpendicular slopes, not a special case near the vertex.
