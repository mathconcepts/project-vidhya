---
# Alternative body for svd.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
id: svd.intuition.shaken
concept_id: svd
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: svd.intuition
for_stance: shaken
---

$A$ acts on a vector in three steps: $V^T$ rotates it, $\Sigma$ stretches along fixed axes — big $\sigma_1$ stretches a lot, small $\sigma_2$ barely at all — then $U$ rotates the result into place.

$$A = U\Sigma V^T$$

Every matrix breaks into rotate, stretch, rotate.

Line up $\sigma_1 \ge \sigma_2 \ge \cdots \ge 0$. A large $\sigma_i$ means that direction carries signal; a tiny one means noise, or a direction barely used. Count the nonzero $\sigma_i$'s and you have the rank.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag A's entries and watch the singular values move","inputs":[{"id":"a","label":"a","min":0,"max":4,"step":0.5,"initial":2},{"id":"b","label":"b","min":0,"max":4,"step":0.5,"initial":1},{"id":"c","label":"c","min":0,"max":4,"step":0.5,"initial":0},{"id":"d","label":"d","min":0,"max":4,"step":0.5,"initial":1}],"outputs":[{"label":"trace(AtA) = a^2+b^2+c^2+d^2","formula":"a^2+b^2+c^2+d^2","digits":2},{"label":"det(A) = ad-bc","formula":"a*d-b*c","digits":2},{"label":"sigma1 (larger)","formula":"sqrt((a^2+b^2+c^2+d^2+sqrt((a^2+b^2+c^2+d^2)^2-4*(a*d-b*c)^2))/2)","digits":3},{"label":"sigma2 (smaller)","formula":"sqrt((a^2+b^2+c^2+d^2-sqrt((a^2+b^2+c^2+d^2)^2-4*(a*d-b*c)^2))/2)","digits":3}],"caption":"det(AtA) always equals det(A) squared for a square matrix, which is why the discriminant only needs det(A) directly, never a separate computation on AtA. Initial values match the worked example: sigma1 = 2.288, sigma2 = 0.874."}
```
