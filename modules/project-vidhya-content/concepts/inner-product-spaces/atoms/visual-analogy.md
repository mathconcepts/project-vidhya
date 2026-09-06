---
id: inner-product-spaces.visual_analogy
concept_id: inner-product-spaces
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

**Analogy:** An inner product is a *"how much do you agree?"* score between two things.

- **Vectors in $\mathbb{R}^n$:** the ordinary dot product. Point the same way and $\langle u, v \rangle = \|u\| \|v\|$ — full agreement. Point perpendicular and $\langle u, v \rangle = 0$ — no agreement at all.
- **Functions:** $\langle f, g \rangle = \int_a^b f(x) \overline{g(x)} \, dx$ asks the same question — how much do $f$ and $g$ overlap, added up across the interval?
- **Matrices:** $\langle A, B \rangle = \text{trace}(A^* B)$ asks it again, entry by entry.

Same question, three costumes. Once that score exists, orthogonality, projections, and decompositions all fall out of it for free — in $\mathbb{R}^n$, in function space, in matrix space, anywhere.

**The diagram on this card** shows the $\mathbb{R}^2$ case: $u=(1,0)$ fixed, $v=(\cos t,\sin t)$ sweeping a full turn around it. Their agreement score, $\langle u,v\rangle=\cos t$, is what actually decides the angle between them.

```gif-scene
{"type": "parametric-curve", "x_expr": "cos(t)", "y_expr": "sin(t)", "frames": 30, "fps": 12, "title": "u = (1, 0). v sweeps a full turn."}
```
