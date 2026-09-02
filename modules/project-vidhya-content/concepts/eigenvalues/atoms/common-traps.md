---
id: eigenvalues.common-traps
concept_id: eigenvalues
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: eigenvalues.micro-exercise.trace
---

**Trap 1 — Sign on the characteristic polynomial.** The characteristic polynomial is what you get from $\det(A - \lambda I)$; setting it to zero and solving for $\lambda$ is how you find the eigenvalues — the special numbers telling you how much a matrix stretches vectors along certain directions. This expansion carries alternating plus and minus signs as it goes. For a $2\times 2$ matrix, the constant term you land on is $\det(A)$ itself, not $-\det(A)$ — a sign a lot of students flip by habit.

**Trap 2 — Forgetting $v \neq 0$.** The eigenvector equation $Av = \lambda v$ is technically true for $v = 0$ too, since any matrix times the zero vector gives zero for any $\lambda$. That's exactly why the zero vector is **never** counted as an eigenvector, by definition — allowing it would make the whole idea meaningless. Watch for this when a problem's algebra spits out $v=0$ as a solution — that branch doesn't count.

**Trap 3 — Repeated eigenvalues.** When an eigenvalue repeats, it doesn't always come with a matching number of independent eigenvectors — sometimes a doubly-repeated eigenvalue has only one. A matrix like this is called defective. Before concluding a matrix is diagonalizable (can be broken down into simple independent directions), check the geometric multiplicity — how many independent eigenvectors an eigenvalue actually has — rather than assuming it matches how many times the eigenvalue repeats.

**Trap 4 — Complex eigenvalues on real matrices.** A matrix full of ordinary real numbers can still have eigenvalues that are complex (involving $i = \sqrt{-1}$) — rotation matrices are an everyday example, since a pure rotation has no real direction it leaves unchanged. Don't assume a matrix's eigenvalues must be real just because every entry in $A$ is real.
