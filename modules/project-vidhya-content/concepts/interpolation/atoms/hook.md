---
id: interpolation.hook
concept_id: interpolation
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A sensor logs a car's position at three widely-spaced instants, and a question asks for its position at a moment in between — no formula, just three numbers. Interpolation is the art of building a curve that passes exactly through known data points, then reading off values wherever you need them. Lagrange's method writes that curve directly, as a sum of pieces; Newton's divided-difference form builds the same curve one point at a time, so a new measurement only costs one more term instead of a full rebuild.
