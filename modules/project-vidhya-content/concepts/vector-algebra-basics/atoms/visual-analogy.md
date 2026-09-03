---
id: vector-algebra-basics.visual-analogy
concept_id: vector-algebra-basics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: visual
---

Fix two unit vectors and swing the angle between them from $0$ to $\pi$. The parallelogram they span starts flat — zero area, vectors parallel — grows to a full unit square at a right angle, then shrinks back to zero as the vectors close up again, now pointing opposite ways. The diagram on this card traces exactly that area: $|\vec a\times\vec b|=\sin\theta$ for unit vectors, starting at $0$, peaking at $1$ when $\theta=90^\circ$, and returning to $0$ at $\theta=180^\circ$.

Read that curve like a dial — the height at any angle tells you how much cross-product "push" two unit vectors deliver at that separation, and the dot product $\cos\theta$ would trace the mirror-image story: maximal overlap at $\theta=0$, zero at $\theta=90^\circ$.

```gif-scene
{"type":"function-trace","expression":"sin(x)","x_range":[0,3.14159],"y_range":[-0.2,1.2]}
```
