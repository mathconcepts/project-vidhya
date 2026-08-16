---
id: matrix-operations.worked-example
concept_id: matrix-operations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# GATE Problem: Matrix Multiplication and Transpose

## Problem

Given matrices:

$$A = \begin{pmatrix} 2 & 1 \\ 3 & -1 \end{pmatrix}, \quad B = \begin{pmatrix} 1 & 0 & 2 \\ -1 & 2 & 1 \end{pmatrix}$$

Compute $AB$ and then find $(AB)^T$.

## Full Solution

**Step 1: Verify dimensions**

$A$ is $2 \times 2$, $B$ is $2 \times 3$. Since columns of $A$ (2) equal rows of $B$ (2), multiplication is valid. The result will be $2 \times 3$.

**Step 2: Compute $AB$**

$$AB = \begin{pmatrix} 2 & 1 \\ 3 & -1 \end{pmatrix} \begin{pmatrix} 1 & 0 & 2 \\ -1 & 2 & 1 \end{pmatrix}$$

- $(AB)_{11} = 2(1) + 1(-1) = 2 - 1 = 1$
- $(AB)_{12} = 2(0) + 1(2) = 0 + 2 = 2$
- $(AB)_{13} = 2(2) + 1(1) = 4 + 1 = 5$
- $(AB)_{21} = 3(1) + (-1)(-1) = 3 + 1 = 4$
- $(AB)_{22} = 3(0) + (-1)(2) = 0 - 2 = -2$
- $(AB)_{23} = 3(2) + (-1)(1) = 6 - 1 = 5$

$$AB = \begin{pmatrix} 1 & 2 & 5 \\ 4 & -2 & 5 \end{pmatrix}$$

**Step 3: Compute $(AB)^T$**

Transpose by swapping rows and columns:

$$(AB)^T = \begin{pmatrix} 1 & 4 \\ 2 & -2 \\ 5 & 5 \end{pmatrix}$$

**Exam Insight:** Note that $(AB)^T = B^T A^T$ (the transpose reversal property). Verify: $B^T$ is $3 \times 2$, $A^T$ is $2 \times 2$, product is $3 \times 2$. ✓

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Matrix multiplication and transpose","steps":[{"prompt":"Step 1: Before multiplying $AB$, check: what must be true about the dimensions of $A$ and $B$?","hint":"For $AB$ to exist, the number of columns in $A$ must equal the number of rows in $B$.","answer":"$A$ is $2 \\times 2$ (2 columns), $B$ is $2 \\times 3$ (2 rows). They match, so $AB$ exists and is $2 \\times 3$."},{"prompt":"Step 2: Compute the (1,2) entry of $AB$ using row 1 of $A$ and column 2 of $B$.","hint":"Multiply corresponding entries and sum: row 1 of $A$ is $[2, 1]$, column 2 of $B$ is $[0, 2]$.","answer":"$(AB)_{12} = 2 \\cdot 0 + 1 \\cdot 2 = 0 + 2 = 2$"},{"prompt":"Step 3: What is $(AB)^T$? Remember, transpose swaps rows and columns.","hint":"The first row of $AB$ becomes the first column of $(AB)^T$.","answer":"$(AB)^T = \\begin{pmatrix} 1 & 4 \\\\ 2 & -2 \\\\ 5 & 5 \\end{pmatrix}$"}],"caption":"Key insight: matrix multiplication is not commutative ($AB \\neq BA$), but the transpose property $( AB)^T = B^T A^T$ always holds and reverses the order."}
```

---
- Intuition atom building conceptual foundation
- Visual analogy with parametric gif-scene showing matrix transformation
- Worked example with full solution and interactive guided walkthrough
