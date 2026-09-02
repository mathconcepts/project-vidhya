---
id: matrix-norms.intuition
concept_id: matrix-norms
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

A matrix norm measures how big $A$'s *action* is, not how big its entries look. $\|A\|$ is the largest amount any unit-length vector can grow when multiplied by $A$: $\|A\|=\max_{\|v\|=1}\|Av\|$.

Feed the unit circle through $A$ and it comes out as an ellipse. The long semi-axis has length $\sigma_{\max}=\|A\|_2$, the short one $\sigma_{\min}$. Both are **singular values** — reachable from $A^TA$'s eigenvalues, $\sigma_i=\sqrt{\lambda_i(A^TA)}$, since $A^TA$ is always symmetric positive semi-definite.

The **condition number** $\kappa_2(A)=\sigma_{\max}/\sigma_{\min}$ compares the two axes. A circular ellipse ($\kappa\approx1$) means $A$ treats every direction about the same — round-trip errors stay proportional. A thin, cigar-shaped ellipse ($\kappa\gg1$) means one direction is almost swallowed while another survives nearly untouched; invert $A$ and the swallowed direction gets blown back up, amplifying whatever noise rode along with it.

Other norms measure size differently: $\|A\|_1$ is the largest column sum, $\|A\|_F$ treats $A$ as one long vector and takes its Euclidean length. Only $\sigma_{\max}$ answers "how much can $A$ stretch *any* input," which is why $\|A\|_2$ specifically drives conditioning.
