---
id: vectors-jee.visual-analogy
concept_id: vectors-jee
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Hold a stick of fixed length under a lamp and let it rotate flat against a wall, while the lamp shines straight down from above. The stick's **shadow on the wall** grows and shrinks as it turns — longest when the stick points straight down the wall, zero when the stick points straight out from it, and negative-length (the shadow flips to the other side) once the stick swings past horizontal.

That shadow length is exactly $|\vec a|\cos\theta$ — the piece of the dot product that depends on direction alone. The curve on this card plots that shadow, in units of the stick's own length, as the angle $\theta$ sweeps a full turn: $y=\cos\theta$. Every dot product you compute is this same shadow, just multiplied by the length of the second vector.

```gif-scene
{"type":"function-trace","expression":"cos(x)","x_range":[0,6.28319],"y_range":[-1.2,1.2],"frames":30,"fps":12}
```
