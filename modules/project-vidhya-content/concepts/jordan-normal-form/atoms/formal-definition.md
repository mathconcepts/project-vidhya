---
id: jordan-normal-form.formal_definition
concept_id: jordan-normal-form
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A **Jordan block** of size $k$ for eigenvalue $\lambda$ is the $k \times k$ matrix:
$$J_k(\lambda) = \begin{pmatrix} \lambda & 1 & 0 & \cdots & 0 \\ 0 & \lambda & 1 & \cdots & 0 \\ 0 & 0 & \lambda & \cdots & 0 \\ \vdots & \vdots & \vdots & \ddots & \vdots \\ 0 & 0 & 0 & \cdots & \lambda \end{pmatrix}$$

The **Jordan Normal Form** of an $n \times n$ matrix $A$ is a block-diagonal matrix $J = \text{diag}(J_{k_1}(\lambda_1), J_{k_2}(\lambda_2), \ldots, J_{k_r}(\lambda_r))$ such that $A = PJP^{-1}$ for some invertible $P$. Each block corresponds to an eigenvalue and its associated generalized eigenspace.

**Key Theorem:** Every square matrix over $\mathbb{C}$ has a Jordan Normal Form, and it is unique up to the order of blocks.

The **minimal polynomial** of $A$ is $m_A(x) = \prod_i (x - \lambda_i)^{d_i}$, where $d_i$ is the size of the **largest Jordan block** for eigenvalue $\lambda_i$. This is why Jordan form matters: it reveals both the spectrum (all eigenvalues) and the defect (how large the blocks are).