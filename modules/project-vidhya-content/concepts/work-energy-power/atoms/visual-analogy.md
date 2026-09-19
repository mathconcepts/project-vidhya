---
id: work-energy-power.visual-analogy
concept_id: work-energy-power
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

Stretching a bow to fire an arrow is a **variable force** at work: the farther you pull the string back, the harder it resists, so the force is not constant across the pull. A hand pulling with a *constant* $10\text{ N}$ the whole way would be simpler to compute, but that is not how a bowstring behaves.

The curve below shows a force that starts strong and fades to zero as displacement increases — like a spring-loaded latch pushing an object away, hardest at the start and weakest once fully released. The **work done** is the *area under this force-versus-displacement curve*, not just "force times distance" (that shortcut only works when the force never changes). Here, the force runs from $10\text{ N}$ at $x=0$ down to $0\text{ N}$ at $x=5\text{ m}$, and the area under that straight-line drop works out to exactly $25\text{ J}$ — a triangle-shaped area, not a rectangle, because the force itself is shrinking the whole time.

```gif-scene
{"type":"function-trace","expression":"10 - 2*x","x_range":[0,5],"y_range":[0,10],"frames":30,"fps":12}
```

