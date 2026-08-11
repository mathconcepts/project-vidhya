---
id: orthogonality.formal-definition
concept_id: orthogonality
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Orthogonal Vectors**: Vectors $\mathbf{u}, \mathbf{v} \in \mathbb{R}^n$ are orthogonal if:
$$\mathbf{u} \cdot \mathbf{v} = 0$$

**Orthogonal Set**: A set $\{\mathbf{v}_1, \ldots, \mathbf{v}_k\}$ is orthogonal if every pair is orthogonal: $\mathbf{v}_i \cdot \mathbf{v}_j = 0$ for $i \neq j$.

**Orthonormal Set**: A set is orthonormal if it's orthogonal and every vector is unit (normalized): $\|\mathbf{v}_i\| = 1$.

**Orthogonal Matrix**: A square matrix $Q$ is orthogonal if:
$$Q^T Q = QQ^T = I$$

Equivalently, $Q^{-1} = Q^T$. Columns of $Q$ form an orthonormal set.

**Orthogonal Subspaces**: Subspaces $U$ and $V$ of $\mathbb{R}^n$ are orthogonal if every vector in $U$ is orthogonal to every vector in $V$.

**Orthogonal Complement**: For subspace $W$, its orthogonal complement $W^\perp = \{\mathbf{v} : \mathbf{v} \cdot \mathbf{w} = 0 \text{ for all } \mathbf{w} \in W\}$.
