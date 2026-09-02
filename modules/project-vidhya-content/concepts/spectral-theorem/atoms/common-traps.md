---
id: spectral-theorem.common-traps
concept_id: spectral-theorem
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Forgetting to normalize eigenvectors.** To "normalize" a vector means scaling it so its length becomes exactly 1 (a unit vector). Eigenvectors that are merely orthogonal (at right angles to each other) don't automatically make $Q$ an orthogonal matrix — that needs $Q^TQ=I$, which also demands unit length, not just perpendicular directions. Skip the normalizing step and $A=Q\Lambda Q^T$ will fail, even though the eigenvector directions themselves were correct.

**Trap 2 — Confusing $Q\Lambda Q^T$ with $Q\Lambda Q^{-1}$.** These two formulas only agree because $Q^{-1}=Q^T$ holds specifically for an orthogonal $Q$ — a shortcut, not a coincidence that works everywhere. For a non-symmetric matrix, its eigenvector matrix is generally not orthogonal, so writing $Q\Lambda Q^T$ there is simply wrong; you'd need the true inverse, $Q^{-1}$.

**Trap 3 — Assuming $Q$ is unique.** When an eigenvalue repeats, its eigenspace (the full set of eigenvectors sharing that eigenvalue) has more than one dimension, so there are infinitely many valid orthonormal bases — sets of mutually perpendicular, unit-length vectors — you could pick for it. $\Lambda$, the diagonal matrix of eigenvalues, is unique up to reordering. $Q$ is not — say "a possible $Q$," not "the $Q$."

**Trap 4 — Applying the theorem to non-symmetric matrices.** The spectral theorem's promise — real eigenvalues and a full set of orthonormal (mutually perpendicular, unit-length) eigenvectors — is guaranteed only when $A$ is symmetric. Before reaching for $A=Q\Lambda Q^T$, verify $A^T=A$ first; skip this check and the whole method can quietly fall apart.

**Trap 5 — Applying $f$ to the wrong object.** When computing a function of a matrix via $f(A)=Qf(\Lambda)Q^T$, the function $f$ is applied entrywise only to $\Lambda$'s diagonal — one eigenvalue at a time — never to $Q$ itself. $Q$ just carries the eigenvector directions along unchanged.
