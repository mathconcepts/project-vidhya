---
# Alternative body for symmetric-matrices.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: symmetric-matrices.worked-example.assured
concept_id: symmetric-matrices
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: symmetric-matrices.worked_example
for_stance: assured
---

$A = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix} = A^T$ by inspection, so both guarantees are live before a single equation is solved: eigenvalues real, eigenvectors perpendicular.

$\operatorname{tr}(A) = 5$, $\det(A) = 5$ give $\lambda^2 - 5\lambda + 5 = 0$ straight off — $\lambda = \frac{5\pm\sqrt5}{2}$, irrational but real, matching the promise.

**The orthogonality check without decimals.** $\mathbf{v}_i \propto (1, \lambda_i - 2)$, so $\mathbf{v}_1\cdot\mathbf{v}_2 = 1 + (\lambda_1-2)(\lambda_2-2)$. Expand using $\lambda_1+\lambda_2=5$, $\lambda_1\lambda_2=5$ rather than the surds directly: $(\lambda_1-2)(\lambda_2-2) = \lambda_1\lambda_2 - 2(\lambda_1+\lambda_2) + 4 = -1$, so the dot product is $0$. Symmetric-matrix questions built on irrational eigenvalues are exactly where this identity earns its keep — plugging in $\sqrt5$ directly invites an arithmetic slip that the trace/determinant route avoids entirely.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Symmetric matrix decomposition","steps":[{"prompt":"Verify that $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix}$ is symmetric.","hint":"Compute $A^T$ and check if it equals $A$.","answer":"$A^T = \\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix} = A$. Yes, it is symmetric."},{"prompt":"Find the eigenvalues by solving $\\det(A - \\lambda I) = 0$.","hint":"Expand $(2-\\lambda)(3-\\lambda) - 1 = 0$ and solve the quadratic.","answer":"$\\lambda^2 - 5\\lambda + 5 = 0 \\Rightarrow \\lambda = \\frac{5 \\pm \\sqrt{5}}{2}$. Both are real."},{"prompt":"Show that eigenvectors for $\\lambda_1$ and $\\lambda_2$ are orthogonal.","hint":"Use $\\lambda_1\\lambda_2 = 5$ and $\\lambda_1 + \\lambda_2 = 5$ to compute $(\\lambda_1-2)(\\lambda_2-2)$.","answer":"$(\\lambda_1-2)(\\lambda_2-2) = 5 - 10 + 4 = -1$, so $\\mathbf{v}_1 \\cdot \\mathbf{v}_2 = 0$."}],"caption":"Explore the spectral decomposition step-by-step."}
```
