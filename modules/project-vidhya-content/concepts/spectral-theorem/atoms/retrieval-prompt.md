---
id: spectral-theorem.retrieval-prompt
concept_id: spectral-theorem
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["spectral-decomposition", "orthogonal-diagonalization"]
---

Before checking: state the spectral theorem's decomposition formula, the conditions on $Q$ and $\Lambda$, and one consequence for matrix functions.

<details><summary>Answer</summary>

$A=Q\Lambda Q^T$ for symmetric $A$, where $Q$ is orthogonal ($Q^TQ=I$, columns are orthonormal eigenvectors) and $\Lambda$ is diagonal with the real eigenvalues. Consequence: $f(A)=Qf(\Lambda)Q^T$ for any scalar function $f$, applied entrywise to the diagonal — reduces $\sqrt{A}$, $A^{-1}$, $e^A$ to scalar operations on eigenvalues.
</details>
