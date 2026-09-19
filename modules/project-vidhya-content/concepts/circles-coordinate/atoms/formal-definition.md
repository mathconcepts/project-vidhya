---
id: circles-coordinate.formal-definition
concept_id: circles-coordinate
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**General equation of a circle.** $x^2+y^2+2gx+2fy+c=0$, centre $(-g,-f)$, radius $r=\sqrt{g^2+f^2-c}$ (real only when $g^2+f^2-c>0$).

**Tangent and normal (already familiar).** Tangent at a point $(x_1,y_1)$ ON the circle: $xx_1+yy_1+g(x+x_1)+f(y+y_1)+c=0$. The normal at that same point passes through the centre.

**Chord of contact.** From an external point $(x_1,y_1)$ — where $S_1\equiv x_1^2+y_1^2+2gx_1+2fy_1+c>0$ — the line joining the two tangent-touch points is $T\equiv xx_1+yy_1+g(x+x_1)+f(y+y_1)+c=0$: the SAME expression as the tangent formula above, just evaluated at the external point instead of a point on the circle. Length of tangent from $(x_1,y_1)$ is $\sqrt{S_1}$; length of the chord of contact is $\dfrac{2r\sqrt{S_1}}{d}$, where $d$ is the distance from the centre to $(x_1,y_1)$.

**Radical axis.** For two circles $S_1\equiv x^2+y^2+2g_1x+2f_1y+c_1=0$ and $S_2\equiv x^2+y^2+2g_2x+2f_2y+c_2=0$ (same $x^2,y^2$ coefficient, so it cancels), the radical axis is $S_1-S_2=0$ — always a straight line, always perpendicular to the line joining the two centres. When the circles genuinely intersect, this line IS the common chord; when they do not, the radical axis still exists as a line, just without any real intersection points on it.

**Family of circles.** Through the two intersection points of $S_1=0$ and $S_2=0$: $S_1+\lambda S_2=0$ for $\lambda\neq-1$ (at $\lambda=-1$ this degenerates to the radical axis, which is not a circle). Through the intersection of a circle $S=0$ and a line $L=0$: $S+\lambda L=0$.

**Orthogonal circles.** $S_1=0$ and $S_2=0$ cut at right angles — their tangent lines at each intersection point are perpendicular — exactly when $2g_1g_2+2f_1f_2=c_1+c_2$.

**Method Selector.** Reach for chord of contact ($T=0$ at the external point) only when tangents are actually being drawn FROM a point TO the circle. Reach for radical axis ($S_1-S_2=0$) only when two DIFFERENT circles are involved — a common beginner mix-up is trying to subtract a circle's equation from a line's, which is not a defined operation here.
