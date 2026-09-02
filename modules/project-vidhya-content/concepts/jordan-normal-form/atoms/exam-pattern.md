---
id: jordan-normal-form.exam-pattern
concept_id: jordan-normal-form
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "how many Jordan blocks / linearly independent eigenvectors does $A$ have for $\lambda$?"** Answer directly from geometric multiplicity, $\dim\ker(A-\lambda I)=n-\operatorname{rank}(A-\lambda I)$ — no need to build $J$ itself.

  Example: $\lambda=5$, algebraic multiplicity $3$, $\operatorname{rank}(A-5I)=2$. Geometric multiplicity $=3-2=1$: one block, size $3$ (verified: $\operatorname{rank}(A-5I)^2=1$, consistent with a single size-$3$ chain).

- **MCQ/MSQ "diagonalizable or not" statements.** A repeated eigenvalue alone never settles it — GATE sets exactly this trap. The statement to check is whether geometric multiplicity equals algebraic multiplicity for *every* eigenvalue.

- **MCQ on the minimal polynomial's degree.** These test the largest-block rule directly: the degree is the sum, over distinct eigenvalues, of each one's *largest* block size — not the matrix's overall dimension $n$.

- **Time budget:** for a $2\times2$ or $3\times3$ matrix with one repeated eigenvalue, computing $\operatorname{rank}(A-\lambda I)$ and reading off block count and size should take under $90$ seconds. Needing $\operatorname{rank}(A-\lambda I)^2$ as well, for an ambiguous block split, adds about $30$ more — still inside a $2$-minute NAT budget.
