---
id: positive-definite-matrices.mnemonic
concept_id: positive-definite-matrices
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"Definite" = the sign never wavers.** $\mathbf{x}^T A \mathbf{x} > 0$ in *every* direction, not most of them. Picture the surface $z = \mathbf{x}^T A \mathbf{x}$: a bowl opening upward, touching zero only at the origin. "Indefinite" is the saddle — up one way, down another.

**Sylvester as "nested corners":** take the top-left $1\times1$ corner, then the $2\times2$ corner, then the $3\times3$ — walk outward, and every determinant on the way must be strictly positive.

$$D_1 > 0, \quad D_2 > 0, \quad \ldots, \quad D_n = \det(A) > 0$$

**The free disqualifier — check the diagonal first.** Put $\mathbf{x} = \mathbf{e}_i$. Then $\mathbf{x}^T A \mathbf{x} = a_{ii}$, so every diagonal entry of a positive definite matrix must be positive. One zero or negative entry ends the question in two seconds. Necessary, not sufficient — use it to rule out, never to confirm.

**Sanity-check reflex:** all $\lambda_i > 0$ forces $\det(A) = \prod \lambda_i > 0$ and $\text{tr}(A) = \sum \lambda_i > 0$. A negative determinant on a symmetric matrix ends the question immediately.
