---
# Alternative body for matrix-norms.worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# Prose is held at or below the base atom's length; every step is written
# out in full with an explicit check, no praise, no reassurance.
id: matrix-norms.worked-example.shaken
concept_id: matrix-norms
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-norms.worked-example
for_stance: shaken
---

**Problem:** $\|A\|_F$, $\|A\|_1$, $\kappa_2(A)$ for $A=\begin{pmatrix}4&1\\0&2\end{pmatrix}$.

---

**Step 1 — square, add, root.**

$$\|A\|_F=\sqrt{4^2+1^2+0^2+2^2}=\sqrt{21}\approx4.58$$

---

**Step 2 — column sums, take the max.**

Column 1: $4+0=4$. Column 2: $1+2=3$. $\|A\|_1=\max(4,3)=4$.

---

**Step 3 — form $A^TA$, find eigenvalues.**

$$A^TA=\begin{pmatrix}16&4\\4&5\end{pmatrix}, \quad (16-\lambda)(5-\lambda)-16=\lambda^2-21\lambda+64=0$$

$$\lambda=\frac{21\pm\sqrt{185}}{2}\approx17.30,\ 3.70$$

Check: $17.30+3.70=21=\operatorname{tr}(A^TA)$ ✓, $17.30\times3.70\approx64=\det(A^TA)$ ✓.

---

**Step 4 — root, divide.**

$$\sigma_1\approx\sqrt{17.30}\approx4.16, \quad \sigma_2\approx\sqrt{3.70}\approx1.92$$

$$\boxed{\|A\|_F\approx4.58,\ \|A\|_1=4,\ \kappa_2(A)=\sigma_1/\sigma_2\approx2.16}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: three different matrix norms, same matrix","steps":[{"prompt":"Why does computing $\\|A\\|_2$ and $\\kappa_2(A)$ require finding eigenvalues of $A^TA$ rather than eigenvalues of $A$ itself?","hint":"$\\|A\\|_2$ is defined via the singular values of $A$, not its eigenvalues — and singular values come from $A^TA$, a symmetric positive-semidefinite matrix even when $A$ itself isn't symmetric.","answer":"$A$ need not be symmetric, so its eigenvalues can be complex or fail to capture how much $A$ stretches vectors in any direction. $A^TA$ is always symmetric positive-semidefinite, so its eigenvalues $\\lambda_i\\geq0$ are real, and the singular values $\\sigma_i=\\sqrt{\\lambda_i}$ correctly measure the maximum and minimum stretch factors — that's exactly what $\\|A\\|_2$ and $\\kappa_2(A)=\\sigma_1/\\sigma_2$ need."},{"prompt":"$\\|A\\|_1=4$ but $\\|A\\|_F\\approx4.58$ and $\\|A\\|_2\\approx4.16$ — three different numbers for the same matrix. Which one should you report if a question just says \"the norm of $A$\" without specifying which?","hint":"There is no single \"the\" norm — each definition (max column sum, sum of squared entries, largest singular value) answers a different question about how $A$ acts.","answer":"None is more correct in general — always check which norm the question names. GATE questions specify explicitly (Frobenius, 1-norm, 2-norm/spectral, or condition number), precisely because these three numbers genuinely differ for the same matrix, as this example shows."}]}
```
