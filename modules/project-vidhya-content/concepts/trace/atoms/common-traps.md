---
id: trace.common_traps
concept_id: trace
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing trace with determinant or sum of all entries**

Students sometimes sum *all* entries of $A$ or confuse trace with the determinant. The trace is **diagonal only**: $\text{tr}(A) = a_{11} + a_{22} + \cdots + a_{nn}$. The determinant is a product-based invariant. Always identify the main diagonal before summing.

**Trap 2: Forgetting the cyclic property applies to rotation, not reversal**

The cyclic property says $\text{tr}(ABC) = \text{tr}(BCA) = \text{tr}(CAB)$—you can *rotate* the product cyclically. But $\text{tr}(ABC) \ne \text{tr}(ACB)$ in general. Reversal breaks the property. Only cyclic permutations preserve trace.

**Trap 3: Misremembering that trace is basis-independent**

If you change basis via a similarity transform $A \to PAP^{-1}$, the trace stays the same: $\text{tr}(PAP^{-1}) = \text{tr}(A)$. Some students think eigenvalues change under basis change—they don't. Nor does trace. Both are invariants. Don't second-guess this.

**Trap 4: Assuming trace distributes over matrix multiplication**

Trace is linear over addition: $\text{tr}(A+B) = \text{tr}(A) + \text{tr}(B)$. But it does **not** distribute over multiplication: $\text{tr}(AB) \ne \text{tr}(A) \cdot \text{tr}(B)$. Instead, use the cyclic property: $\text{tr}(AB) = \text{tr}(BA)$.

