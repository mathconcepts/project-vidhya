---
id: trace.retrieval_prompt
concept_id: trace
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** Define the trace of a square matrix. State the fundamental relationship between trace and eigenvalues, and give one key property that makes trace useful in practice.

<details>
<summary>Answer</summary>

**Definition:**
The trace of an $n \times n$ matrix $A$ is the sum of its diagonal elements:
$$\text{tr}(A) = \sum_{i=1}^{n} a_{ii}$$

**Relationship to eigenvalues:**
If $\lambda_1, \lambda_2, \ldots, \lambda_n$ are the eigenvalues of $A$ (counted with algebraic multiplicity), then
$$\text{tr}(A) = \sum_{i=1}^{n} \lambda_i$$

The trace equals the sum of all eigenvalues. This is because the characteristic polynomial is $\det(A - \lambda I) = (-\lambda)^n + \text{tr}(A)(-\lambda)^{n-1} + \cdots$, and by Vieta's formulas, the sum of roots equals $\text{tr}(A)$.

**Key practical property (Cyclic property):**
For any matrices $A$ and $B$ of compatible dimensions,
$$\text{tr}(AB) = \text{tr}(BA)$$

This allows us to rearrange products in trace expressions without changing the result, provided we only use cyclic permutations.

</details>
