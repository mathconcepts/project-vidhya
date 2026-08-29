---
id: trace.exam-pattern
concept_id: trace
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **Trace is rarely the subject of the question — it is the shortcut inside someone else's question.** "Sum of the eigenvalues of $A$" is trace. "The missing third eigenvalue, given two of them" is trace minus the two. Recognising that phrasing converts a two-minute problem into a five-second one.

- **NAT: the missing-eigenvalue pattern.** A $3\times3$ matrix is given, two eigenvalues are stated, find the third. Add the diagonal, subtract the two known values. Never expand $\det(A - \lambda I)$ for this.

- **$\text{tr}(A^2)$ is the second lever.** For $A = \begin{pmatrix} 1 & 2 \\ 3 & 2\end{pmatrix}$: $\text{tr}(A) = 3$, $\det(A) = -4$, so $\lambda^2 - 3\lambda - 4 = 0$ gives $\lambda = 4, -1$. Then $\sum\lambda_i^2 = 16 + 1 = 17$, and independently $A^2 = \begin{pmatrix} 7 & 6 \\ 9 & 10\end{pmatrix}$ with $\text{tr}(A^2) = 17$ ✓ (verified). Either route gets there; whichever the question hands you cheaply is the one to take.

- **The projection fact GATE likes:** if $P$ is idempotent ($P^2 = P$), its eigenvalues are all $0$ or $1$, so $\text{tr}(P) = \text{rank}(P)$. For $P = \tfrac{1}{3}\begin{pmatrix}1&1&1\\1&1&1\\1&1&1\end{pmatrix}$: $P^2 = P$ ✓, $\text{tr}(P) = 1 = \text{rank}(P)$ ✓ (verified). A "rank of this projection matrix" NAT is answered by adding three fractions.

- **Traps:**
  - $\text{tr}(AB) = \text{tr}(A)\text{tr}(B)$ — **false**. The most-offered wrong option on this topic.
  - $\text{tr}(ABC) = \text{tr}(ACB)$ — **false**. Cyclic rotation only, no arbitrary reordering.
  - Trace does not determine the eigenvalues, only their sum. $\begin{pmatrix}1&0\\0&3\end{pmatrix}$ and $\begin{pmatrix}2&0\\0&2\end{pmatrix}$ both have trace $4$ and nothing else in common.
  - Trace is similarity-invariant ($\text{tr}(P^{-1}AP) = \text{tr}(A)$), so a "which of these is invariant under change of basis" MSQ includes it alongside determinant and rank.

- **Time budget:** any question whose answer is a trace should cost under 20 seconds. If you are computing a characteristic polynomial to find a *sum* of eigenvalues, stop — the sum was on the diagonal all along.
