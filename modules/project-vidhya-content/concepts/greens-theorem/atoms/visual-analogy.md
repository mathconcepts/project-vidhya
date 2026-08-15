---
id: greens-theorem.visual-analogy
concept_id: greens-theorem
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Green's Theorem as Circulation Around a Vortex

Imagine water flowing in a river with a whirlpool. The **circulation**—how much the water spins as you walk around the whirlpool's edge—is entirely determined by the **strength of the vortex at its center** (the curl of the velocity field). You don't need to measure the water's motion at every point on the boundary; the boundary motion tells you the total spin inside.

Similarly, **Green's Theorem says**: the line integral of a vector field around a closed curve equals the double integral of the field's curl over the enclosed region. The swirl you measure at the boundary comes from rotational behavior inside.

This applies to everything circular: whirlpools, tornadoes, rotating machinery. The net circulation depends on what's spinning inside, not just where you measure it.

```gif-scene
{"type":"parametric","expression":"sin(t*x)*cos(t)","x_range":[-3.14,3.14],"y_range":[-1.5,1.5],"t_range":[0,6.28],"frames":30,"fps":12}
```
