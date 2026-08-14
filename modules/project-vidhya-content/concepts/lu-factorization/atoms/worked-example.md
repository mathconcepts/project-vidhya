---
id: lu-factorization.worked_example
concept_id: lu-factorization
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
---

# Worked Example: Compute LU and Solve a System

**Problem:** Find the LU factorization (Doolittle form) of 
$$A = \begin{pmatrix} 4 & 3 \\ 6 & 5 \end{pmatrix}$$
Then verify $LU = A$.

---

**Step 1: Set up the factorization**

In Doolittle form, $L$ has 1s on the diagonal. Write:
$$L = \begin{pmatrix} 1 & 0 \\ \ell_{21} & 1 \end{pmatrix}, \quad U = \begin{pmatrix} u_{11} & u_{12} \\ 0 & u_{22} \end{pmatrix}$$

We need to find four unknowns: $\ell_{21}, u_{11}, u_{12}, u_{22}$.

---

**Step 2: Expand $LU$ and match entries**

$$LU = \begin{pmatrix} 1 & 0 \\ \ell_{21} & 1 \end{pmatrix} \begin{pmatrix} u_{11} & u_{12} \\ 0 & u_{22} \end{pmatrix} = \begin{pmatrix} u_{11} & u_{12} \\ \ell_{21} u_{11} & \ell_{21} u_{12} + u_{22} \end{pmatrix}$$

Matching with $A = \begin{pmatrix} 4 & 3 \\ 6 & 5 \end{pmatrix}$:
- $u_{11} = 4$
- $u_{12} = 3$
- $\ell_{21} u_{11} = 6 \Rightarrow \ell_{21} = 6/4 = 3/2$
- $\ell_{21} u_{12} + u_{22} = 5 \Rightarrow (3/2)(3) + u_{22} = 5 \Rightarrow u_{22} = 5 - 9/2 = 1/2$

---

**Step 3: Verify $LU = A$**

$$LU = \begin{pmatrix} 1 & 0 \\ 3/2 & 1 \end{pmatrix} \begin{pmatrix} 4 & 3 \\ 0 & 1/2 \end{pmatrix} = \begin{pmatrix} 4 & 3 \\ 6 & 5 \end{pmatrix} = A \quad \checkmark$$

$$\boxed{L = \begin{pmatrix} 1 & 0 \\ 3/2 & 1 \end{pmatrix}, \quad U = \begin{pmatrix} 4 & 3 \\ 0 & 1/2 \end{pmatrix}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: LU Factorization of a 2×2 Matrix","steps":[{"prompt":"What is the first entry $u_{11}$ of $U$?","hint":"In Doolittle form, the first row of $LU$ is just the first row of $U$ (since $L$ has 1s on diagonal). Match the (1,1) entry of $A$.","answer":"$u_{11} = 4$"},{"prompt":"Find $\\ell_{21}$, the (2,1) entry of $L$. You know $\\ell_{21} \\cdot u_{11} = 6$.","hint":"Divide: $\\ell_{21} = 6 / u_{11}$.","answer":"$\\ell_{21} = 6/4 = 3/2$"},{"prompt":"Now find $u_{22}$. Use the equation $\\ell_{21} u_{12} + u_{22} = 5$.","hint":"Substitute $(3/2)(3) + u_{22} = 5$. Solve for $u_{22}$.","answer":"$u_{22} = 5 - 9/2 = 1/2$"}],"caption":"Master the Doolittle algorithm: Extract each entry systematically from the matrix equation $LU = A$."}
```
