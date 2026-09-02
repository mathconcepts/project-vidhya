---
id: jordan-normal-form.intuition
concept_id: jordan-normal-form
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Diagonalization's promise is a set of independent "stubborn directions" — eigenvectors — that together span the whole space. Each one satisfies $Av=\lambda v$ on its own, decoupled from every other direction.

A defective matrix breaks that promise: a repeated eigenvalue offers fewer independent eigenvectors than its multiplicity demands. Jordan form is the fallback. Instead of every direction being independent, some are chained: $v$ is a true eigenvector ($Av=\lambda v$), and $w$ is a **generalized eigenvector** one step behind it, satisfying $(A-\lambda I)w=v$, i.e. $Aw=\lambda w+v$.

Picture a relay chain: $v$ scales cleanly by $\lambda$, and $w$ scales by $\lambda$ too, but also gets *dragged along* by $v$'s contribution. Apply $A$ repeatedly and that drag compounds — $A^n w$ grows like $\lambda^n w$ from $w$'s own scaling, plus an extra term inherited from $v$ that grows like $n\lambda^{n-1}$. That extra polynomial factor, absent from any diagonalizable matrix, is the fingerprint of a genuine Jordan block.

Every square matrix — defective or not — has a Jordan form. Diagonal matrices are simply the case with no chains at all: every eigenvector already stands alone.
