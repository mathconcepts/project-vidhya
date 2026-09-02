---
id: least-squares.interleaved-drill
concept_id: least-squares
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
modality: drill
exam_ids: ["*"]
tested_by_atom: least-squares.micro_exercise
---

**Cross-concept check: least squares → SVD.**

$A = \begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix}$ has full column rank 2, so $A^TA=\begin{pmatrix}3&3\\3&5\end{pmatrix}$ is invertible and the normal equations give the unique $\hat x=(7/6,1/2)$ (worked example, verified).

**Question 1 (least squares):** The normal-equation route needs $A^TA$ invertible. What happens to $\hat x=(A^TA)^{-1}A^Tb$ when $A$'s columns are dependent instead — say a fourth column duplicating an existing one is added?

*Answer:* $A^TA$ becomes singular — it has no inverse, so the formula $\hat x=(A^TA)^{-1}A^Tb$ breaks down entirely. The normal equations $A^TA\hat x=A^Tb$ still hold, but now have infinitely many solutions rather than one.

**Question 2 (SVD):** What does SVD give you in exactly that broken case that the normal equations alone cannot?

*Answer:* The Moore–Penrose pseudoinverse $A^+=V\Sigma^+U^T$ (built from $A=U\Sigma V^T$, inverting only the nonzero singular values) always exists, rank-deficient or not, and $\hat x=A^+b$ is the *minimum-norm* least squares solution — the smallest $\hat x$ among the infinitely many that all minimize $\|b-Ax\|$. When $A$ has full column rank, $A^+=(A^TA)^{-1}A^T$ and the two methods agree exactly; SVD is the version that never breaks.

**Why this drill exists:** the normal equations are taught as *the* method, so a rank-deficient $A$ reads as a dead end rather than a case needing a different, still-honest tool. SVD is that tool — not a replacement for the normal equations, but what they're secretly built from once $\Sigma$ is invertible.
