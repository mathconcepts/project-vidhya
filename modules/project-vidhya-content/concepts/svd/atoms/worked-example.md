---
id: svd.worked_example
concept_id: svd
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Compute the SVD of the matrix $A = \begin{pmatrix} 2 & 1 \\ 0 & 1 \end{pmatrix}$.

---

**Step 1 — Compute $A^T A$ and find its eigenvalues.** $A^T A = \begin{pmatrix} 2 & 0 \\ 1 & 1 \end{pmatrix} \begin{pmatrix} 2 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 4 & 2 \\ 2 & 2 \end{pmatrix}$. Characteristic polynomial: $(4-\lambda)(2-\lambda) - 4 = \lambda^2 - 6\lambda + 4 = 0$. Eigenvalues: $\lambda = 3 \pm \sqrt{5}$, so $\lambda_1 \approx 5.236$, $\lambda_2 \approx 0.764$.

---

**Step 2 — Compute singular values and $V$.** $\sigma_1 = \sqrt{3+\sqrt5} \approx 2.288$, $\sigma_2 = \sqrt{3-\sqrt5} \approx 0.874$, so $\Sigma = \begin{pmatrix}\sigma_1&0\\0&\sigma_2\end{pmatrix}$. The (normalized) eigenvectors of $A^TA$ form the columns of $V$.

---

**Step 3 — Compute $U$ and verify.** The columns of $U$ are $u_i = \frac{1}{\sigma_i}Av_i$. Then $A = U\Sigma V^T$, with $U$ orthogonal, $\Sigma$ as above, and $V^T$'s rows the normalized eigenvectors.

$$\boxed{\text{rank}(A) = 2, \quad \sigma_1 = \sqrt{3+\sqrt{5}}, \quad \sigma_2 = \sqrt{3-\sqrt{5}}, \quad \|A\|_2 = \sqrt{3+\sqrt{5}}}$$

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "SVD of a 2×2 matrix", "steps": [{"prompt": "What is $A^T A$ for $A = \\begin{pmatrix} 2 & 1 \\\\ 0 & 1 \\end{pmatrix}$?", "hint": "Multiply the transpose by the original matrix element-wise.", "answer": "$A^T A = \\begin{pmatrix} 4 & 2 \\\\ 2 & 2 \\end{pmatrix}$"}, {"prompt": "Find the eigenvalues of $A^T A = \\begin{pmatrix} 4 & 2 \\\\ 2 & 2 \\end{pmatrix}$.", "hint": "Solve $\\det(A^T A - \\lambda I) = 0$: $(4-\\lambda)(2-\\lambda) - 4 = 0$.", "answer": "$\\lambda_1 = 3 + \\sqrt{5} \\approx 5.236$, $\\lambda_2 = 3 - \\sqrt{5} \\approx 0.764$"}, {"prompt": "What are the singular values of $A$?", "hint": "Singular values are square roots of eigenvalues of $A^T A$.", "answer": "$\\sigma_1 = \\sqrt{3 + \\sqrt{5}} \\approx 2.288$, $\\sigma_2 = \\sqrt{3 - \\sqrt{5}} \\approx 0.874$"}], "caption": "Use eigenvalues of $A^T A$ to find singular values."}
```
