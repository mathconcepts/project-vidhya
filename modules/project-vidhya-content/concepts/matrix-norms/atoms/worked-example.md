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
