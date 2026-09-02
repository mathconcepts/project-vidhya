---
id: gram-schmidt.formal-definition
concept_id: gram-schmidt
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

Given linearly independent $v_1,\ldots,v_n$ in an inner-product space, the **Gram-Schmidt process** builds an orthogonal sequence $u_1,\ldots,u_n$ by:

$$u_1 = v_1, \qquad u_i = v_i - \sum_{j=1}^{i-1} \frac{\langle v_i, u_j\rangle}{\langle u_j, u_j\rangle}\, u_j \quad (i \ge 2)$$

Normalizing gives an **orthonormal** basis: $e_i = u_i / \|u_i\|$.

**Theorem.** $\langle u_i, u_j\rangle = 0$ for $i \ne j$, and $\text{span}(u_1,\ldots,u_i) = \text{span}(v_1,\ldots,v_i)$ for every $i$ — the process preserves each leading subspace exactly, not just the final one. This is the algorithmic engine behind **QR decomposition**: $A = QR$, where $Q$'s columns are the $e_i$'s and $R$'s entries are the projection coefficients computed along the way.

**Method Selector.** Apply Gram-Schmidt when the resulting basis must still span the *original* set's subspace — not when any orthogonal basis of the ambient space will do. A tempting shortcut for a small, structured problem — finding an orthogonal basis by inspection, or via eigen-decomposition of a symmetric matrix — is often faster, but it does not, in general, span the same subspace as the given independent vectors; Gram-Schmidt is the method that guarantees it.
