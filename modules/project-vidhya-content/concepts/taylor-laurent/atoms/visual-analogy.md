---
id: taylor-laurent.visual_analogy
concept_id: taylor-laurent
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

A Laurent series doesn't converge everywhere — only in an **annulus**, a ring between two radii. For $f(z)=\dfrac{z}{(z-1)(z-2)}$ the relevant ring is $1<|z|<2$: inner radius set by the pole at $z=1$, outer radius set by the pole at $z=2$.

Sweep a growing circle $|z|^2=c$ from $c=1$ out to $c=4$ (that is, $|z|$ from $1$ to $2$) and you're filling in exactly this annulus — the region where the one Laurent series from this concept's worked example is valid. Step outside either radius and a *different* series (a different choice of which term expands which way) takes over.

```gif-scene
{"type":"level-set","expression":"x^2+y^2","c_range":[1,4],"x_range":[-2.5,2.5],"y_range":[-2.5,2.5],"title":"Annulus 1 < |z| < 2 where this Laurent series converges"}
```
