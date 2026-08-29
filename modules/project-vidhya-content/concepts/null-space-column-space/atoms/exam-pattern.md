---
id: null-space-column-space.exam-pattern
concept_id: null-space-column-space
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want a dimension, not a basis.** "The nullity of a $4 \times 7$ matrix of rank 3 is ____" is one subtraction: $7 - 3 = 4$. No row reduction. **The trap is which number you subtract from** — it is always $n$, the number of *columns*, never $m$. Here $4 - 3 = 1$ is the wrong answer that the question is built to collect.

- **Rank bounds settle many MCQs without computation.** $\text{rank}(A) \le \min(m,n)$. So a $3\times5$ matrix has rank at most 3 and therefore nullity at least $5 - 3 = 2$ — a homogeneous system with more unknowns than equations *always* has a nontrivial solution. That single fact answers a recurring GATE stem outright.

- **"Consistent" is a column space question.** $Ax = b$ has a solution $\iff b \in \text{Col}(A)$ $\iff \text{rank}(A) = \text{rank}([A \mid b])$. And when it is consistent, the full solution set is one particular solution plus all of $\text{Null}(A)$ — so the solution is unique exactly when the nullity is $0$.

- **MSQ property standards worth pre-loading:**
  - $\text{rank}(A) = \text{rank}(A^T)$ — row rank equals column rank. But the *nullities* differ: $\text{nullity}(A) = n - r$ while $\text{nullity}(A^T) = m - r$.
  - Row operations change $\text{Col}(A)$ but never $\text{Null}(A)$ — which is precisely why the column space basis must be read off the original matrix.
  - $\text{Null}(A) = \{0\}$ $\iff$ columns are independent $\iff$ (for square $A$) $\det A \ne 0$.

- **Time budget:** a dimension-only question is 15 seconds of arithmetic. A basis for both subspaces of a $3\times4$ matrix is a 2–3 minute row reduction. Check what the question asked for before reducing anything — most of the marks here are lost to computing a basis nobody wanted.
