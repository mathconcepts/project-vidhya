---
id: limits-jee.intuition-shaken
concept_id: limits-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: limits-jee.intuition
for_stance: shaken
---

Plug $x=0$ into $\frac{\sin x}{x}$: you get $\frac{0}{0}$. That is not an answer and not a broken function — it means direct substitution cannot answer this particular question. The real question is not where the numerator and denominator end up (both at $0$), but how fast each one is moving as $x\to0$. Near $x=0$, $\sin x$ moves at almost exactly the same rate as $x$ — check it: at $x=0.01$, $\sin(0.01)\approx0.0099998$, barely different from $0.01$ itself. That closeness in speed, not the shared endpoint of $0$, is why the ratio settles at $1$.

L'Hôpital's rule formalizes this: replace numerator and denominator with their derivatives — their instantaneous speeds — because a $0/0$ race is decided by speed, not position. A $1^{\infty}$, $0\cdot\infty$, or $\infty-\infty$ form is the same underlying question wearing different algebra; rewrite it into a $0/0$ or $\infty/\infty$ shape first, then compare speeds.
