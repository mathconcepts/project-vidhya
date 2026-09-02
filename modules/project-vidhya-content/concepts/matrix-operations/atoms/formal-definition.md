---
id: matrix-operations.formal-definition
concept_id: matrix-operations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

**Product**: for $A \in \mathbb{R}^{m \times n}$ and $B \in \mathbb{R}^{n \times p}$, $C = AB \in \mathbb{R}^{m \times p}$ is defined entrywise by

$$C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj}$$

**Addition**: for $A, B \in \mathbb{R}^{m \times n}$, $(A+B)_{ij} = A_{ij} + B_{ij}$.

**Scalar multiplication**: $(cA)_{ij} = c \cdot A_{ij}$.

**Transpose**: $(A^T)_{ij} = A_{ji}$ — rows become columns.

Multiplication is associative and distributes over addition, but is **not** commutative: $AB \neq BA$ in general, and $(AB)^T = B^TA^T$ reverses the order.

**Method selector.** Use direct entrywise multiplication when you need one specific entry, or the full matrix if every entry is required — there is no shortcut around the $\sum_k A_{ik}B_{kj}$ formula for a general product. The tempting wrong move is to multiply $A$ and $B$ "elementwise," entry-by-entry in the same position, the way addition works: that operation exists (the Hadamard product) but is a different, rarely-tested object, and it silently gives a wrong-shaped or wrong-valued answer whenever a GATE question means ordinary matrix multiplication.
