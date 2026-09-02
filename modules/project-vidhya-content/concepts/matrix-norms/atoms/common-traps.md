---
id: matrix-norms.common-traps
concept_id: matrix-norms
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: matrix-norms.micro-exercise
---

**Trap 1 — Spectral norm mistaken for spectral radius.** $\|A\|_2=\sigma_{\max}(A)$ is the biggest stretch $A$ applies to any vector. $\rho(A)=\max|\lambda_i(A)|$ only looks at the eigenvalues — the special numbers $\lambda$ solving $Av=\lambda v$. The two match only when $A$ is symmetric (normal). $A=\begin{pmatrix}0&1\\0&0\end{pmatrix}$ has $\rho(A)=0$ but $\|A\|_2=1$: a shear that stretches a direction with no eigenvalue attached to it.

**Trap 2 — Condition number treated as norm-independent.** The condition number $\kappa(A)$ tells you how much small errors get amplified when solving $Ax=b$ — but its value depends on which norm you measure it in. $\kappa_1(A)$, $\kappa_2(A)$, $\kappa_\infty(A)$ can all differ. Comparing a computed $\kappa_2$ against a threshold quoted in $\kappa_1$ silently answers a different question than the one that was asked.

**Trap 3 — $\kappa(A)<1$ accepted as a valid answer.** $\kappa(A)\geq1$ always, by definition. A computed value below $1$ means you've made an arithmetic slip somewhere — it's never a sign of an unusually well-conditioned matrix.

**Trap 4 — Small determinant read as ill-conditioning.** $\det(cA)=c^n\det(A)$ scales fast with $c$, but $\kappa(cA)=\kappa(A)$ stays exactly the same. So scaling a matrix down can shrink its determinant toward zero while its condition number doesn't move at all — a small determinant alone doesn't mean the matrix is ill-conditioned.
