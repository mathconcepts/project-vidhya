---
id: vector-fields.visual_analogy
concept_id: vector-fields
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: visual
---

Picture $\phi(x,y)=x^2+y^2$ as a set of concentric rings, each ring one fixed height above the last — a topographic map of a bowl. The gradient field $\nabla\phi=(2x,2y)$ lives on top of this picture as an arrow at every point, always pointing straight out across the rings, never along one.

Watch the rings grow: as $c$ increases in $x^2+y^2=c$, each ring is a circle of radius $\sqrt c$, evenly spaced in height but not in radius — rings crowd together near the centre and spread out further away, because the surface is steeper close to the bottom's rim than far out. That crowding is exactly what $|\nabla\phi|$ measures: a bigger gradient magnitude where the rings pack tighter.

```gif-scene
{"type":"level-set","expression":"x**2+y**2","x_range":[-3,3],"y_range":[-3,3],"c_range":[0.5,8],"frames":24,"fps":10}
```
