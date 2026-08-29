---
id: orthogonality.interleaved-drill
concept_id: orthogonality
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: orthogonality.micro-exercise
---

**Cross-concept check: orthogonality → symmetric matrices.**

$A = \begin{pmatrix} 3 & 1 & 1 \\ 1 & 3 & 1 \\ 1 & 1 & 3 \end{pmatrix}$ is symmetric, with eigenvalues $5, 2, 2$ (verified: $\text{tr}(A) = 9 = 5+2+2$, $\det(A) = 20 = 5 \cdot 2 \cdot 2$).

Eigenvectors: $\mathbf{v}_1 = (1,1,1)$ for $\lambda = 5$; $\mathbf{v}_2 = (-1,0,1)$ and $\mathbf{v}_3 = (-1,1,0)$ for $\lambda = 2$.

**Question 1 (orthogonality):** Compute $\mathbf{v}_1 \cdot \mathbf{v}_2$. Is the result a coincidence of this matrix?

*Answer:* $\mathbf{v}_1 \cdot \mathbf{v}_2 = -1 + 0 + 1 = 0$. Not a coincidence — it is forced. For symmetric $A$ with $A\mathbf{u} = \lambda\mathbf{u}$, $A\mathbf{v} = \mu\mathbf{v}$:
$$\lambda(\mathbf{u}\cdot\mathbf{v}) = (A\mathbf{u})\cdot\mathbf{v} = \mathbf{u}\cdot(A\mathbf{v}) = \mu(\mathbf{u}\cdot\mathbf{v}) \implies (\lambda - \mu)(\mathbf{u}\cdot\mathbf{v}) = 0$$
With $\lambda \neq \mu$, the dot product must vanish. (Check: $\mathbf{v}_1 \cdot \mathbf{v}_3 = -1+1+0 = 0$ ✓ too.)

**Question 2 (orthogonality):** $\mathbf{v}_2$ and $\mathbf{v}_3$ both belong to $\lambda = 2$. Are *they* orthogonal?

*Answer:* $\mathbf{v}_2 \cdot \mathbf{v}_3 = 1 + 0 + 0 = 1 \neq 0$. **No.** Symmetry guarantees orthogonality *across distinct* eigenvalues only — never *within* a repeated eigenspace. To build the orthogonal $Q$, run Gram-Schmidt inside that eigenspace:
$$\mathbf{u}_3 = \mathbf{v}_3 - \tfrac{\mathbf{v}_3\cdot\mathbf{v}_2}{\mathbf{v}_2\cdot\mathbf{v}_2}\mathbf{v}_2 = (-1,1,0) - \tfrac{1}{2}(-1,0,1) = \left(-\tfrac{1}{2}, 1, -\tfrac{1}{2}\right) \propto (-1, 2, -1)$$
Check: $(-1,0,1)\cdot(-1,2,-1) = 1 + 0 - 1 = 0$ ✓ and $(1,1,1)\cdot(-1,2,-1) = 0$ ✓.

**Why this drill exists:** students memorise "symmetric ⇒ orthogonal eigenvectors" and then assume *any* eigenbasis they compute is already orthogonal. The guarantee is conditional on distinct eigenvalues; a repeated eigenvalue leaves you free to pick a skewed basis, and you must orthogonalise it yourself.
