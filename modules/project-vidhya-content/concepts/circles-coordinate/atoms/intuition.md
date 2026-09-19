---
id: circles-coordinate.intuition
concept_id: circles-coordinate
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
---

Here is the whole derivation, from scratch, no formula assumed. Take circle $x^2+y^2=a^2$ and let the two (unknown) touch points be $A(x_2,y_2)$ and $B(x_3,y_3)$. The tangent to the circle AT a point $(x_2,y_2)$ on it is the standard $xx_2+yy_2=a^2$.

Now suppose both of those tangents pass through the SAME outside point $P(x_1,y_1)$. Plugging $P$ into the tangent at $A$: $x_1x_2+y_1y_2=a^2$. Plugging $P$ into the tangent at $B$: $x_1x_3+y_1y_3=a^2$.

Look closely at both equations — they say exactly the same thing, just with $(x_2,y_2)$ swapped for $(x_3,y_3)$. That means BOTH points $A$ and $B$ satisfy one single equation: $x_1x+y_1y=a^2$. A straight line is completely fixed by any two points on it — so this one equation, $x_1x+y_1y=a^2$, IS the line through $A$ and $B$. No coordinates of $A$ or $B$ were ever computed.

The general circle $x^2+y^2+2gx+2fy+c=0$ works by the identical argument, just with the fuller tangent formula: chord of contact from $(x_1,y_1)$ is $xx_1+yy_1+g(x+x_1)+f(y+y_1)+c=0$.
