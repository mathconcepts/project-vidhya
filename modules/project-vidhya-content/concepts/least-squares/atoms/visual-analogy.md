---
id: least-squares.visual_analogy
concept_id: least-squares
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

The worked example fits $y=c+mx$ through $(0,1),(1,2),(2,2)$ and lands on $\hat x=(7/6,\,1/2)$. Fix the intercept at its optimal $c=7/6$ and let only the slope $m$ vary: the total squared error $\text{SSE}(m)$ traces a parabola in $m$, not a jagged or lumpy curve. That's the real reason least squares always has a single best answer — a sum of squares in one linear parameter is always convex, so there is exactly one minimum and no local traps to fall into.

Watch the curve below: it bottoms out at $m=1/2$, exactly the slope the normal equations produced. Moving $m$ either direction from there strictly increases the total error.

```gif-scene
{"type":"function-trace","expression":"5*x**2 - 5*x + 17/12","x_range":[-0.4,1.4],"y_range":[0,3],"frames":30,"fps":12}
```
