---
# Alternative body for matrix-inverse.worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: matrix-inverse.worked-example.assured
concept_id: matrix-inverse
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-inverse.worked-example
for_stance: assured
---

## Setup

$A=\begin{pmatrix}1&2\\3&4\end{pmatrix}$. Find $A^{-1}$ and confirm $AA^{-1}=I$.

## Adjugate method (fastest at 2×2)

$$\det(A)=-2 \neq 0 \implies \text{invertible}, \qquad A^{-1}=\frac{1}{\det A}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}=\frac{1}{-2}\begin{pmatrix}4&-2\\-3&1\end{pmatrix}=\begin{pmatrix}-2&1\\1.5&-0.5\end{pmatrix}$$

## Verify

$$AA^{-1}=I \quad\checkmark$$

## Why the method changes with size

At $2\times2$ the adjugate is essentially free — swap the diagonal, negate the off-diagonal, divide by $\det$. Past $3\times3$, switch to Gauss-Jordan on $[A \mid I]$: row-reduce $A$ to the identity while applying the same operations to $I$, and $I$ becomes $A^{-1}$. Cofactor-based methods are $O(n!)$ and not worth it beyond a $3\times3$.

A common chained-question trap: given $A^{-1}$ and $B^{-1}$ separately, $(AB)^{-1} = B^{-1}A^{-1}$ — the order reverses, exactly as it does under transpose.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding a 2×2 matrix inverse","steps":[{"prompt":"Step 1: Calculate the determinant of $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$. What is $\\det(A)$?","hint":"Use the formula $\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$.","answer":"$\\det(A) = (1)(4) - (2)(3) = -2$"},{"prompt":"Step 2: Write the adjugate matrix by swapping the diagonal elements, negating the off-diagonal elements. What is $\\text{adj}(A)$?","hint":"For $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$, swap 1 and 4, negate 2 and 3.","answer":"$\\text{adj}(A) = \\begin{pmatrix} 4 & -2 \\\\ -3 & 1 \\end{pmatrix}$"},{"prompt":"Step 3: Apply $A^{-1} = \\frac{1}{\\det(A)} \\cdot \\text{adj}(A)$. Compute $A^{-1}$.","hint":"Divide each entry of the adjugate by $\\det(A) = -2$.","answer":"$A^{-1} = \\begin{pmatrix} -2 & 1 \\\\ 1.5 & -0.5 \\end{pmatrix}$"}],"caption":"The adjugate method is fastest for small matrices. For large matrices in exams, recognize that $A^{-1}$ exists iff $\\det(A) \\neq 0$."}
```
