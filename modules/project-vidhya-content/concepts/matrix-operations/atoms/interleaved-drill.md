---
id: matrix-operations.interleaved-drill
concept_id: matrix-operations
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: matrix-operations.micro-exercise
---

**Cross-concept check: matrix operations → determinants.**

$$A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}, \qquad B = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$$

**Question 1 (matrix operations):** Compute $AB$ and $BA$. Are they equal?

*Answer:* Not remotely.

$$AB = \begin{pmatrix} 4 & 1 \\ 6 & 3 \end{pmatrix}, \qquad BA = \begin{pmatrix} 2 & 1 \\ 4 & 5 \end{pmatrix}$$

Three of the four entries differ. Multiplication does not commute.

**Question 2 (determinants):** Compute $\det(AB)$ and $\det(A)\det(B)$ separately. Do they agree even though $AB \neq BA$?

*Answer:* $\det(A) = 6$, $\det(B) = 1$, so $\det(A)\det(B) = 6$. Directly: $\det(AB) = \det\begin{pmatrix} 4 & 1 \\ 6 & 3 \end{pmatrix} = 12 - 6 = 6$. They agree — and this holds for *every* compatible pair, order or no order: $\det(AB) = \det(A)\det(B) = \det(B)\det(A) = \det(BA)$, since determinants are ordinary numbers and numbers commute even when the matrices don't. (Check: $\det(BA) = \det\begin{pmatrix} 2 & 1 \\ 4 & 5\end{pmatrix} = 10-4=6$ too.)

**Why this drill exists:** the misconception runs both ways. Some students see $\det(AB)=\det(BA)$ and conclude $AB=BA$; others, knowing $AB\neq BA$, doubt that any product-of-matrices identity could survive the swap and recompute looking for an error. Seeing one concrete pair where the matrices visibly differ but the determinants visibly agree — and knowing *why* ($\det(AB)=\det(A)\det(B)$ collapses to ordinary multiplication) — fixes both at once.
