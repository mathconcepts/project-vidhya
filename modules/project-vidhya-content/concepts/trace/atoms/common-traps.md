---
id: trace.common_traps
concept_id: trace
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Mixing up trace with determinant, or summing the whole matrix**

The trace of a matrix, $\text{tr}(A)$, is just the sum of the numbers sitting on the main diagonal — $\text{tr}(A) = a_{11} + a_{22} + \cdots + a_{nn}$ — nothing else. Some students add up every entry in $A$ instead, or confuse it with the determinant (a different, product-based number that tells you about volume-scaling, not diagonal-summing). Always identify the main diagonal first, before you sum anything.

**Trap 2: Thinking the cyclic property lets you reverse, not just rotate**

The cyclic property says $\text{tr}(ABC) = \text{tr}(BCA) = \text{tr}(CAB)$ — you're allowed to rotate the order, moving the first matrix to the back, again and again. That's rotation. But $\text{tr}(ABC) \ne \text{tr}(ACB)$ in general — swapping two matrices around is a different move (reversal), and it breaks the property. Only cyclic rotations preserve trace.

**Trap 3: Doubting that trace survives a change of basis**

A "basis" is just the set of reference vectors you're measuring everything against, and a similarity transform, $A \to PAP^{-1}$, is how a change of basis looks in matrix form. Trace doesn't care: $\text{tr}(PAP^{-1}) = \text{tr}(A)$. Some students think eigenvalues (a matrix's special scaling numbers) shift too when basis changes — they don't, and neither does trace. Both are invariants, meaning they stay fixed no matter which basis you use. Trust this; don't second-guess it.

**Trap 4: Assuming trace distributes over multiplication the way it does over addition**

Trace is linear over addition — it splits cleanly: $\text{tr}(A+B) = \text{tr}(A) + \text{tr}(B)$. But multiplication doesn't behave the same way: $\text{tr}(AB) \ne \text{tr}(A) \cdot \text{tr}(B)$. Don't assume it does just because addition was well-behaved. Instead, use the cyclic property from Trap 2: $\text{tr}(AB) = \text{tr}(BA)$.

