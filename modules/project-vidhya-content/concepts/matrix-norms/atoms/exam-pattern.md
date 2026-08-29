---
id: matrix-norms.exam-pattern
concept_id: matrix-norms
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **Three of the four norms are free; only one costs anything.** For a NAT asking $\|A\|_1$, $\|A\|_\infty$ or $\|A\|_F$, the answer is pure arithmetic on the entries — no eigenvalues, no decomposition. For $A = \begin{pmatrix} 3 & 4 \\ 0 & 5 \end{pmatrix}$: column sums $3$ and $9$ give $\|A\|_1 = 9$; row sums $7$ and $5$ give $\|A\|_\infty = 7$; $\|A\|_F = \sqrt{9+16+25} = \sqrt{50} \approx 7.07$. Under 30 seconds for all three.

- **The signature trap: $\|A\|_2$ is *not* the largest $|\lambda|$.** That same $A$ is triangular, so its eigenvalues are $3$ and $5$ — and the tempting answer $\|A\|_2 = 5$ is wrong. You must go through $A^TA = \begin{pmatrix} 9 & 12 \\ 12 & 41 \end{pmatrix}$, whose eigenvalues are $45$ and $5$, giving $\|A\|_2 = \sqrt{45} = 3\sqrt5 \approx 6.708$. Spectral radius $\rho(A) = 5$ is a strict *lower* bound here, never the answer. $\|A\|_2 = \max|\lambda|$ holds **only** for symmetric (more generally normal) $A$ — check symmetry before using the shortcut.

- **MCQ/MSQ property questions worth pre-loading:**
  - $\|A\|_F = \sqrt{\sum_i \sigma_i^2}$ and $\|A\|_2 = \sigma_{\max}$, so $\|A\|_2 \le \|A\|_F \le \sqrt{r}\,\|A\|_2$ for rank $r$. Above: $45 + 5 = 50 = \|A\|_F^2$ ✓.
  - The Frobenius norm is **not** an induced norm: $\|I_n\|_F = \sqrt n$, while every induced norm gives $\|I_n\| = 1$. This is the standard "which of the following is an operator norm" filter.
  - $\|A\|_2 = \|A^T\|_2$ and $\|A\|_1 = \|A^T\|_\infty$ — a matrix and its transpose swap the tall/wide pair.

- **Condition number is usually the real question.** $\kappa_2(A) = \sigma_{\max}/\sigma_{\min} = 3\sqrt5/\sqrt5 = 3$ for the matrix above. Remember $\kappa \ge 1$ always, and $\kappa(I) = 1$ — a negative or sub-1 answer is arithmetic failure, not an ill-conditioned matrix.

- **Time budget:** entry-arithmetic norms, 30 seconds. A $2\times2$ spectral norm via $A^TA$, about 90 seconds. If a NAT wants $\|A\|_2$ of a $3\times3$ non-symmetric matrix by hand, re-read it — the intended route is almost always a property, not a computation.
