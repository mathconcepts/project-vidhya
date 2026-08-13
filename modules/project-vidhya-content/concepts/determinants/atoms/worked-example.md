---
id: determinants.worked_example
concept_id: determinants
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Cofactor Expansion: 3×3 Determinant

**Problem:** Compute $\det(A)$ where $A = \begin{pmatrix} 2 & 1 & -1 \\ 1 & 3 & 2 \\ -1 & 2 & 0 \end{pmatrix}$

**Solution:**

We expand along the third row because it has a zero, reducing the work:

$$\det(A) = (-1) \cdot C_{31} + 2 \cdot C_{32} + 0 \cdot C_{33}$$

where $C_{ij}$ is the $(i,j)$-cofactor.

**Step 1: Calculate $C_{31}$ (minor for row 3, col 1)**

$$M_{31} = \begin{vmatrix} 1 & -1 \\ 3 & 2 \end{vmatrix} = (1)(2) - (-1)(3) = 2 + 3 = 5$$

$$C_{31} = (-1)^{3+1} M_{31} = (+1)(5) = 5$$

**Step 2: Calculate $C_{32}$ (minor for row 3, col 2)**

$$M_{32} = \begin{vmatrix} 2 & -1 \\ 1 & 2 \end{vmatrix} = (2)(2) - (-1)(1) = 4 + 1 = 5$$

$$C_{32} = (-1)^{3+2} M_{32} = (-1)(5) = -5$$

**Step 3: Assemble the determinant**

$$\det(A) = (-1)(5) + (2)(-5) + 0 = -5 - 10 = -15$$

**Key insight:** A negative determinant means the transformation reverses orientation (like a reflection). The magnitude $15$ says volumes scale by factor 15.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Cofactor expansion for 3×3 determinant","steps":[{"prompt":"Step 1: Why did we expand along row 3?","hint":"Look for a row or column with zeros—it reduces the number of 2×2 minors you need to compute.","answer":"Row 3 contains a zero in position (3,3), so we skip computing that cofactor entirely."},{"prompt":"Step 2: What is the sign $(-1)^{3+1}$ for $C_{31}$?","hint":"The sign in a cofactor is $(-1)^{i+j}$ where $i$ is the row and $j$ is the column. Calculate the exponent: $3 + 1 = ?$","answer":"$3 + 1 = 4$, which is even, so $(-1)^4 = +1$. The cofactor $C_{31}$ is positive."},{"prompt":"Step 3: Why must we include the $2 \\times 2$ minors in the final formula?","hint":"The cofactor expansion formula multiplies each matrix entry by its cofactor. Check: $-1 \\cdot C_{31} + 2 \\cdot C_{32} + 0 \\cdot C_{33}$.","answer":"Each entry in the expansion row (row 3 in this case) is multiplied by its corresponding cofactor. Entry $(3,1) = -1$ gets cofactor $C_{31} = 5$, so contribution is $(-1)(5) = -5$."}],"caption":"Cofactor expansion is systematic: find the row/column with most zeros, compute $2 \\times 2$ minors, apply sign rules, and sum weighted by row/column entries."}
```
```

---

**Summary:** All three atoms have been prepared with proper formatting, KaTeX math notation, and an interactive walkthrough for the worked example. The visual_analogy includes the requested gif-scene block showing how a unit circle (det=±1 transformation) represents area-preserving rotation.

DONE:determinants
