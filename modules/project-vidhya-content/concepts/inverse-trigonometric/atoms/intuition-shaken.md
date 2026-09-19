---
id: inverse-trigonometric.intuition-shaken
concept_id: inverse-trigonometric
atom_type: intuition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
variant_of: inverse-trigonometric.intuition
for_stance: shaken
---

$\tan^{-1}$ only ever gives an answer between $-90°$ and $90°$. Even if the real angle is bigger than that, $\tan^{-1}$ reports a value inside this one window.

Each other inverse function has its own window too. $\sin^{-1}$: between $-90°$ and $90°$. $\cos^{-1}$: between $0°$ and $180°$. Different windows for different reasons.

For $\tan^{-1}x+\tan^{-1}y$: each piece is inside $\tan^{-1}$'s window on its own. But their SUM can step outside it. When that happens, $\tan^{-1}\!\left(\frac{x+y}{1-xy}\right)$ reports a value $180°$ away from the true sum. Check the condition $xy<1$ first. If $xy>1$, add $180°$ ($x,y>0$) or subtract $180°$ ($x,y<0$) to the formula's raw output.
