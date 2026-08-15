---
id: matrix-inverse.worked-example
concept_id: matrix-inverse
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Problem (GATE-Style)

Find the inverse of the matrix:
$$A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$$

and verify that $AA^{-1} = I$.

---

## Solution

**Step 1: Check that the inverse exists**

Calculate the determinant:
$$\det(A) = (1)(4) - (2)(3) = 4 - 6 = -2 \neq 0 \checkmark$$

Since $\det(A) \neq 0$, the inverse exists.

**Step 2: Find the adjugate (adjoint) matrix**

For a 2×2 matrix $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$, the adjugate is $\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.

$$\text{adj}(A) = \begin{pmatrix} 4 & -2 \\ -3 & 1 \end{pmatrix}$$

**Step 3: Apply the inverse formula**

$$A^{-1} = \frac{1}{\det(A)} \cdot \text{adj}(A) = \frac{1}{-2} \begin{pmatrix} 4 & -2 \\ -3 & 1 \end{pmatrix} = \begin{pmatrix} -2 & 1 \\ 1.5 & -0.5 \end{pmatrix}$$

**Step 4: Verify**

$$AA^{-1} = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} \begin{pmatrix} -2 & 1 \\ 1.5 & -0.5 \end{pmatrix}$$

- Row 1, Col 1: $(1)(-2) + (2)(1.5) = -2 + 3 = 1$ ✓
- Row 1, Col 2: $(1)(1) + (2)(-0.5) = 1 - 1 = 0$ ✓
- Row 2, Col 1: $(3)(-2) + (4)(1.5) = -6 + 6 = 0$ ✓
- Row 2, Col 2: $(3)(1) + (4)(-0.5) = 3 - 2 = 1$ ✓

$$AA^{-1} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = I \quad \checkmark$$

---

## Interactive Walkthrough

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding a 2×2 matrix inverse","steps":[{"prompt":"Step 1: Calculate the determinant of $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$. What is $\\det(A)$?","hint":"Use the formula $\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$.","answer":"$\\det(A) = (1)(4) - (2)(3) = -2$"},{"prompt":"Step 2: Write the adjugate matrix by swapping the diagonal elements, negating the off-diagonal elements. What is $\\text{adj}(A)$?","hint":"For $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$, swap 1 and 4, negate 2 and 3.","answer":"$\\text{adj}(A) = \\begin{pmatrix} 4 & -2 \\\\ -3 & 1 \\end{pmatrix}$"},{"prompt":"Step 3: Apply $A^{-1} = \\frac{1}{\\det(A)} \\cdot \\text{adj}(A)$. Compute $A^{-1}$.","hint":"Divide each entry of the adjugate by $\\det(A) = -2$.","answer":"$A^{-1} = \\begin{pmatrix} -2 & 1 \\\\ 1.5 & -0.5 \\end{pmatrix}$"}],"caption":"The adjugate method is fastest for small matrices. For large matrices in exams, recognize that $A^{-1}$ exists iff $\\det(A) \\neq 0$."}
```

---

**Summary:** The three atoms have been written in the required format with:
- **Intuition**: Conceptual understanding of matrix inverse, existence condition, and exam relevance (227 words)
- **Visual Analogy**: Clay-mold analogy with parametric gif-scene showing amplitude modulation to represent transformation/inverse (156 words)
- **Worked Example**: Full GATE-style 2×2 matrix inverse problem using the adjugate method with verification, plus interactive walkthrough

All files should be written to their respective paths in `modules/project-vidhya-content/concepts/matrix-inverse/atoms/`.

DONE:matrix-inverse
