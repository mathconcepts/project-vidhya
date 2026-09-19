---
id: parabola-ellipse-hyperbola.formal-definition
concept_id: parabola-ellipse-hyperbola
atom_type: formal_definition
bloom_level: 2
difficulty: 0.5
exam_ids: ["*"]
---

**Standard equations and parametric forms.** Parabola $y^2=4ax$: parametric point $(at^2,2at)$; focus $(a,0)$; directrix $x=-a$. Ellipse $\dfrac{x^2}{a^2}+\dfrac{y^2}{b^2}=1$ ($a>b$): parametric point $(a\cos\theta,b\sin\theta)$; eccentricity $e=\sqrt{1-\frac{b^2}{a^2}}$; foci $(\pm ae,0)$. Hyperbola $\dfrac{x^2}{a^2}-\dfrac{y^2}{b^2}=1$: parametric point $(a\sec\theta,b\tan\theta)$; eccentricity $e=\sqrt{1+\frac{b^2}{a^2}}$; foci $(\pm ae,0)$.

**Focus-directrix definition.** Every one of these three curves is the locus of a point whose distance to a fixed focus, divided by its distance to a fixed directrix line, equals a constant $e$: $e=1$ parabola, $e<1$ ellipse, $e>1$ hyperbola.

**Tangent and normal (already familiar).** At a point on the curve, each has its own standard tangent equation — the parametric-form tangent for each is used to build every result below.

**Chord of contact / polar**, from an external point $(x_1,y_1)$: obtained by the $T$-substitution ($x^2\to xx_1$, $y^2\to yy_1$, $x\to\frac{x+x_1}{2}$, $y\to\frac{y+y_1}{2}$) applied to the curve's own equation. Parabola: $yy_1=2a(x+x_1)$. Ellipse: $\frac{xx_1}{a^2}+\frac{yy_1}{b^2}=1$. Hyperbola: $\frac{xx_1}{a^2}-\frac{yy_1}{b^2}=1$. "Pole" and "polar" are the two ends of this same relationship: the polar of a point is this line; the pole of a line is the point it came from.

**Director circle** — the locus of the intersection of two mutually perpendicular tangents. Ellipse: $x^2+y^2=a^2+b^2$. Hyperbola: $x^2+y^2=a^2-b^2$, real only when $a>b$ (no real director circle exists when $a\le b$, and it degenerates to a single point at the centre when $a=b$). The parabola has none; instead, perpendicular tangents to $y^2=4ax$ always meet exactly on the directrix $x=-a$, for every pair of perpendicular slopes.

**Auxiliary circle** (ellipse only) — the circle $x^2+y^2=a^2$ drawn on the major axis. Every ellipse point $(a\cos\theta,b\sin\theta)$ corresponds to the auxiliary-circle point $(a\cos\theta,a\sin\theta)$ at the same eccentric angle $\theta$, related by a vertical scaling of factor $b/a$.

**Method Selector.** Use the $T$-substitution for chord of contact/polar only when a point is genuinely OUTSIDE the curve — the same $S_1>0$-style check used for circles applies here too, and for a hyperbola specifically, the region admitting two real tangents is NOT simply "$S_1>0$" the way it is for an ellipse or circle; verify with the actual tangent-line discriminant when in doubt, not by pattern-matching the ellipse rule.
