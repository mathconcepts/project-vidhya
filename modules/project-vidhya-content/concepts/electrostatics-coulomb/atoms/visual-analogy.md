---
id: electrostatics-coulomb.visual-analogy
concept_id: electrostatics-coulomb
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

A bulb's brightness, as seen by your eye, is not about how much light it emits — it is about how much of that light reaches a fixed-size patch of your retina. Move twice as far from the bulb, and that same total light now spreads over four times the area, so each patch receives a quarter as much. Brightness falls as $1/r^2$, exactly the way the electric field of a point charge does.

The curve on this card traces that same $1/r^2$ shape: steep and strong close in, then flattening out fast as distance grows. Near a charge, moving even a little changes the field a lot; far away, the field is already weak and barely changes at all. This is the whole reason the "double the distance, quarter the effect" rule from the hook works out the way it does — it is baked into the shape of the curve itself, not a coincidence of the particular numbers chosen there.

```gif-scene
{"type":"function-trace","expression":"1/x^2","x_range":[0.5,4],"y_range":[0,4],"frames":30,"fps":12}
```

