---
id: gram-schmidt.visual_analogy
concept_id: gram-schmidt
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

The first vector becomes a fixed rail — the line $y=x$ traced below is $u_1=(1,1)$'s direction, untouched by the whole process. Every later vector gets its shadow along that rail measured and cut away, the way a carpenter squares a second board against one already clamped level: the reference board never moves, only the new one gets trimmed until it sits at a true right angle to it.

Add a third vector and the rail set grows by one — the new board now gets squared against *both* earlier ones before it counts as done. Nothing about the earlier rails changes; only the newcomer is ever adjusted.

```gif-scene
{"type":"function-trace","expression":"x","x_range":[-2,2],"y_range":[-2,2],"frames":24,"fps":12}
```
