---
# Alternative body for svd.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
id: svd.worked-example.assured
concept_id: svd
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: svd.worked_example
for_stance: assured
---

$A = \begin{pmatrix} 2 & 1 \\ 0 & 1 \end{pmatrix}$: singular values via $A^TA = \begin{pmatrix} 4 & 2 \\ 2 & 2 \end{pmatrix}$, symmetric PSD by construction, so its eigendecomposition is guaranteed real and orthogonal regardless of whether $A$ itself is nice. $\operatorname{tr} = 6$, $\det = 4$ give $\lambda^2-6\lambda+4=0$ directly: $\lambda = 3\pm\sqrt5$.

$$\sigma_1 = \sqrt{3+\sqrt5} \approx 2.288, \qquad \sigma_2 = \sqrt{3-\sqrt5} \approx 0.874$$

Both strictly positive — rank $2$, full rank for this $2\times2$. To finish: $V$'s columns are the (normalized) eigenvectors of $A^TA$ above; $U$'s columns come from $u_i = \frac{1}{\sigma_i}Av_i$, never from eigenvectors of $AA^T$ computed independently — a mismatched sign between the two routes is the usual way this problem goes wrong.

Condition number $\sigma_1/\sigma_2 \approx 2.62$ falls straight out, no extra work — worth stating if the question is fishing for numerical stability rather than the decomposition itself.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "SVD of a 2×2 matrix", "steps": [{"prompt": "What is $A^T A$ for $A = \\begin{pmatrix} 2 & 1 \\\\ 0 & 1 \\end{pmatrix}$?", "hint": "Multiply the transpose by the original matrix element-wise.", "answer": "$A^T A = \\begin{pmatrix} 4 & 2 \\\\ 2 & 2 \\end{pmatrix}$"}, {"prompt": "Find the eigenvalues of $A^T A = \\begin{pmatrix} 4 & 2 \\\\ 2 & 2 \\end{pmatrix}$.", "hint": "Solve $\\det(A^T A - \\lambda I) = 0$: $(4-\\lambda)(2-\\lambda) - 4 = 0$.", "answer": "$\\lambda_1 = 3 + \\sqrt{5} \\approx 5.236$, $\\lambda_2 = 3 - \\sqrt{5} \\approx 0.764$"}, {"prompt": "What are the singular values of $A$?", "hint": "Singular values are square roots of eigenvalues of $A^T A$.", "answer": "$\\sigma_1 = \\sqrt{3 + \\sqrt{5}} \\approx 2.288$, $\\sigma_2 = \\sqrt{3 - \\sqrt{5}} \\approx 0.874$"}], "caption": "Use eigenvalues of $A^T A$ to find singular values."}
```
