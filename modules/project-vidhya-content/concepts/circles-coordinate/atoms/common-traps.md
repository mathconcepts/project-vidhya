---
id: circles-coordinate.common-traps
concept_id: circles-coordinate
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: circles-coordinate.micro-exercise
---

**Trap 1 — Applying $T=0$ without checking the point is outside.** $xx_1+yy_1+g(x+x_1)+f(y+y_1)+c=0$ produces a straight line for ANY $(x_1,y_1)$ you feed it — including points strictly inside the circle, where no real tangent touches it at all. Confirmed: for $x^2+y^2-2x-4y-4=0$, the point $(0,1)$ gives $S_1=-7<0$ (inside), yet $T=0$ still outputs a well-defined line — that line is a polar, not a genuine chord of contact.

**Trap 2 — Mixing up $2g$ and $g$.** The general circle is written with $2g$ and $2f$ ($x^2+y^2+2gx+2fy+c=0$), but the centre is $(-g,-f)$, not $(-2g,-2f)$. Copying the coefficient of $x$ straight into the centre without halving it first is one of the most common slips on this whole topic.

**Trap 3 — Treating $S_1-S_2=0$ as the common chord even when the circles don't meet.** Radical axis always exists as a straight line, perpendicular to the line joining the two centres, whether or not the circles actually intersect. It is only a genuine common CHORD — with two real points on it — when the circles do intersect; otherwise it is a valid line with no real points of either circle sitting on it.

**Trap 4 — Using $S_1+\lambda S_2=0$ at $\lambda=-1$.** This value cancels the $x^2$ and $y^2$ terms entirely, collapsing the "family of circles" formula into the radical axis — a straight line, not a circle. Any problem phrased "find the CIRCLE through the intersection satisfying..." has implicitly excluded $\lambda=-1$ from the start.

**Trap 5 — Skipping the "same $x^2,y^2$ coefficient" check before subtracting two circles.** $S_1-S_2$ only produces a straight line, radical-axis-style, when both circles are already written with coefficient $1$ on $x^2$ and $y^2$. Subtracting two circle equations that have not been normalised to coefficient $1$ first leaves a leftover quadratic term, and the result is not the radical axis at all.
