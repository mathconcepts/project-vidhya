---
id: parabola-ellipse-hyperbola.mnemonic
concept_id: parabola-ellipse-hyperbola
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Same $x$, squashed $y$."** For the ellipse's parametric point $(a\cos\theta,b\sin\theta)$: the $x$-coordinate is exactly the auxiliary circle's own $x$-coordinate, $a\cos\theta$ — untouched. Only the $y$-coordinate gets scaled down, from the circle's $a\sin\theta$ to the ellipse's $b\sin\theta$, by the fixed factor $b/a$.

For the hyperbola's $(a\sec\theta,b\tan\theta)$, remember it instead from $\sec^2\theta-\tan^2\theta=1$ — the identity is chosen so that plugging the point straight back into $\frac{x^2}{a^2}-\frac{y^2}{b^2}$ collapses to exactly $\sec^2\theta-\tan^2\theta=1$, with nothing left to simplify.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag the eccentric angle θ — the ellipse point and its auxiliary-circle twin share an x-coordinate","why":"Every ellipse point (a cosθ, b sinθ) is the auxiliary circle's own point (a cosθ, a sinθ) squashed vertically by b/a — that is what an eccentric angle actually is.","inputs":[{"id":"theta","label":"θ (radians)","min":0,"max":6.28,"step":0.02,"initial":0.52}],"outputs":[{"label":"shared x = a cosθ (a=5)","formula":"5*cos(theta)","digits":3},{"label":"ellipse height y = b sinθ (b=3)","formula":"3*sin(theta)","digits":3},{"label":"auxiliary-circle height y = a sinθ","formula":"5*sin(theta)","digits":3},{"label":"check: (x/5)² + (ellipse height/3)² (always 1)","formula":"(5*cos(theta))^2/25 + (3*sin(theta))^2/9","digits":4}],"caption":"At θ=0.52 rad (about 30°): shared x≈4.34, ellipse height≈1.49, auxiliary-circle height≈2.48 — ratio exactly 3/5=b/a, and the check stays at 1.0000 wherever you drag θ."}
```
