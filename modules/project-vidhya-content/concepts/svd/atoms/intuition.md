---
id: svd.intuition
concept_id: svd
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

## The Geometric Soul of SVD

Imagine a matrix $A$ as a machine that transforms a space. SVD breaks this into three mechanical steps. First, an orthonormal basis rotates the input (via $V^T$). Then, the axis-aligned directions are stretched (via the diagonal matrix $\Sigma$ with singular values). Finally, another orthonormal rotation realigns the output (via $U$). The singular values $\sigma_i$ tell you exactly how much each axis gets amplified: large $\sigma_i$ means that direction carries signal; tiny $\sigma_i$ means noise or redundancy. This is why rank—the count of nonzero singular values—emerges naturally: it's the number of "real" dimensions the matrix actually uses.