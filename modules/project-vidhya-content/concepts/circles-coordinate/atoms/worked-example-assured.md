---
id: circles-coordinate.worked-example-assured
concept_id: circles-coordinate
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
variant_of: circles-coordinate.worked-example
for_stance: assured
---

Circle $x^2+y^2-2x-4y-4=0$ ($g=-1,f=-2,c=-4$, centre $(1,2)$, $r=3$); external point $(7,1)$ ($S_1=28>0$, confirmed outside). $T=0$: $7x+y-(x+7)-2(y+1)-4=0\Rightarrow6x-y-13=0$.

**Where the marks actually go: the outside check is not a formality.** The exact same substitution — plug $(x_1,y_1)$ into $T$ — produces a well-defined straight line no matter what point you feed it, with no algebraic warning if that point happens to be inside the circle instead. A question phrased "find the chord of contact from $(0,1)$" (inside this circle, since $S_1$ there is $0+1-0-4-4=-7<0$) is quietly asking you to compute the polar of an interior point, which has no real tangents behind it at all. Skipping the $S_1>0$ check does not break the algebra; it breaks what the answer means.

Length shortcuts, both derivable from $S_1$, $r$, and $d=\sqrt{37}$ without re-solving for the touch points: tangent length $\sqrt{S_1}=2\sqrt7$, chord-of-contact length $\dfrac{2r\sqrt{S_1}}{d}=\dfrac{12\sqrt{259}}{37}\approx5.22$.
