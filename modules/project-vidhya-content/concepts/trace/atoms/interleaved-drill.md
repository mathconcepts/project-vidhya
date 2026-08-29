---
id: trace.interleaved-drill
concept_id: trace
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: trace.micro_exercise
---

**Cross-concept check: trace → eigenvalues.**

$$A = \begin{pmatrix} 1 & 2 \\ 3 & 2 \end{pmatrix}$$

**Question 1 (trace + determinant $\to$ eigenvalues):** Find both eigenvalues of $A$ without ever writing down $\det(A - \lambda I)$ as an expanded determinant.

*Answer:* $\text{tr}(A) = 1 + 2 = 3$ (add the diagonal) and $\det(A) = 1\cdot2 - 2\cdot3 = -4$. For any $2\times2$ matrix the characteristic equation is

$$\lambda^2 - \text{tr}(A)\,\lambda + \det(A) = 0 \;\Longrightarrow\; \lambda^2 - 3\lambda - 4 = 0 \;\Longrightarrow\; (\lambda-4)(\lambda+1) = 0$$

so $\lambda = 4$ and $\lambda = -1$ (verified). Sanity check both ways: $4 + (-1) = 3 = \text{tr}(A)$ ✓ and $4 \cdot (-1) = -4 = \det(A)$ ✓. The diagonal and the determinant *were* the characteristic polynomial.

**Question 2 (the identity survives powers):** Find $\lambda_1^2 + \lambda_2^2$ — first from the eigenvalues, then a second way that never mentions them.

*Answer:* From the eigenvalues, $4^2 + (-1)^2 = 17$.

The second way: $\text{tr}(A^k) = \sum \lambda_i^k$, so $\sum\lambda_i^2 = \text{tr}(A^2)$ directly. Compute $A^2 = \begin{pmatrix} 1&2\\3&2\end{pmatrix}\begin{pmatrix} 1&2\\3&2\end{pmatrix} = \begin{pmatrix} 7 & 6 \\ 9 & 10 \end{pmatrix}$, and $\text{tr}(A^2) = 7 + 10 = 17$ ✓ (verified). Two independent routes, one number — and the second route works even when the eigenvalues are irrational or complex, where the first would be unusable inside a NAT.

**Why this drill exists:** students treat trace as a definition to recall ("sum of the diagonal") rather than a tool that *replaces* eigenvalue computation. The misconception this targets is the belief that finding eigenvalues requires expanding a characteristic determinant — for $2\times2$ it never does, and for any size, every symmetric function of the eigenvalues that GATE asks for (their sum, their sum of squares, their sum of $k$-th powers) is a trace you can read or multiply your way to.
