---
id: matrix-norms.common-traps
concept_id: matrix-norms
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: matrix-norms.micro-exercise
---

**Trap 1 — Spectral norm mistaken for spectral radius.** $\|A\|_2=\sigma_{\max}(A)$; $\rho(A)=\max|\lambda_i(A)|$. These agree only when $A$ is symmetric (normal). $A=\begin{pmatrix}0&1\\0&0\end{pmatrix}$ has $\rho(A)=0$ but $\|A\|_2=1$ — a shear stretching a direction with no eigenvalue attached to it.

**Trap 2 — Condition number treated as norm-independent.** $\kappa_1(A)$, $\kappa_2(A)$, $\kappa_\infty(A)$ can differ. Comparing a computed $\kappa_2$ against a threshold quoted in $\kappa_1$ silently changes the question.

**Trap 3 — $\kappa(A)<1$ accepted as a valid answer.** $\kappa(A)\geq1$ always. A computed value below $1$ signals an arithmetic mistake, not an unusually well-conditioned matrix.

**Trap 4 — Small determinant read as ill-conditioning.** $\det(cA)=c^n\det(A)$ scales with $c$; $\kappa(cA)=\kappa(A)$ does not. Scaling a matrix can shrink its determinant toward zero without moving its condition number at all.
