---
# Alternative body for matrix-inverse.worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: matrix-inverse.worked-example.shaken
concept_id: matrix-inverse
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-inverse.worked-example
for_stance: shaken
---

## The problem

Find $A^{-1}$ for $A=\begin{pmatrix}1&2\\3&4\end{pmatrix}$, then check $AA^{-1}=I$.

## Check it can be inverted

$$\det(A)=(1)(4)-(2)(3)=-2$$

Not zero, so an inverse exists.

## Build the inverse

For $\begin{pmatrix}a&b\\c&d\end{pmatrix}$, the adjugate swaps the diagonal and negates the off-diagonal. Then divide every entry by the determinant:

$$\text{adj}(A)=\begin{pmatrix}4&-2\\-3&1\end{pmatrix}, \qquad A^{-1}=\frac{1}{-2}\begin{pmatrix}4&-2\\-3&1\end{pmatrix}=\begin{pmatrix}-2&1\\1.5&-0.5\end{pmatrix}$$

## Verify

$$AA^{-1}=\begin{pmatrix}1&2\\3&4\end{pmatrix}\begin{pmatrix}-2&1\\1.5&-0.5\end{pmatrix}=\begin{pmatrix}1&0\\0&1\end{pmatrix}=I \quad\checkmark$$

It lands back on the identity, so $A^{-1}$ is correct.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding a 2×2 matrix inverse","steps":[{"prompt":"Step 1: Calculate the determinant of $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$. What is $\\det(A)$?","hint":"Use the formula $\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$.","answer":"$\\det(A) = (1)(4) - (2)(3) = -2$"},{"prompt":"Step 2: Write the adjugate matrix by swapping the diagonal elements, negating the off-diagonal elements. What is $\\text{adj}(A)$?","hint":"For $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$, swap 1 and 4, negate 2 and 3.","answer":"$\\text{adj}(A) = \\begin{pmatrix} 4 & -2 \\\\ -3 & 1 \\end{pmatrix}$"},{"prompt":"Step 3: Apply $A^{-1} = \\frac{1}{\\det(A)} \\cdot \\text{adj}(A)$. Compute $A^{-1}$.","hint":"Divide each entry of the adjugate by $\\det(A) = -2$.","answer":"$A^{-1} = \\begin{pmatrix} -2 & 1 \\\\ 1.5 & -0.5 \\end{pmatrix}$"}],"caption":"The adjugate method is fastest for small matrices. For large matrices in exams, recognize that $A^{-1}$ exists iff $\\det(A) \\neq 0$."}
```
