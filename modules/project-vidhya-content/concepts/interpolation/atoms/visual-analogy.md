---
id: interpolation.visual-analogy
concept_id: interpolation
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Picture three known readings as pins on a board: $f(1)=1$, $f(2)=8$, $f(4)=64$. A quadratic thread pulled taut through all three pins is the interpolating polynomial — it is forced to touch every pin exactly, but between and beyond them it follows its own curve, not necessarily the process that produced the data.

```gif-scene
{"type": "discrete-bars", "values": [1, 8, 64], "labels": ["x=1", "x=2", "x=4"]}
```

These three bars are all the interpolant is allowed to know. If the true underlying rule were $f(x)=x^3$, the honest value at $x=3$ is $27$ — but the quadratic thread through only these three pins reads $29$ there, off by $2$. Not a mistake: a thread pulled through three tacks has no way to know it is chasing a cubic, and the gap only grows once you step outside the span the tacks define.
