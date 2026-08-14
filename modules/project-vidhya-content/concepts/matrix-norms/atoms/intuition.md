---
id: matrix-norms.intuition
concept_id: matrix-norms
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

A matrix norm measures the "size" or "scale" of a matrix — just as a vector norm measures vector length. Geometrically, $\|A\|$ tells you the maximum stretch factor: if you feed in a unit-norm vector, the output has norm at most $\|A\|$. The condition number $\kappa(A) = \|A\| \cdot \|A^{-1}\|$ compares amplification in the forward direction to shrinkage in the inverse direction. Large $\kappa(A)$ means the inverse map is "sensitive" — small input errors blow up into large output errors, like a thin pancake that stretches some directions far and others barely at all.