---
# Alternative body for matrix-norms.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching the ellipse picture.
id: matrix-norms.intuition.assured
concept_id: matrix-norms
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: matrix-norms.intuition
for_stance: assured
---

$\|A\|_2=\sigma_{\max}$ and $\kappa_2(A)=\sigma_{\max}/\sigma_{\min}$ are the two numbers that actually matter for numerical sensitivity; every other norm is a computational shortcut toward the same idea.

## What actually costs marks

**Spectral norm $\neq$ spectral radius, in general.** $\|A\|_2=\sigma_{\max}(A)$, while $\rho(A)=\max|\lambda_i(A)|$. These coincide for symmetric (normal) $A$, but not otherwise: $A=\begin{pmatrix}0&1\\0&0\end{pmatrix}$ has $\rho(A)=0$ (both eigenvalues zero) yet $\|A\|_2=1$ — a non-symmetric matrix can stretch a direction it has no eigenvalue attached to.

**$\kappa(A)\geq1$ always,** with equality only when $A$ is a scalar multiple of an orthogonal matrix. A computed $\kappa<1$ is an arithmetic error, not a well-conditioned surprise.

**Determinant size is not conditioning.** $\kappa(cA)=\kappa(A)$ for any scalar $c\neq0$, while $\det(cA)=c^n\det(A)$ — scaling a matrix changes how singular it *looks* without touching how sensitive it *is*.
