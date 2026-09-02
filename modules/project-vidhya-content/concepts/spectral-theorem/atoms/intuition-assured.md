---
# Alternative body for spectral-theorem.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
id: spectral-theorem.intuition.assured
concept_id: spectral-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: spectral-theorem.intuition
for_stance: assured
---

$A = Q\Lambda Q^T$ is the orthogonal special case of diagonalization: same $PDP^{-1}$ shape, but $Q^{-1} = Q^T$, so inverting the change of basis costs nothing. This is why $f(A) = Qf(\Lambda)Q^T$ generalizes to any function applied entrywise on $\Lambda$ — square root, exponential, arbitrary powers — without ever forming $Q^{-1}$ separately.

Two places this gets tested past the mechanics: repeated eigenvalues still diagonalize (symmetric matrices are never defective, so the eigenspace for a repeated $\lambda$ has full dimension — just pick an orthogonal basis within it), and the eigenvalues of $A^2$ are $\lambda_i^2$ with the *same* eigenvectors, which is the whole justification for $\sqrt{A}$ being well-defined and symmetric itself.

Non-symmetric $A$ loses the guarantee; you fall back to SVD, where $U \ne V$ in general.
