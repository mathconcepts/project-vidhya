---
id: orthogonality.common-traps
concept_id: orthogonality
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing orthogonal vectors with linearly independent vectors**: Two vectors are **orthogonal** when they meet at a perfect right angle — their dot product is zero. Orthogonal vectors are always linearly independent (no vector is a combination of the others), but the reverse isn't true: you can have independent vectors that aren't orthogonal at all. Orthogonality is the stricter, stronger condition.
- **Forgetting to normalize after orthogonalizing**: The **Gram-Schmidt** process (a step-by-step method for turning any set of vectors into orthogonal ones) only makes vectors orthogonal — it doesn't make them **orthonormal** (orthogonal *and* exactly length 1). You still have to divide each vector by its own length as a final step. This is the one students forget most often, so double-check it before moving on.
- **Thinking orthogonal matrices preserve direction**: An orthogonal matrix keeps lengths and angles unchanged, but it can still rotate or reflect a vector — sending it off in a completely different direction. "Preserves lengths and angles" does not mean "leaves every vector pointing the same way"; only the size and the relative angles between vectors stay fixed.
