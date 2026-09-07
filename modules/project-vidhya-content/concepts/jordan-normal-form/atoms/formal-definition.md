---
id: jordan-normal-form.formal-definition
concept_id: jordan-normal-form
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

Every $A \in \mathbb{C}^{n\times n}$ is similar to a **Jordan normal form** $J=P^{-1}AP$, block-diagonal with **Jordan blocks**

$$J_k(\lambda) = \begin{pmatrix}\lambda&1&&\\&\lambda&\ddots&\\&&\ddots&1\\&&&\lambda\end{pmatrix}$$

one block per **generalized-eigenvector chain** (a sequence of stand-in vectors filling in for a missing genuine eigenvector). For eigenvalue $\lambda$: the **number** of blocks equals the geometric multiplicity $\dim\ker(A-\lambda I)$ — how many truly independent eigenvector directions $\lambda$ actually has; their **combined size** equals the algebraic multiplicity — how many times $\lambda$ repeats as a root; the size of the **largest** block equals the exponent of $(x-\lambda)$ in the minimal polynomial — the smallest-degree polynomial that still zeroes out $A$. $A$ is diagonalizable exactly when every block has size $1$.

Use Jordan form when a repeated eigenvalue is **defective** — geometric multiplicity below algebraic multiplicity, meaning there aren't enough independent eigenvectors to go around. A tempting-but-wrong move here is to diagonalize anyway, writing $A=PDP^{-1}$ from the eigenvalues alone: with too few independent eigenvector columns, $P$ is **singular** (not invertible — it has no inverse), so that equation is meaningless.
