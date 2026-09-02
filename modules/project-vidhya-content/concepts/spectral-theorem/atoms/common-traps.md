---
id: spectral-theorem.common-traps
concept_id: spectral-theorem
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Forgetting to normalize eigenvectors.** Orthogonal eigenvectors alone don't make $Q$ orthogonal — $Q^TQ=I$ needs unit length too. Skip normalizing and $A=Q\Lambda Q^T$ fails even though the eigenvectors were correct.

**Trap 2 — Confusing $Q\Lambda Q^T$ with $Q\Lambda Q^{-1}$.** They're the same formula only because $Q^{-1}=Q^T$ for an orthogonal $Q$. Writing $Q\Lambda Q^T$ for a non-symmetric matrix's (non-orthogonal) eigenvector matrix is simply wrong.

**Trap 3 — Assuming $Q$ is unique.** A repeated eigenvalue has infinitely many valid orthonormal bases for its eigenspace. $\Lambda$ is unique up to reordering; $Q$ is not — say "a possible $Q$."

**Trap 4 — Applying the theorem to non-symmetric matrices.** Real eigenvalues and orthonormal eigenvectors are guaranteed only for symmetric $A$. Verify $A^T=A$ first.

**Trap 5 — Applying $f$ to the wrong object.** $f(A)=Qf(\Lambda)Q^T$ applies $f$ entrywise to $\Lambda$'s diagonal only — never to $Q$.
