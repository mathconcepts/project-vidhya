---
id: trace.intuition
concept_id: trace
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Imagine a linear transformation stretching and rotating space. The **diagonal entries** of a matrix are what the transformation does to each coordinate axis independently—they capture the "scaling" along principal directions. When you add these diagonals together, you get the trace: a single number that tells you the total "expansion" or "contraction" baked into the transformation, regardless of the coordinate system you're using. It's invariant under similarity—rotate your view, the trace stays the same. For any two matrices $A$ and $B$, the trace of their product $AB$ equals the trace of $BA$—because the total expansion wrapping one transformation into another doesn't care about the order *conceptually*, even though the matrices look different. This single number connects to eigenvalues: the trace is always the sum of the eigenvalues, linking matrix entries to the true "intrinsic" scaling factors.
