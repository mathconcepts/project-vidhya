---
id: complex-numbers.visual_analogy
concept_id: complex-numbers
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

A complex number on the unit circle is just $\cos(\theta) + i\sin(\theta)$. Multiplying by it rotates everything by angle $\theta$. Watch the parametric curve $z(t) = \cos(t)$ trace the real axis as $t$ advances — every multiplication by $e^{it}$ would rotate this trajectory by $t$ radians on the Argand plane.

The real axis component oscillates, the imaginary axis component traces $\sin(t)$, and together they sweep out a circle. That is the geometric meaning of $e^{i\theta}$: pure rotation.

```gif-scene
{"type":"parametric","expression":"cos(t)","x_range":[-1.5,1.5],"y_range":[-1.5,1.5],"t_range":[0,6.28],"frames":30,"fps":12}
```
