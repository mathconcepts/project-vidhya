---
id: matrix-norms.mnemonic
concept_id: matrix-norms
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**Four norms, four instincts:** $\|A\|_1$ reads **down** columns (sum absolute values, take the largest column). $\|A\|_\infty$ reads **across** rows (sum absolute values, take the largest row). $\|A\|_F$ **flattens** the whole matrix into one long vector and takes its ordinary length. $\|A\|_2$ asks the real geometric question: the true worst-case stretch, $\sigma_{\max}$.

**Numeric shortcut:** for a diagonal (or triangular, using the diagonal) matrix, sanity-check $\|A\|_2$ against the largest $|d_i|$ on the diagonal — for a genuinely diagonal matrix they must be exactly equal, since the diagonal entries ARE the singular values there.

$$\kappa_2(A)=\frac{\sigma_{\max}}{\sigma_{\min}}\geq1$$

**Sanity-check reflex:** after computing $\kappa_2$, confirm it's $\geq1$, and confirm the product of all singular values matches $|\det(A)|$ for a square matrix — a condition number under $1$, or a singular-value product missing $|\det(A)|$, means an arithmetic slip upstream.
