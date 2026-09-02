---
id: complex-numbers.visual_analogy
concept_id: complex-numbers
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Every complex number of modulus 5 sits somewhere on the circle of radius 5 around the origin — only the argument tells you where. Trace the point $z(\theta) = 5\cos\theta + 5i\sin\theta$ as $\theta$ runs from $0$ to $2\pi$: it draws exactly that circle, once, at constant distance from the center.

Multiplying $z$ by $e^{i\phi}$ would slide every point on this trace forward by angle $\phi$ without changing the radius at all — rotation, with the modulus as an untouched invariant. That separation, "one number for how far, one number for which way," is the entire geometric content of polar form.

```gif-scene
{"type":"parametric-curve","x_expr":"5*cos(s)","y_expr":"5*sin(s)","s_range":[0,6.283185307179586],"x_range":[-6,6],"y_range":[-6,6],"frames":30,"fps":12,"title":"Fixed modulus 5, sweeping argument"}
```
