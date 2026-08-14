---
id: least-squares.intuition
concept_id: least-squares
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Imagine a line in 3D space and a point above it. You can't land exactly on the line, so you drop a perpendicular to find the closest point. Least squares does exactly this: it projects the "right-hand side" onto the space spanned by your matrix columns, finding the nearest solution that actually satisfies the geometry. The key insight is orthogonality—the residual (what's left over) is perpendicular to everything we can construct from our variables.