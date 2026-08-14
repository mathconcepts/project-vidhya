---
id: lu-factorization.micro_exercise
concept_id: lu-factorization
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

# Quick Practice: LU for a 3×3 Matrix

Compute the LU factorization (Doolittle form) of 
$$A = \begin{pmatrix} 2 & -1 & 0 \\ 4 & 3 & 1 \\ 2 & 1 & 3 \end{pmatrix}$$

Express $L$ and $U$ as explicit matrices.

<details><summary>Answer</summary>

**Step 1:** First row of $U$ equals first row of $A$ (since $L$ has 1s on diagonal):
$$u_{1,:} = (2, -1, 0)$$

**Step 2:** First column of $L$ (below diagonal):
$$\ell_{21} = 4/2 = 2, \quad \ell_{31} = 2/2 = 1$$

**Step 3:** Eliminate below the second pivot using row operations. 
- Row 2 becomes: $(0, 3 - 2(-1), 1 - 2(0)) = (0, 5, 1)$
- Row 3 becomes: $(0, 1 - 1(-1), 3 - 1(0)) = (0, 2, 3)$

**Step 4:** Second column of $L$:
$$\ell_{32} = 2/5$$

**Step 5:** Eliminate row 3, position (3,2): $u_{33} = 3 - (2/5)(1) = 3 - 2/5 = 13/5$

**Answer:**
$$L = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 1 & 2/5 & 1 \end{pmatrix}, \quad U = \begin{pmatrix} 2 & -1 & 0 \\ 0 & 5 & 1 \\ 0 & 0 & 13/5 \end{pmatrix}$$

Verify by computing $LU$ and checking it equals $A$.

</details>
