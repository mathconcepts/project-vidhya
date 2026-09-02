---
id: sequences.visual_analogy
concept_id: sequences
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Eight bars, one per term of $a_n = \dfrac1n$: $1,\ 0.5,\ 0.333,\ 0.25,\ 0.2,\ 0.167,\ 0.143,\ 0.125$. Read them left to right and watch the height drop every single step — steeply at first, then by smaller and smaller amounts, but never stopping and never crossing zero. That's the shape of a sequence converging to $0$: a monotone slide toward a floor it approaches but never reaches. Contrast this in your head with a sequence like $(-1)^n$, whose "bars" would just alternate between two fixed heights forever, never settling — a completely different shape, and a different fate. The bar heights are the whole proof here: no algebra needed to see where this one is going.

```gif-scene
{"type":"discrete-bars","values":[1,0.5,0.333,0.25,0.2,0.167,0.143,0.125],"labels":["a1","a2","a3","a4","a5","a6","a7","a8"]}
```
