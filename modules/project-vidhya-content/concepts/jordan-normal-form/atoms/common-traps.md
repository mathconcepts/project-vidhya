---
id: jordan-normal-form.common-traps
concept_id: jordan-normal-form
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: jordan-normal-form.micro-exercise
---

**Trap 1 — Counting blocks with algebraic multiplicity.** The number of Jordan blocks for $\lambda$ equals its *geometric* multiplicity — $\dim\ker(A-\lambda I)$, i.e. how many independent eigenvectors $\lambda$ has — not its *algebraic* multiplicity (how many times $\lambda$ repeats as a root). A repeated root can still land in just one block.

**Trap 2 — Minimal polynomial exponent read as total block size.** The exponent of $(x-\lambda)$ in the minimal polynomial (the smallest-degree polynomial that "kills" the matrix, i.e. $p(A)=0$) is the size of $\lambda$'s *largest* block only — not the sum of all its blocks' sizes. That sum is the algebraic multiplicity, a different number.

**Trap 3 — "Repeated eigenvalue" assumed to mean defective.** A repeated eigenvalue doesn't automatically mean the matrix is "defective" (short of enough independent eigenvectors to diagonalize). A diagonal matrix with a repeated diagonal entry is still perfectly diagonalizable — geometric multiplicity equals algebraic multiplicity there. Defectiveness is its own separate check; repetition alone proves nothing.

**Trap 4 — Treating $A=J$.** $A$ is not equal to its Jordan form $J$ — it is only *similar* to it: $A = PJP^{-1}$, where $P$ is an invertible "change of basis" matrix. $J$'s entries are not $A$'s entries. And $P$ isn't unique — it depends on which eigenvectors and generalized eigenvectors you picked to build it.
