---
id: gravitation.visual-analogy
concept_id: gravitation
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

A bulb's light spreads out over a larger and larger sphere as you move away from it, so its brightness thins out as $1/r^2$ — twice the distance, a quarter the brightness. Gravity's pull thins out exactly the same way, $F=GM/r^2$ per unit mass, for exactly the same geometric reason: the same "amount of pull" is spread over a bigger and bigger sphere as $r$ grows.

Orbital speed doesn't thin out as fast, though. Balancing that shrinking pull against the centripetal force a circular orbit needs gives $v \propto 1/\sqrt{r}$ — a gentler fall-off than the force itself, since a slower orbit also needs less centripetal force to begin with. The curve below sketches this relationship in convenient illustrative units: speed falls quickly at first, then flattens out as $r$ grows, never quite reaching zero.

```gif-scene
{"type":"function-trace","expression":"20/sqrt(x)","x_range":[1,25],"y_range":[0,20],"frames":30,"fps":12}
```

