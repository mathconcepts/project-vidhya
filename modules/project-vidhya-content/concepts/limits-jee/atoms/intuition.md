---
id: limits-jee.intuition
concept_id: limits-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

$\frac{0}{0}$ is not a broken question — it is the wrong question. Substituting the limiting value tells you where the numerator and denominator *end up*, and if both end up at $0$ (or both at $\infty$), that alone can never decide the ratio. What decides it is how *fast* each one is moving as it gets there. Two runners can both cross the finish line together, but the race was decided by their speeds along the way, not by the fact that both eventually reached the same line.

That is the whole idea behind L'Hôpital's rule: swap the numerator and denominator for their instantaneous speeds — their derivatives — because a $0/0$ or $\infty/\infty$ race is really asking "whose speed wins," not "who arrives where." It is why $\frac{\sin x}{x}\to1$: near $x=0$, $\sin x$ moves at almost exactly the same rate as $x$ itself. And it is why every $1^{\infty}$, $0\cdot\infty$, or $\infty-\infty$ form can be rewritten into a $0/0$ or $\infty/\infty$ race first — algebra just repackages the question so the "compare the speeds" idea applies.
