---
id: jordan-normal-form.common-traps
concept_id: jordan-normal-form
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: jordan-normal-form.micro-exercise
---

**Trap 1 — Counting blocks with algebraic multiplicity.** The number of Jordan blocks for $\lambda$ is its *geometric* multiplicity, $\dim\ker(A-\lambda I)$ — not the algebraic multiplicity. A repeated root can still be a single block.

**Trap 2 — Minimal polynomial exponent read as total block size.** It's the size of the *largest* block for $\lambda$, not the sum of all blocks' sizes — that sum is the algebraic multiplicity instead.

**Trap 3 — "Repeated eigenvalue" assumed to mean defective.** A diagonal matrix with a repeated diagonal entry is still diagonalizable — geometric multiplicity equals algebraic multiplicity there. Defectiveness is a separate check, never a consequence of repetition alone.

**Trap 4 — Treating $A=J$.** $A$ is only *similar* to $J$: $A=PJP^{-1}$. $J$'s entries are not $A$'s entries, and $P$ depends on the chosen eigenvector/generalized-eigenvector basis.
