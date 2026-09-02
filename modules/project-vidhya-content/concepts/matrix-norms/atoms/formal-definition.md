---
id: matrix-norms.formal-definition
concept_id: matrix-norms
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

For $A\in\mathbb{R}^{m\times n}$, common **induced/entrywise norms**:

$$\|A\|_1=\max_j\sum_i|a_{ij}| \ (\text{max column sum}), \qquad \|A\|_\infty=\max_i\sum_j|a_{ij}| \ (\text{max row sum})$$

$$\|A\|_2=\sigma_{\max}(A)=\sqrt{\lambda_{\max}(A^TA)}, \qquad \|A\|_F=\sqrt{\sum_{i,j}a_{ij}^2}$$

The **condition number** $\kappa_2(A)=\|A\|_2\|A^{-1}\|_2=\sigma_{\max}/\sigma_{\min}$ bounds relative error amplification when solving $Ax=b$: a relative perturbation $\delta b/b$ can produce a relative error in $x$ up to $\kappa_2(A)$ times larger.

Use $\kappa_2$, not $\rho(A)$, whenever the question is about sensitivity of a linear system or the true worst-case stretch of $A$. A tempting-but-wrong substitute is the spectral radius $\rho(A)=\max|\lambda_i|$: it agrees with $\|A\|_2$ only when $A$ is symmetric (or normal), and can be badly wrong otherwise — a nilpotent shear has $\rho(A)=0$ but stretches some vector by a positive, computable amount.
