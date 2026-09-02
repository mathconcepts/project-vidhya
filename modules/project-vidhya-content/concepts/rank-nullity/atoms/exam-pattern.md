---
id: rank-nullity.exam-pattern
concept_id: rank-nullity
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "a $3\times5$ matrix has rank 2; find its nullity."** One subtraction — $5-2=3$. The entire question is whether you subtract from the **column** count. Subtracting from 3 instead gives 1, which is always on the option list. GATE picks non-square dimensions specifically to separate the two habits.

- **Read the rank off by inspection when you can.** For $A = \begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 2 & 3 \end{pmatrix}$, rows 2 and 3 are visibly multiples of row 1, so $\text{rank}(A)=1$ and $\text{nullity}(A)=3-1=2$ — no elimination performed at all.

- **The left-null-space trap.** $\text{nullity}(A^T)=m-\text{rank}(A)$, not $n-\text{rank}(A)$ — because $A^T$ has $m$ columns. Same theorem, different domain.

- **Standard MCQ facts, no computation needed:**
  - $\text{rank}(AB) \le \min(\text{rank}(A), \text{rank}(B))$
  - $\text{rank}(A) = \text{rank}(A^T) = \text{rank}(A^TA)$
  - $A$ is invertible ($n\times n$) $\iff \text{rank}(A)=n \iff \text{nullity}(A)=0$

- **The solvability link is where marks are actually won.** $A\mathbf{x}=\mathbf{b}$ is consistent iff $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])$, and when consistent the solution set carries $n-\text{rank}(A)$ free parameters.

- **Time budget:** a pure rank-nullity NAT is a 30-second question. Row-reducing a $3\times4$ integer matrix to find rank should land under 90 seconds.
