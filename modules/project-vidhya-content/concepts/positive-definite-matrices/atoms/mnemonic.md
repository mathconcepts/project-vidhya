---
id: positive-definite-matrices.mnemonic
concept_id: positive-definite-matrices
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Definite" = the sign never wavers.** $\mathbf{x}^T A \mathbf{x} > 0$ in *every* direction, not most of them. Picture the surface $z = \mathbf{x}^T A \mathbf{x}$: a bowl opening upward, touching zero only at the origin. "Indefinite" is the saddle — up one way, down another.

**Sylvester as "nested corners":**

Take the top-left $1\times1$ corner, then the $2\times2$ corner, then the $3\times3$ — walk outward, and every determinant on the way must be strictly positive.

$$D_1 > 0, \quad D_2 > 0, \quad \ldots, \quad D_n = \det(A) > 0$$

**The free disqualifier — check the diagonal first.** Put $\mathbf{x} = \mathbf{e}_i$ (all zeros but a 1 in slot $i$). Then $\mathbf{x}^T A \mathbf{x} = a_{ii}$. So **every diagonal entry of a positive definite matrix must be positive.** One zero or negative entry on the diagonal ends the question in two seconds. Necessary, not sufficient — use it to rule out, never to confirm.

**Sanity-check reflex:** positive definite means all $\lambda_i > 0$, so $\det(A) = \prod \lambda_i > 0$ and $\text{tr}(A) = \sum \lambda_i > 0$. A negative determinant on a symmetric matrix means "not positive definite" without any further work.
