---
id: symmetric-matrices.worked_example
concept_id: symmetric-matrices
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
---

**Problem:** Let $A = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$.
(a) Verify that $A$ is symmetric.
(b) Find the eigenvalues of $A$.
(c) Show that the eigenvectors corresponding to the two eigenvalues are orthogonal.

---

**Step 1: Verify symmetry**

Compute $A^T$:
$$A^T = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}^T = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix} = A$$

Since $A = A^T$, the matrix is symmetric. ✓

---

**Step 2: Find eigenvalues**

Solve the characteristic equation $\det(A - \lambda I) = 0$:
$$\det\begin{pmatrix} 2-\lambda & 1 \\ 1 & 3-\lambda \end{pmatrix} = (2-\lambda)(3-\lambda) - 1 = 0$$
$$\lambda^2 - 5\lambda + 5 = 0$$
$$\lambda = \frac{5 \pm \sqrt{25 - 20}}{2} = \frac{5 \pm \sqrt{5}}{2}$$

So $\lambda_1 = \frac{5 + \sqrt{5}}{2} \approx 4.118$ and $\lambda_2 = \frac{5 - \sqrt{5}}{2} \approx 0.882$. 

Both eigenvalues are real (as guaranteed by the spectral theorem). ✓

---

**Step 3: Verify eigenvector orthogonality**

For $\lambda_1$, solve $(A - \lambda_1 I)\mathbf{v}_1 = 0$: eigenvector is $\mathbf{v}_1 \propto \begin{pmatrix} 1 \\ \lambda_1 - 2 \end{pmatrix}$.

For $\lambda_2$, solve $(A - \lambda_2 I)\mathbf{v}_2 = 0$: eigenvector is $\mathbf{v}_2 \propto \begin{pmatrix} 1 \\ \lambda_2 - 2 \end{pmatrix}$.

Orthogonality: compute the dot product
$$\mathbf{v}_1 \cdot \mathbf{v}_2 = 1 \cdot 1 + (\lambda_1 - 2)(\lambda_2 - 2)$$

Expand $(\lambda_1 - 2)(\lambda_2 - 2)$ using $\lambda_1 + \lambda_2 = 5$ and $\lambda_1 \lambda_2 = 5$:
$$(\lambda_1 - 2)(\lambda_2 - 2) = \lambda_1\lambda_2 - 2(\lambda_1 + \lambda_2) + 4 = 5 - 10 + 4 = -1$$

Therefore:
$$\mathbf{v}_1 \cdot \mathbf{v}_2 = 1 + (-1) = 0$$

The eigenvectors are orthogonal. ✓

---

$$\boxed{\text{Eigenvalues: } \lambda_1 = \frac{5+\sqrt{5}}{2}, \lambda_2 = \frac{5-\sqrt{5}}{2}; \text{ eigenvectors are orthogonal}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Symmetric matrix decomposition","steps":[{"prompt":"Verify that $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix}$ is symmetric.","hint":"Compute $A^T$ and check if it equals $A$.","answer":"$A^T = \\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix} = A$. Yes, it is symmetric."},{"prompt":"Find the eigenvalues by solving $\\det(A - \\lambda I) = 0$.","hint":"Expand $(2-\\lambda)(3-\\lambda) - 1 = 0$ and solve the quadratic.","answer":"$\\lambda^2 - 5\\lambda + 5 = 0 \\Rightarrow \\lambda = \\frac{5 \\pm \\sqrt{5}}{2}$. Both are real."},{"prompt":"Show that eigenvectors for $\\lambda_1$ and $\\lambda_2$ are orthogonal.","hint":"Use $\\lambda_1\\lambda_2 = 5$ and $\\lambda_1 + \\lambda_2 = 5$ to compute $(\\lambda_1-2)(\\lambda_2-2)$.","answer":"$(\\lambda_1-2)(\\lambda_2-2) = 5 - 10 + 4 = -1$, so $\\mathbf{v}_1 \\cdot \\mathbf{v}_2 = 0$."}],"caption":"Explore the spectral decomposition step-by-step."}
```