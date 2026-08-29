---
id: orthogonality.exam-pattern
concept_id: orthogonality
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "find the value of $k$ that makes these orthogonal."** One dot product, one linear equation, done. For $(1, 2, k)$ and $(3, -1, 2)$: $3 - 2 + 2k = 0 \Rightarrow k = -\tfrac{1}{2}$. Under 30 seconds — no vector geometry needed.

- **MCQ "which of these is an orthogonal matrix?" — check column *lengths* first.** It is the cheapest disqualifier and usually kills three options immediately.

- **The trap GATE likes: $\det = \pm 1$ is necessary but not sufficient.**
  $A = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ has $\det(A) = 1$, but its second column $(1,1)$ has length $\sqrt{2} \neq 1$, so $A$ is not orthogonal. Any option chosen on determinant alone is a wrong answer waiting to happen.

- **The naming trap:** an *orthogonal set* only needs pairwise-zero dot products, but an *orthogonal matrix* needs **orthonormal** columns. The word "orthogonal" means something stricter for the matrix than for the set. GATE writes options that exploit exactly this gap.

- **Projection appears more often than Gram-Schmidt.** $\text{proj}_{\mathbf{a}}\mathbf{b} = \frac{\mathbf{b}\cdot\mathbf{a}}{\mathbf{a}\cdot\mathbf{a}}\mathbf{a}$. For $\mathbf{b} = (1,2,3)$ onto $\mathbf{a} = (1,1,1)$: $\frac{6}{3}(1,1,1) = (2,2,2)$. When Gram-Schmidt *is* asked, the question almost always stops at $\mathbf{q}_1$ and $\mathbf{q}_2$ — don't volunteer $\mathbf{q}_3$.

- **Time budget:** a dot-product NAT is under 60 seconds. A full three-vector Gram-Schmidt is a 4-minute problem — if it appears as a 1-mark question, you have misread it; re-check what is actually being asked.
