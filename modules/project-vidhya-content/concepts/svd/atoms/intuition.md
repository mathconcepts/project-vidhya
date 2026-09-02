---
id: svd.intuition
concept_id: svd
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Imagine a matrix $A$ as a machine that transforms a space. SVD breaks this into three mechanical steps. First, an orthonormal basis rotates the input (via $V^T$). Then, the axis-aligned directions are stretched (via the diagonal matrix $\Sigma$ with singular values). Finally, another orthonormal rotation realigns the output (via $U$). The singular values $\sigma_i$ tell you exactly how much each axis gets amplified: large $\sigma_i$ means that direction carries signal; tiny $\sigma_i$ means noise or redundancy. This is why rank — the count of nonzero singular values — emerges naturally: it's the number of "real" dimensions the matrix actually uses.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag A's entries and watch the singular values move","inputs":[{"id":"a","label":"a","min":0,"max":4,"step":0.5,"initial":2},{"id":"b","label":"b","min":0,"max":4,"step":0.5,"initial":1},{"id":"c","label":"c","min":0,"max":4,"step":0.5,"initial":0},{"id":"d","label":"d","min":0,"max":4,"step":0.5,"initial":1}],"outputs":[{"label":"trace(AtA) = a^2+b^2+c^2+d^2","formula":"a^2+b^2+c^2+d^2","digits":2},{"label":"det(A) = ad-bc","formula":"a*d-b*c","digits":2},{"label":"sigma1 (larger)","formula":"sqrt((a^2+b^2+c^2+d^2+sqrt((a^2+b^2+c^2+d^2)^2-4*(a*d-b*c)^2))/2)","digits":3},{"label":"sigma2 (smaller)","formula":"sqrt((a^2+b^2+c^2+d^2-sqrt((a^2+b^2+c^2+d^2)^2-4*(a*d-b*c)^2))/2)","digits":3}],"caption":"det(AtA) always equals det(A) squared for a square matrix, which is why the discriminant only needs det(A) directly, never a separate computation on AtA. Initial values match the worked example: sigma1 = 2.288, sigma2 = 0.874."}
```
