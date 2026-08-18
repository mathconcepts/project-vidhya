---
# Alternative body for spectral-theorem.worked-example, served when the learner
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
id: spectral-theorem.worked-example.shaken
concept_id: spectral-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: spectral-theorem.worked-example
for_stance: shaken
---

**Matrix:** $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$. **Goal:** write $A = Q\Lambda Q^T$, then use it to find $\sqrt{A}$.

---

**Step 1 — eigenvalues.**

$$(2-\lambda)^2 - 1 = 0 \;\Rightarrow\; \lambda^2 - 4\lambda + 3 = 0 \;\Rightarrow\; (\lambda-1)(\lambda-3) = 0$$

$$\boxed{\lambda_1 = 1, \quad \lambda_2 = 3}$$

---

**Step 2 — orthonormal eigenvectors.**

$\lambda_1=1$: $(A-I)\mathbf{v}=0 \Rightarrow v_1+v_2=0 \Rightarrow \mathbf{q}_1 = \frac{1}{\sqrt2}\begin{pmatrix}1\\-1\end{pmatrix}$

$\lambda_2=3$: $(A-3I)\mathbf{v}=0 \Rightarrow v_1=v_2 \Rightarrow \mathbf{q}_2 = \frac{1}{\sqrt2}\begin{pmatrix}1\\1\end{pmatrix}$

$$Q = \frac{1}{\sqrt2}\begin{pmatrix}1&1\\-1&1\end{pmatrix}, \qquad \Lambda = \begin{pmatrix}1&0\\0&3\end{pmatrix}$$

Check: $Q^TQ = I$ ✓

---

**Step 3 — $\sqrt{A}$.**

Take the square root entry by entry, only on $\Lambda$:

$$\sqrt{A} = Q\sqrt{\Lambda}Q^T = Q\begin{pmatrix}1&0\\0&\sqrt3\end{pmatrix}Q^T$$

$$= \frac{1}{2}\begin{pmatrix}1+\sqrt3 & \sqrt3-1 \\ \sqrt3-1 & 1+\sqrt3\end{pmatrix}$$

Check: square it back and you should land on $A$. $(\sqrt{A})^2 = A$ ✓

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Spectral decomposition of 2×2 symmetric matrix","steps":[{"prompt":"Set up the characteristic equation for $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$. Expand $(2-\\lambda)^2 - 1 = 0$. What are the eigenvalues?","hint":"Expand to get $\\lambda^2 - 4\\lambda + 3 = 0$. This factors as $(\\lambda - 1)(\\lambda - 3) = 0$.","answer":"$\\lambda_1 = 1$, $\\lambda_2 = 3$"},{"prompt":"For $\\lambda_1 = 1$, solve $(A - I)\\mathbf{v} = 0$. The unnormalized eigenvector has the form $\\begin{pmatrix} a \\\\ b \\end{pmatrix}$. Find $a$ and $b$.","hint":"The equation $\\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}\\begin{pmatrix} a \\\\ b \\end{pmatrix} = 0$ gives $a + b = 0$. Choose $a = 1$.","answer":"$a = 1, b = -1$. Normalized: $\\mathbf{q}_1 = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}$"},{"prompt":"For $\\lambda_2 = 3$, solve $(A - 3I)\\mathbf{v} = 0$ and normalize. What is $\\mathbf{q}_2$?","hint":"The equation $\\begin{pmatrix} -1 & 1 \\\\ 1 & -1 \\end{pmatrix}\\begin{pmatrix} a \\\\ b \\end{pmatrix} = 0$ gives $a = b$. Normalize to unit length.","answer":"$\\mathbf{q}_2 = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$"},{"prompt":"Now form the matrix $Q$ with $\\mathbf{q}_1$ and $\\mathbf{q}_2$ as columns. Verify that $Q^T Q = I$.","hint":"$Q = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ -1 & 1 \\end{pmatrix}$. Compute $Q^T Q$ — all diagonal entries should be 1 and off-diagonal should be 0.","answer":"$Q^T Q = I$ ✓. The columns are orthonormal."}],"caption":"Key steps: find real eigenvalues → find orthonormal eigenvectors → form $Q$ → verify orthogonality."}
```
