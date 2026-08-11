---
id: divergence-curl.common-traps
concept_id: divergence-curl
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Sign errors in curl formula**: The $j$-component has a **minus sign** in front that students forget: $-(∂R/∂x - ∂P/∂z)$, not $+(∂R/∂x - ∂P/∂z)$. Write out the determinant form every time to avoid this trap.

- **Confusing divergence (scalar) with curl (vector)**: Divergence outputs a number; curl outputs a vector. If a problem asks "find $\nabla \times \mathbf{F}$," the answer must be in the form $a\mathbf{i} + b\mathbf{j} + c\mathbf{k}$, not a single value.

- **Forgetting vector identities**: Students compute $\nabla \cdot (\nabla \times \mathbf{F})$ laboriously when they should recall it's always zero. Similarly, $\nabla \times (\nabla f) = \mathbf{0}$ for any scalar $f$. These save ~2 minutes per problem.
