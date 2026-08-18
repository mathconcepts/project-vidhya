---
# Alternative body for symmetric-matrices.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The prose is held at or below the base atom's length — a screen visibly
# longer than the one that already defeated this reader signals difficulty
# no matter how kindly it is written. No praise, no reassurance, and no
# mention of how the reader might be feeling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: symmetric-matrices.worked-example.shaken
concept_id: symmetric-matrices
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: symmetric-matrices.worked_example
for_stance: shaken
---

**Matrix:** $A = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$. Three checks: symmetric? real eigenvalues? orthogonal eigenvectors?

---

**Check 1 — symmetry.**

$$A^T = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix} = A \quad\checkmark$$

---

**Check 2 — eigenvalues.**

$$(2-\lambda)(3-\lambda) - 1 = 0 \;\Rightarrow\; \lambda^2 - 5\lambda + 5 = 0$$

$$\lambda = \frac{5 \pm \sqrt{5}}{2}, \qquad \lambda_1 \approx 4.118,\ \lambda_2 \approx 0.882$$

Both real, as promised.

---

**Check 3 — eigenvectors orthogonal.**

$\mathbf{v}_1 \propto \begin{pmatrix} 1 \\ \lambda_1-2 \end{pmatrix}$, $\mathbf{v}_2 \propto \begin{pmatrix} 1 \\ \lambda_2-2 \end{pmatrix}$.

$$\mathbf{v}_1\cdot\mathbf{v}_2 = 1 + (\lambda_1-2)(\lambda_2-2)$$

Use $\lambda_1+\lambda_2=5$, $\lambda_1\lambda_2=5$ instead of the decimals:

$$(\lambda_1-2)(\lambda_2-2) = \lambda_1\lambda_2 - 2(\lambda_1+\lambda_2) + 4 = 5 - 10 + 4 = -1$$

$$\mathbf{v}_1\cdot\mathbf{v}_2 = 1 + (-1) = 0 \quad\checkmark$$

$$\boxed{\lambda_1 = \tfrac{5+\sqrt5}{2},\ \lambda_2 = \tfrac{5-\sqrt5}{2};\ \text{eigenvectors orthogonal}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Symmetric matrix decomposition","steps":[{"prompt":"Verify that $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix}$ is symmetric.","hint":"Compute $A^T$ and check if it equals $A$.","answer":"$A^T = \\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix} = A$. Yes, it is symmetric."},{"prompt":"Find the eigenvalues by solving $\\det(A - \\lambda I) = 0$.","hint":"Expand $(2-\\lambda)(3-\\lambda) - 1 = 0$ and solve the quadratic.","answer":"$\\lambda^2 - 5\\lambda + 5 = 0 \\Rightarrow \\lambda = \\frac{5 \\pm \\sqrt{5}}{2}$. Both are real."},{"prompt":"Show that eigenvectors for $\\lambda_1$ and $\\lambda_2$ are orthogonal.","hint":"Use $\\lambda_1\\lambda_2 = 5$ and $\\lambda_1 + \\lambda_2 = 5$ to compute $(\\lambda_1-2)(\\lambda_2-2)$.","answer":"$(\\lambda_1-2)(\\lambda_2-2) = 5 - 10 + 4 = -1$, so $\\mathbf{v}_1 \\cdot \\mathbf{v}_2 = 0$."}],"caption":"Explore the spectral decomposition step-by-step."}
```
