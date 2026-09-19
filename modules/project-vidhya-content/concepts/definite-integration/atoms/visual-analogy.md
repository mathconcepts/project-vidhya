---
id: definite-integration.visual_analogy
concept_id: definite-integration
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Think of $\int_0^1 x\,dx$ as a stack of coins under the line $y=x$, sliced into thin vertical strips. Each strip's height is roughly the $x$-value at its right edge, so summing strip-width $\times$ strip-height gives an ESTIMATE of the true area — always a slight overestimate here, because $y=x$ is increasing, so a right-edge height overshoots the strip's true average.

Cut the strips thinner and the overestimate shrinks. The bars below use $2$, $4$, $8$, and $16$ strips for exactly this triangle: the estimate drops from $0.75$ toward the true area, $0.5$, getting closer every time the strip count doubles. The "limit of a sum" in the formal definition IS this process, made exact: not a finite stack of strips, but the number the stack's estimate approaches as the strip count grows without bound.

```gif-scene
{"type":"discrete-bars","values":[0.75,0.625,0.5625,0.53125],"labels":["n=2","n=4","n=8","n=16"],"title":"Right-endpoint estimate for ∫₀¹x dx, converging toward 0.5"}
```
