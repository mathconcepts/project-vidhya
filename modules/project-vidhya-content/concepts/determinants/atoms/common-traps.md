---
id: determinants.common-traps
concept_id: determinants
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Sign errors in cofactor expansion**: Students forget the alternating sign pattern (+, -, +, -, ...) in cofactor expansion. The cofactor of element $a_{ij}$ has sign $(-1)^{i+j}$.
- **Confusing 2×2 and 3×3 scaling**: When scaling a matrix by scalar $c$, the determinant scales by $c^n$ (where $n$ is the matrix size). So $\det(2A)$ for a $2 \times 2$ matrix $A$ is $4 \det(A)$, not $2 \det(A)$.
- **Ignoring zero rows/columns**: If a matrix has a row or column of all zeros, $\det(A) = 0$ immediately — no need to compute anything else. Students often overlook this fast check.
