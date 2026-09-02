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

one block per generalized-eigenvector chain. For eigenvalue $\lambda$: the **number** of blocks equals the geometric multiplicity $\dim\ker(A-\lambda I)$; their **combined size** equals the algebraic multiplicity; the size of the **largest** block equals the exponent of $(x-\lambda)$ in the minimal polynomial. $A$ is diagonalizable exactly when every block has size $1$.

Use Jordan form when a repeated eigenvalue is **defective** — geometric multiplicity below algebraic multiplicity. A tempting-but-wrong move here is to diagonalize anyway, writing $A=PDP^{-1}$ from the eigenvalues alone: with too few independent eigenvector columns, $P$ is singular and not invertible, so that equation is meaningless.
