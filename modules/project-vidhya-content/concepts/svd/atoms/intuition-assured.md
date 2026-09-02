---
# Alternative body for svd.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
id: svd.intuition.assured
concept_id: svd
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: svd.intuition
for_stance: assured
---

SVD is the spectral theorem's answer to "what if $A$ isn't symmetric, or isn't even square." $U, V$ come from eigenvectors of $AA^T$ and $A^TA$ — both symmetric PSD by construction, so their eigendecompositions are guaranteed real and orthogonal even when $A$ itself gives you nothing to work with directly.

For symmetric $A$: $U = V$ up to sign, and singular values are $|\lambda_i|$, not $\lambda_i$ — a negative eigenvalue flips a column's sign between $U$ and $V$ rather than showing up as a negative singular value. That sign subtlety is the most common source of a wrong-looking but actually-correct SVD.

Rank, condition number, and best rank-$k$ approximation (Eckart-Young) all read directly off $\Sigma$: rank is the count of nonzero $\sigma_i$, condition number is $\sigma_1/\sigma_{\min}$, and truncating at $\sigma_k$ is provably the closest rank-$k$ matrix in Frobenius norm — not just a heuristic.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag A's entries and watch the singular values move","inputs":[{"id":"a","label":"a","min":0,"max":4,"step":0.5,"initial":2},{"id":"b","label":"b","min":0,"max":4,"step":0.5,"initial":1},{"id":"c","label":"c","min":0,"max":4,"step":0.5,"initial":0},{"id":"d","label":"d","min":0,"max":4,"step":0.5,"initial":1}],"outputs":[{"label":"trace(AtA) = a^2+b^2+c^2+d^2","formula":"a^2+b^2+c^2+d^2","digits":2},{"label":"det(A) = ad-bc","formula":"a*d-b*c","digits":2},{"label":"sigma1 (larger)","formula":"sqrt((a^2+b^2+c^2+d^2+sqrt((a^2+b^2+c^2+d^2)^2-4*(a*d-b*c)^2))/2)","digits":3},{"label":"sigma2 (smaller)","formula":"sqrt((a^2+b^2+c^2+d^2-sqrt((a^2+b^2+c^2+d^2)^2-4*(a*d-b*c)^2))/2)","digits":3}],"caption":"det(AtA) always equals det(A) squared for a square matrix, which is why the discriminant only needs det(A) directly, never a separate computation on AtA. Initial values match the worked example: sigma1 = 2.288, sigma2 = 0.874."}
```
