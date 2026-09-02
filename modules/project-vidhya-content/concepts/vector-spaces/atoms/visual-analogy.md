---
id: vector-spaces.visual-analogy
concept_id: vector-spaces
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: visual
---

Think of a vector space as an entire country. Every location is a valid vector; you can travel anywhere, combine journeys, and scale distances, always staying within its borders.

A **subspace** is a special region within that country — a state or province with strict rules: it must contain the capital city (the zero vector), and following two in-region roads, or stretching an in-region journey, must stay in the region. Break any rule and it's not a subspace. In $\mathbb{R}^2$, the valid subspaces are exactly the origin alone, any line through the origin, or the whole plane — a line that misses the origin (like $y=x+1$) fails the capital test immediately.

The span of a set of vectors is the smallest subspace-region containing all of them — start at the origin, walk in any combination of the given directions, and shade every reachable point.

```gif-scene
{"type":"function-trace","expression":"2*sin(x)","x_range":[-6,6],"y_range":[-3,3],"frames":30,"fps":12}
```

The curve above traces $2\sin(x)$ inside the (much larger) space of all functions on $[-\pi,\pi]$: every point on it is just $\sin(x)$ scaled, so the whole curve stays inside the one-dimensional subspace $\{c\cdot\sin(x):c\in\mathbb{R}\}$ — a single "road" through the origin, spanned by $\sin(x)$ alone.
