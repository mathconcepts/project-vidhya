---
# Alternative body for svd.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
id: svd.worked-example.shaken
concept_id: svd
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: svd.worked_example
for_stance: shaken
---

**Matrix:** $A = \begin{pmatrix} 2 & 1 \\ 0 & 1 \end{pmatrix}$.

**Step 1 — form $A^TA$.** $A^TA = \begin{pmatrix} 2 & 0 \\ 1 & 1 \end{pmatrix}\begin{pmatrix} 2 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 4 & 2 \\ 2 & 2 \end{pmatrix}$

**Step 2 — its eigenvalues.** $(4-\lambda)(2-\lambda) - 4 = \lambda^2-6\lambda+4=0 \;\Rightarrow\; \lambda = 3\pm\sqrt5$. So $\lambda_1 \approx 5.236$, $\lambda_2 \approx 0.764$.

**Step 3 — singular values.** Square-root the eigenvalues:

$$\sigma_1 = \sqrt{3+\sqrt5} \approx 2.288, \qquad \sigma_2 = \sqrt{3-\sqrt5} \approx 0.874$$

Both nonzero, so rank$(A) = 2$.

$$\boxed{\sigma_1 = \sqrt{3+\sqrt5}, \quad \sigma_2 = \sqrt{3-\sqrt5}}$$

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "SVD of a 2×2 matrix", "steps": [{"prompt": "What is $A^T A$ for $A = \\begin{pmatrix} 2 & 1 \\\\ 0 & 1 \\end{pmatrix}$?", "hint": "Multiply the transpose by the original matrix element-wise.", "answer": "$A^T A = \\begin{pmatrix} 4 & 2 \\\\ 2 & 2 \\end{pmatrix}$"}, {"prompt": "Find the eigenvalues of $A^T A = \\begin{pmatrix} 4 & 2 \\\\ 2 & 2 \\end{pmatrix}$.", "hint": "Solve $\\det(A^T A - \\lambda I) = 0$: $(4-\\lambda)(2-\\lambda) - 4 = 0$.", "answer": "$\\lambda_1 = 3 + \\sqrt{5} \\approx 5.236$, $\\lambda_2 = 3 - \\sqrt{5} \\approx 0.764$"}, {"prompt": "What are the singular values of $A$?", "hint": "Singular values are square roots of eigenvalues of $A^T A$.", "answer": "$\\sigma_1 = \\sqrt{3 + \\sqrt{5}} \\approx 2.288$, $\\sigma_2 = \\sqrt{3 - \\sqrt{5}} \\approx 0.874$"}], "caption": "Use eigenvalues of $A^T A$ to find singular values."}
```
