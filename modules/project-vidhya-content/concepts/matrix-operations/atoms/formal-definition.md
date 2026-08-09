---
id: matrix-operations.formal-definition
concept_id: matrix-operations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.16
exam_ids: ["*"]
---

**Matrix Operations**: Given matrices $A \in \mathbb{R}^{m \times n}$ and $B \in \mathbb{R}^{n \times p}$, the product $C = AB \in \mathbb{R}^{m \times p}$ is defined as:
$$C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj}$$

**Addition**: For matrices $A, B \in \mathbb{R}^{m \times n}$:
$$C = A + B \implies C_{ij} = A_{ij} + B_{ij}$$

**Scalar Multiplication**: For scalar $c$ and matrix $A$:
$$cA_{ij} = c \cdot A_{ij}$$

**Transpose**: $A^T_{ij} = A_{ji}$ (swap rows and columns).
