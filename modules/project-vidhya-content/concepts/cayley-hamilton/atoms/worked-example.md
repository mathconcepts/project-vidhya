---
id: cayley-hamilton.worked_example
concept_id: cayley-hamilton
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Problem: Computing Powers and Inverse Using Cayley-Hamilton

Let $A = \begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix}$. 

(a) Using the Cayley-Hamilton Theorem, express $A^4$ as a linear combination of $A$ and $I$.  
(b) Verify that $A^{-1} = \frac{1}{2}(3I - A)$.

---

## Solution

### Step 1: Find the Characteristic Polynomial

$$\det(\lambda I - A) = \det\begin{pmatrix} \lambda - 1 & -1 \\ 0 & \lambda - 2 \end{pmatrix} = (\lambda - 1)(\lambda - 2) = \lambda^2 - 3\lambda + 2$$

### Step 2: Apply Cayley-Hamilton Theorem

By the theorem, $A^2 - 3A + 2I = 0$, which gives:
$$A^2 = 3A - 2I$$

This is the key recurrence relation.

### Step 3: Compute $A^4$ Using the Recurrence

$$A^4 = (A^2)^2 = (3A - 2I)^2 = 9A^2 - 12A + 4I$$

Substitute $A^2 = 3A - 2I$:
$$A^4 = 9(3A - 2I) - 12A + 4I = 27A - 18I - 12A + 4I = 15A - 14I$$

Therefore: $$\boxed{A^4 = 15A - 14I}$$

**Verification:** $A^2 = \begin{pmatrix} 1 & 3 \\ 0 & 4 \end{pmatrix}$, so $A^4 = \begin{pmatrix} 1 & 15 \\ 0 & 16 \end{pmatrix} = 15\begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix} - 14\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}$ ✓

### Step 4: Find $A^{-1}$ from Cayley-Hamilton

From $A^2 - 3A + 2I = 0$, rearrange:
$$A^2 - 3A = -2I$$
$$A(A - 3I) = -2I$$

Multiply both sides by $A^{-1}$ on the left (valid since $\det(A) = 2 \neq 0$):
$$A - 3I = -2A^{-1}$$
$$A^{-1} = \frac{1}{2}(3I - A)$$

**Verification:**
$$\frac{1}{2}(3I - A) = \frac{1}{2}\begin{pmatrix} 3 & 0 \\ 0 & 3 \end{pmatrix} - \frac{1}{2}\begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} 2 & -1 \\ 0 & 1 \end{pmatrix}$$

This matches $A^{-1} = \frac{1}{\det(A)} \text{adj}(A) = \frac{1}{2}\begin{pmatrix} 2 & -1 \\ 0 & 1 \end{pmatrix}$ ✓

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Matrix power reduction via Cayley-Hamilton","steps":[{"prompt":"Step 1: Write the characteristic polynomial for $A = \\begin{pmatrix} 1 & 1 \\\\ 0 & 2 \\end{pmatrix}$. What is $\\det(\\lambda I - A)$?","hint":"Expand the determinant: $(\\lambda - 1)(\\lambda - 2) = \\lambda^2 - 3\\lambda + 2$. By Cayley-Hamilton, $A^2 - 3A + 2I = 0$.","answer":"$\\lambda^2 - 3\\lambda + 2 = 0$, so $A^2 = 3A - 2I$"},{"prompt":"Step 2: Use the recurrence $A^2 = 3A - 2I$ to compute $A^4 = (A^2)^2$. Expand $(3A - 2I)^2$.","hint":"$(3A - 2I)^2 = 9A^2 - 12A + 4I$. Now substitute $A^2 = 3A - 2I$ to eliminate the $A^2$ term.","answer":"$A^4 = 9(3A - 2I) - 12A + 4I = 27A - 18I - 12A + 4I = 15A - 14I$"},{"prompt":"Step 3: For part (b), rearrange $A^2 - 3A + 2I = 0$ to solve for $A^{-1}$. Start by factoring out $A$ on the left.","hint":"Write $A(A - 3I) = -2I$. Divide both sides by $-2$ and rearrange.","answer":"$A^{-1} = \\frac{1}{2}(3I - A)$"}],"caption":"Cayley-Hamilton reduces infinite matrix powers to a finite recurrence, and rearranging gives the inverse formula without computing the determinant explicitly."}
```
```

---

**Key Exam Insight:** Cayley-Hamilton Theorem eliminates the need for brute-force matrix multiplication and offers a formula for inverse that bypasses determinant computation—both time-savers in timed exams.

DONE:cayley-hamilton
