---
id: gram-schmidt.formal_definition
concept_id: gram-schmidt
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

# Gram-Schmidt Process: Formal Definition

## The Gram-Schmidt Algorithm

Given linearly independent vectors $v_1, v_2, \ldots, v_n \in \mathbb{R}^m$ (or any inner-product space), the Gram-Schmidt process computes an orthonormal sequence $e_1, e_2, \ldots, e_n$ as follows:

1. **Orthogonalization:** For $i = 1, 2, \ldots, n$:
   $$\tilde{u}_i = v_i - \sum_{j=1}^{i-1} \langle v_i, e_j \rangle \, e_j$$
   where $\langle \cdot, \cdot \rangle$ is the inner product.

2. **Normalization:** 
   $$e_i = \frac{\tilde{u}_i}{\|\tilde{u}_i\|}$$

## Key Theorem

**Theorem:** The vectors $e_1, \ldots, e_n$ form an orthonormal basis for $\text{span}(v_1, \ldots, v_n)$, meaning:
- $\langle e_i, e_j \rangle = \delta_{ij}$ (Kronecker delta: 1 if $i=j$, 0 otherwise)
- $\text{span}(e_1, \ldots, e_n) = \text{span}(v_1, \ldots, v_n)$

This process is the computational foundation for QR decomposition: any matrix $A$ with linearly independent columns can be factored as $A = QR$, where $Q$ has orthonormal columns (from Gram-Schmidt) and $R$ is upper triangular.