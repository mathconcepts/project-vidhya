---
id: conformal-mapping.visual_analogy
concept_id: conformal-mapping
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Think of a lens that can magnify unevenly across its surface but never skews an angle: streets that cross at $37°$ in the city still cross at $37°$ through the lens, no matter where on the map. That's the geometric essence of a conformal map — angles survive even when distances don't.

Below is the image of the circle $|z|=2$ under $w=1/z$: a smaller circle, traced in the opposite rotational direction. Every right angle on the original circle's grid still meets at a right angle on this image — the size and orientation changed, the angles didn't.

```gif-scene
{"type":"parametric-curve","x_expr":"0.5*cos(s)","y_expr":"-0.5*sin(s)","s_range":[0,6.283185307179586],"x_range":[-1,1],"y_range":[-1,1],"frames":30,"fps":12,"title":"Image of |z| = 2 under w = 1/z"}
```
