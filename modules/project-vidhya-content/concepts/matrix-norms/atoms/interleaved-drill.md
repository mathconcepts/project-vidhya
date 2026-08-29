---
id: matrix-norms.interleaved-drill
concept_id: matrix-norms
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: matrix-norms.micro_exercise
---

**Cross-concept check: matrix norms → SVD.**

$$A = \begin{pmatrix} 3 & 4 \\ 0 & 5 \end{pmatrix}$$

$A$ is upper triangular, so its eigenvalues are its diagonal entries, $3$ and $5$. Its singular values are $\sigma_1 = 3\sqrt5 \approx 6.708$ and $\sigma_2 = \sqrt5 \approx 2.236$ (verified).

**Question 1 (norms → SVD):** $\|A\|_\infty = 7$ and the largest eigenvalue is $5$. Is $\|A\|_2$ equal to $5$?

*Answer:* No. $\|A\|_2$ is the largest **singular** value, not the largest eigenvalue — those coincide only when $A$ is symmetric, and this $A$ is not. Form $A^TA = \begin{pmatrix} 9 & 12 \\ 12 & 41 \end{pmatrix}$; its eigenvalues are $45$ and $5$ (check: trace $9+41 = 50 = 45+5$ ✓, det $369-144 = 225 = 45 \cdot 5$ ✓). Taking square roots, $\sigma_1 = \sqrt{45} = 3\sqrt5 \approx 6.708$, so

$$\|A\|_2 = 3\sqrt5 \approx 6.708 > 5 = \rho(A)$$

The spectral radius is a lower bound for every induced norm; here it is a strictly loose one.

**Question 2 (SVD → norms):** Using only $\sigma_1 = 3\sqrt5$ and $\sigma_2 = \sqrt5$, recover $\|A\|_F$, $\kappa_2(A)$ and $|\det A|$ — without touching the entries of $A$ again.

*Answer:* The singular values carry all three.

- $\|A\|_F = \sqrt{\sigma_1^2 + \sigma_2^2} = \sqrt{45 + 5} = \sqrt{50} \approx 7.071$. Cross-check against the entries: $\sqrt{3^2+4^2+0^2+5^2} = \sqrt{50}$ ✓
- $\kappa_2(A) = \sigma_1/\sigma_2 = 3\sqrt5/\sqrt5 = 3$ — well conditioned
- $|\det A| = \sigma_1 \sigma_2 = 3\sqrt5 \cdot \sqrt5 = 15$. Cross-check: $3 \cdot 5 - 4 \cdot 0 = 15$ ✓

Note $\|A\|_2 \approx 6.708 \le \|A\|_F \approx 7.071$, as it must be.

**Why this drill exists:** the dominant misconception is that the spectral norm reads off eigenvalues. It reads off *singular* values, and this $A$ is the cleanest counterexample — every eigenvalue is smaller than $\|A\|_2$, so the wrong method produces a plausible-looking number ($5$) that no sanity check on $A$'s entries would flag. Anchoring $\|A\|_F$, $\kappa_2$ and $\det$ to the same singular-value pair makes the SVD, not the eigenvalues, the thing you reach for.
