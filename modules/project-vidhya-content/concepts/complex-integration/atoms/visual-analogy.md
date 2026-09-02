---
id: complex-integration.visual_analogy
concept_id: complex-integration
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Every contour integral needs a closed loop to travel — here it's $|z|=2$, the boundary this concept's worked example integrates over. Nothing about the loop itself decides whether the integral vanishes; that depends entirely on what sits inside it.

If every singularity of the integrand lies outside this loop, Cauchy's theorem forces the integral to zero, no matter how the loop bends. If a singularity sits inside, as $z=\pm1$ do for $z/(z^2-1)$, the loop "feels" it, and the integral is fixed by Cauchy's formula (or the residue theorem) instead of vanishing.

```gif-scene
{"type":"parametric-curve","x_expr":"2*cos(s)","y_expr":"2*sin(s)","s_range":[0,6.283185307179586],"x_range":[-3,3],"y_range":[-3,3],"frames":30,"fps":12,"title":"Closed contour |z| = 2"}
```
