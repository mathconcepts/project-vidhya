---
id: svd.exam-pattern
concept_id: svd
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions almost never want $U$ and $V$.** They want one number: a singular value, $\|A\|_2$, $\|A\|_F$, or $\text{rank}(A)$. Stop at $A^T A$ and its eigenvalues — building the orthogonal factors is wasted time you will not be paid for.

- **The signature trap: eigenvalues $\neq$ singular values.** GATE sets this deliberately with a nilpotent or defective matrix.

  Take $A = \begin{pmatrix} 0 & 2 \\ 0 & 0 \end{pmatrix}$. Its eigenvalues are $0, 0$ (triangular — read the diagonal). But $A^T A = \begin{pmatrix} 0 & 0 \\ 0 & 4 \end{pmatrix}$, so the singular values are $2, 0$. So $\text{rank}(A) = 1$ and $\|A\|_2 = 2$, while every eigenvalue is zero. Anyone who answered "$\|A\|_2 = \max|\lambda| = 0$" has lost the mark.

- **Even for symmetric $A$ they are not equal — they are equal in *magnitude*.** $\sigma_i = |\lambda_i|$. A negative eigenvalue becomes a positive singular value. See the paired drill.

- **MSQ "always true" filters.** Safe facts to lean on: singular values are always real and non-negative; $A$ and $A^T$ have the same non-zero singular values; $\sigma_1 = \|A\|_2$; $\text{rank}(A) = \#\{\sigma_i \neq 0\}$. Unsafe: "$A$ has $n$ singular values" for a non-square $A$ — it has $\min(m,n)$.

- **Time budget:** a $2\times2$ singular-value NAT should cost under two minutes: form $A^T A$ (4 multiplications), take trace and determinant, solve the quadratic, square-root. If you started row-reducing, you took the wrong road.
