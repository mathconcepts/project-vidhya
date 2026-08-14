---
id: gram-schmidt.hook
concept_id: gram-schmidt
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

# Gram-Schmidt Process: The Hook

Given linearly independent vectors, how do you construct an orthonormal basis for the same span — one where every vector is perpendicular to every other and has unit length?

The **Gram-Schmidt orthogonalization** process answers this by recursively subtracting projections: take each new vector, remove its "shadow" (projection) onto all previous ones, then normalize.