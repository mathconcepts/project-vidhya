---
id: matrix-norms.worked-example
concept_id: matrix-norms
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find $\|A\|_F$, $\|A\|_1$, and $\kappa_2(A)$ for $A=\begin{pmatrix}4&1\\0&2\end{pmatrix}$.

---

**Step 1 — Frobenius norm.** $\|A\|_F=\sqrt{4^2+1^2+0^2+2^2}=\sqrt{21}\approx4.58$.

---

**Step 2 — 1-norm (max column sum).** Column sums: $|4|+|0|=4$, $|1|+|2|=3$. $\|A\|_1=\max(4,3)=4$.

---

**Step 3 — Singular values via $A^TA$.** $A^TA=\begin{pmatrix}16&4\\4&5\end{pmatrix}$. Characteristic equation: $(16-\lambda)(5-\lambda)-16=\lambda^2-21\lambda+64=0$, so $\lambda=\dfrac{21\pm\sqrt{185}}{2}$, giving $\lambda_1\approx17.30$, $\lambda_2\approx3.70$ (check: $\lambda_1+\lambda_2=21=\operatorname{tr}(A^TA)$ ✓, $\lambda_1\lambda_2\approx64=\det(A^TA)$ ✓).

$$\sigma_1=\sqrt{\lambda_1}\approx4.16, \qquad \sigma_2=\sqrt{\lambda_2}\approx1.92$$

---

**Step 4 — Assemble.**

$$\|A\|_2=\sigma_1\approx4.16, \qquad \kappa_2(A)=\frac{\sigma_1}{\sigma_2}\approx2.16$$

$$\boxed{\|A\|_F\approx4.58,\ \|A\|_1=4,\ \kappa_2(A)\approx2.16}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: three different matrix norms, same matrix","steps":[{"prompt":"Why does computing $\\|A\\|_2$ and $\\kappa_2(A)$ require finding eigenvalues of $A^TA$ rather than eigenvalues of $A$ itself?","hint":"$\\|A\\|_2$ is defined via the singular values of $A$, not its eigenvalues — and singular values come from $A^TA$, a symmetric positive-semidefinite matrix even when $A$ itself isn't symmetric.","answer":"$A$ need not be symmetric, so its eigenvalues can be complex or fail to capture how much $A$ stretches vectors in any direction. $A^TA$ is always symmetric positive-semidefinite, so its eigenvalues $\\lambda_i\\geq0$ are real, and the singular values $\\sigma_i=\\sqrt{\\lambda_i}$ correctly measure the maximum and minimum stretch factors — that's exactly what $\\|A\\|_2$ and $\\kappa_2(A)=\\sigma_1/\\sigma_2$ need."},{"prompt":"$\\|A\\|_1=4$ but $\\|A\\|_F\\approx4.58$ and $\\|A\\|_2\\approx4.16$ — three different numbers for the same matrix. Which one should you report if a question just says \"the norm of $A$\" without specifying which?","hint":"There is no single \"the\" norm — each definition (max column sum, sum of squared entries, largest singular value) answers a different question about how $A$ acts.","answer":"None is more correct in general — always check which norm the question names. GATE questions specify explicitly (Frobenius, 1-norm, 2-norm/spectral, or condition number), precisely because these three numbers genuinely differ for the same matrix, as this example shows."}]}
```
