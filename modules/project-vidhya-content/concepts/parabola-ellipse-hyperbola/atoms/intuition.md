---
id: parabola-ellipse-hyperbola.intuition
concept_id: parabola-ellipse-hyperbola
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
---

Chord of contact and polar are the SAME idea you already have for circles — reused, not relearned. For any of these curves, tangent at a point $(x_2,y_2)$ ON it can always be written as some expression $T(x,y;x_2,y_2)=0$, linear in $x,y$. Suppose that tangent passes through an outside point $(x_1,y_1)$: plugging in gives $T(x_1,y_1;x_2,y_2)=0$. Swap the roles: this same equation, read the other way, says $(x_2,y_2)$ satisfies $T(x,y;x_1,y_1)=0$ when $x,y$ are set to $x_2,y_2$. The identical statement holds for the second touch point $(x_3,y_3)$. Two points satisfying one line — that line is the chord of contact, exactly the circle argument again.

For the parabola $y^2=4ax$: chord of contact from $(x_1,y_1)$ is $yy_1=2a(x+x_1)$. For the ellipse $\frac{x^2}{a^2}+\frac{y^2}{b^2}=1$: it is $\frac{xx_1}{a^2}+\frac{yy_1}{b^2}=1$. For the hyperbola $\frac{x^2}{a^2}-\frac{y^2}{b^2}=1$: it is $\frac{xx_1}{a^2}-\frac{yy_1}{b^2}=1$. Same substitution rule each time: $x^2\to xx_1$, $y^2\to yy_1$, $x\to\frac{x+x_1}{2}$, $y\to\frac{y+y_1}{2}$, applied to whichever curve's own equation you started with.
