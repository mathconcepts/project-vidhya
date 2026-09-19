---
id: matrices-and-determinants.visual-analogy
concept_id: matrices-and-determinants
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Imagine turning a single dial that controls one entry of a system's coefficient matrix — here, the coefficient of $z$ in the third equation of $x+y+z=6,\ x+2y+3z=10,\ x+2y+kz=12$, called $k$. As the dial turns, the coefficient determinant traces a straight line, $\Delta(k)=k-3$, crossing zero exactly once.

The curve on this card plots exactly that line. For every value of $k$ except $3$, the determinant is nonzero and the system has one clean, unique solution — the dial can sit anywhere on the curve except the single point where it touches zero, and the answer just changes smoothly. At $k=3$ the curve crosses the horizontal axis: the coefficient matrix becomes singular, Cramer's rule stops working, and the system needs a completely different question asked of it — does it have infinitely many solutions, or none — a question this determinant alone cannot answer.

```gif-scene
{"type":"function-trace","expression":"x-3","x_range":[0,6],"y_range":[-3.5,3.5],"frames":30,"fps":12}
```
