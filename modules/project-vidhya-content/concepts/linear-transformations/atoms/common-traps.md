---
id: linear-transformations.common-traps
concept_id: linear-transformations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Thinking translations are linear**: Translation (adding a constant vector) is NOT linear because $T(\mathbf{0}) \neq \mathbf{0}$. Always check this first.
- **Confusing matrix columns**: Students forget that the columns of the matrix representation are the images of the standard basis vectors. Don't compute $T$ on arbitrary vectors first—use the basis vectors.
- **Mixing up kernel and image dimensions**: Kernel and image are dual concepts via rank-nullity. Forgetting this leads to errors when computing dimensions.
