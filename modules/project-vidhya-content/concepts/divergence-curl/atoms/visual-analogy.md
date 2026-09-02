---
id: divergence-curl.visual_analogy
concept_id: divergence-curl
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
---

Trace a path that spirals outward while turning: at every instant it is moving both away from the centre and around it. That single curve is a compact picture of a field with **both** nonzero divergence (the outward drift) and nonzero curl (the turning) at once — the two operators are not measuring the same thing, but nothing stops a field from having both properties simultaneously.

Compare it to two extremes: a straight ray from the centre would have divergence but no curl (pure outflow, no turning); a circle centred at the origin would have curl but no divergence (pure turning, no net drift outward). The spiral sits between them, carrying a bit of each.

```gif-scene
{"type":"parametric-curve","x_expr":"s*cos(4*s)","y_expr":"s*sin(4*s)","s_range":[0,1.6],"x_range":[-1.6,1.6],"y_range":[-1.6,1.6],"frames":30,"fps":12}
```
