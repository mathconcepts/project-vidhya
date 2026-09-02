---
id: limits.visual_analogy
concept_id: limits
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Zoom out from the single point $x=0$ and trace $\dfrac{\sin x}{x}$ across a much wider window, from $-10$ to $10$. The curve is smooth, bounded, and entirely unremarkable everywhere — a single gentle wave that decays toward zero on both sides — except for one pixel-thin gap sitting exactly at $x=0$, where the expression itself is undefined. Every point arbitrarily close to that gap, on either side, sits at a height arbitrarily close to $1$. That single missing point, surrounded by agreement on both sides, is the entire geometric content of "the limit exists even though the function doesn't" — one hole in an otherwise ordinary curve.

```gif-scene
{"type":"function-trace","expression":"sin(x)/x","x_range":[-10,10],"y_range":[-0.3,1.15]}
```
