---
id: definite-integrals.visual_analogy
concept_id: definite-integrals
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

Imagine filling a tank with water: the rate of flow is $f(x)$ (like, liters per second), and time runs from $a$ to $b$. The total volume in the tank is $\int_a^b f(x) \, dx$. You're multiplying rate (height of the curve) by infinitesimal time-slices (width $dx$), summing them all up.

Geometrically, for a positive function, this is the area under the curve. For negative parts, it's area below the axis (counted as negative). The net result is the "signed area"—what you get when you take everything above the axis and subtract everything below.

The Fundamental Theorem says: the integral from $a$ to $b$ is simply the difference $F(b) - F(a)$. No need to think about limits of sums—just evaluate the antiderivative at the endpoints.

```gif-scene
{"type":"function-trace","expression":"exp(-x)","x_range":[0,5],"y_range":[-0.2,1.2],"frames":30,"fps":12}
```
