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

**Cross-concept check: matrix operations → trace.**

$$A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}, \qquad B = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$$

**Question 1 (matrix operations):** Compute $AB$ and $BA$. Are they equal?

*Answer:* Not remotely.

$$AB = \begin{pmatrix} 2(1)+1(2) & 2(0)+1(1) \\ 0(1)+3(2) & 0(0)+3(1) \end{pmatrix} = \begin{pmatrix} 4 & 1 \\ 6 & 3 \end{pmatrix}, \qquad BA = \begin{pmatrix} 2 & 1 \\ 4 & 5 \end{pmatrix}$$

Three of the four entries differ. Multiplication does not commute.

**Question 2 (trace):** Take the trace of each. What do you notice, and is it a coincidence?

*Answer:* $\text{tr}(AB) = 4 + 3 = 7$ and $\text{tr}(BA) = 2 + 5 = 7$. Equal — and it is never a coincidence:

$$\text{tr}(AB) = \sum_i (AB)_{ii} = \sum_i \sum_k a_{ik}b_{ki} = \sum_k \sum_i b_{ki}a_{ik} = \sum_k (BA)_{kk} = \text{tr}(BA)$$

The double sum is over the same set of products $a_{ik}b_{ki}$; swapping the order of summation is all that happens. So $\text{tr}(AB) = \text{tr}(BA)$ holds for *every* compatible pair — even when $AB$ and $BA$ have different sizes ($A_{m\times n}$, $B_{n\times m}$ give an $m\times m$ and an $n \times n$ product, with identical traces).

A useful corollary GATE tests directly: $\text{tr}(P^{-1}AP) = \text{tr}(APP^{-1}) = \text{tr}(A)$ — trace is similarity-invariant, which is why similar matrices share it (and their eigenvalues).

**Why this drill exists:** two mirror-image misconceptions live here. One group reads "$\text{tr}(AB) = \text{tr}(BA)$" as evidence that $AB = BA$; the other, knowing $AB \neq BA$, refuses to believe the traces can match and recomputes looking for an error. Both are fixed by seeing one concrete pair where the products visibly differ and the traces visibly agree — and by seeing *why* in the double sum.
