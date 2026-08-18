---
# Alternative body for spectral-theorem.worked-example, served when the learner stance is
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
id: spectral-theorem.worked-example.assured
concept_id: spectral-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: spectral-theorem.worked-example
for_stance: assured
---

$A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix} = A^T$: $\operatorname{tr}=4$, $\det=3$ give $\lambda^2-4\lambda+3=0$, so $\lambda=1,3$ without ever writing $A-\lambda I$.

Eigenvectors: $(1,-1)$ and $(1,1)$, already orthogonal by symmetry — normalize both by $\tfrac{1}{\sqrt2}$ and you have $Q$. That step never needs a Gram-Schmidt correction here, because a symmetric matrix's eigenvectors from distinct eigenvalues are automatically perpendicular; verify that, don't derive it fresh.

$$\sqrt{A} = Q\sqrt{\Lambda}Q^T = \frac{1}{2}\begin{pmatrix} 1+\sqrt3 & \sqrt3-1 \\ \sqrt3-1 & 1+\sqrt3 \end{pmatrix}$$

**The general move:** any function applied entrywise to $\Lambda$, sandwiched between $Q$ and $Q^T$, defines that function of $A$ — $e^A$, $A^{-1/2}$, $A^k$ for negative or fractional $k$, all read off the same $Q$. Only the diagonal changes.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Spectral decomposition of 2×2 symmetric matrix","steps":[{"prompt":"Set up the characteristic equation for $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$. Expand $(2-\\lambda)^2 - 1 = 0$. What are the eigenvalues?","hint":"Expand to get $\\lambda^2 - 4\\lambda + 3 = 0$. This factors as $(\\lambda - 1)(\\lambda - 3) = 0$.","answer":"$\\lambda_1 = 1$, $\\lambda_2 = 3$"},{"prompt":"For $\\lambda_1 = 1$, solve $(A - I)\\mathbf{v} = 0$. The unnormalized eigenvector has the form $\\begin{pmatrix} a \\\\ b \\end{pmatrix}$. Find $a$ and $b$.","hint":"The equation $\\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}\\begin{pmatrix} a \\\\ b \\end{pmatrix} = 0$ gives $a + b = 0$. Choose $a = 1$.","answer":"$a = 1, b = -1$. Normalized: $\\mathbf{q}_1 = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}$"},{"prompt":"For $\\lambda_2 = 3$, solve $(A - 3I)\\mathbf{v} = 0$ and normalize. What is $\\mathbf{q}_2$?","hint":"The equation $\\begin{pmatrix} -1 & 1 \\\\ 1 & -1 \\end{pmatrix}\\begin{pmatrix} a \\\\ b \\end{pmatrix} = 0$ gives $a = b$. Normalize to unit length.","answer":"$\\mathbf{q}_2 = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$"},{"prompt":"Now form the matrix $Q$ with $\\mathbf{q}_1$ and $\\mathbf{q}_2$ as columns. Verify that $Q^T Q = I$.","hint":"$Q = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ -1 & 1 \\end{pmatrix}$. Compute $Q^T Q$ — all diagonal entries should be 1 and off-diagonal should be 0.","answer":"$Q^T Q = I$ ✓. The columns are orthonormal."}],"caption":"Key steps: find real eigenvalues → find orthonormal eigenvectors → form $Q$ → verify orthogonality."}
```
