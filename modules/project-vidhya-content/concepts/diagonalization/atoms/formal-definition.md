---
id: diagonalization.formal-definition
concept_id: diagonalization
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Diagonalization**: A matrix $A \in \mathbb{R}^{n \times n}$ is **diagonalizable** if there exist a matrix $P$ with linearly independent columns and a diagonal matrix $D$ such that:
$$A = PDP^{-1}$$

The columns of $P$ are eigenvectors of $A$, and the diagonal entries of $D$ are the corresponding eigenvalues.

**Diagonalization Condition**: $A$ is diagonalizable if and only if $A$ has $n$ linearly independent eigenvectors (geometric multiplicity = algebraic multiplicity for each eigenvalue).

**Power Formula**: If $A = PDP^{-1}$, then:
$$A^k = PD^kP^{-1}$$

For diagonal $D$, $D^k$ is just the diagonal entries raised to the $k$-th power.

**Method selector.** Diagonalize only once every eigenvalue's geometric multiplicity has been checked against its algebraic multiplicity — not the moment the characteristic polynomial factors into $n$ real roots. Factoring completely is the tempting stopping point, but a repeated root with a deficient eigenspace (geometric multiplicity $<$ algebraic multiplicity) still blocks $A=PDP^{-1}$ even though every root is accounted for.
