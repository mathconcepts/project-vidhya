---
id: orthogonality.common-traps
concept_id: orthogonality
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing orthogonal vectors with linearly independent vectors**: Orthogonal vectors are linearly independent, but the converse is not true. Orthogonality is a stricter condition.
- **Forgetting to normalize after orthogonalizing**: Gram-Schmidt produces orthogonal vectors, not orthonormal ones—you must divide by the norm to normalize. Students often forget this final step.
- **Thinking orthogonal matrices preserve direction**: Orthogonal matrices preserve lengths and angles, but may rotate or reflect vectors. They don't preserve the direction of arbitrary vectors (only lengths and relative angles).
