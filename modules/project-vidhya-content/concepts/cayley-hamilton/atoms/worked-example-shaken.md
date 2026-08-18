---
# Alternative body for cayley-hamilton.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The prose is held at or below the base atom's length — a screen visibly
# longer than the one that already defeated this reader signals difficulty
# no matter how kindly it is written. No praise, no reassurance, and no
# mention of how the reader might be feeling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: cayley-hamilton.worked-example.shaken
concept_id: cayley-hamilton
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: cayley-hamilton.worked_example
for_stance: shaken
---

## $A = \begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix}$: find $A^4$ and $A^{-1}$

## Step 1 — Characteristic polynomial

$$\det(\lambda I - A) = (\lambda-1)(\lambda-2) = \lambda^2-3\lambda+2$$

## Step 2 — What Cayley-Hamilton gives you

$$A^2 - 3A + 2I = 0 \quad\Longrightarrow\quad A^2 = 3A - 2I$$

Every higher power of $A$ reduces using this one line.

## Step 3 — $A^4$

$$A^4 = (A^2)^2 = (3A-2I)^2 = 9A^2 - 12A + 4I$$

Substitute $A^2 = 3A-2I$ again:

$$A^4 = 9(3A-2I) - 12A + 4I = 15A - 14I$$

$$\boxed{A^4 = 15A - 14I}$$

Check: $A^2 = \begin{pmatrix}1&3\\0&4\end{pmatrix}$, so $A^4 = \begin{pmatrix}1&15\\0&16\end{pmatrix}$ — matches $15A-14I$. ✓

## Step 4 — $A^{-1}$

From $A^2 - 3A + 2I = 0$: $A(A-3I) = -2I$.

Multiply both sides by $A^{-1}$ on the left:

$$A^{-1} = \frac{1}{2}(3I-A) = \begin{pmatrix} 1 & -1/2 \\ 0 & 1/2 \end{pmatrix}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Matrix power reduction via Cayley-Hamilton","steps":[{"prompt":"Step 1: Write the characteristic polynomial for $A = \\begin{pmatrix} 1 & 1 \\\\ 0 & 2 \\end{pmatrix}$. What is $\\det(\\lambda I - A)$?","hint":"Expand the determinant: $(\\lambda - 1)(\\lambda - 2) = \\lambda^2 - 3\\lambda + 2$. By Cayley-Hamilton, $A^2 - 3A + 2I = 0$.","answer":"$\\lambda^2 - 3\\lambda + 2 = 0$, so $A^2 = 3A - 2I$"},{"prompt":"Step 2: Use the recurrence $A^2 = 3A - 2I$ to compute $A^4 = (A^2)^2$. Expand $(3A - 2I)^2$.","hint":"$(3A - 2I)^2 = 9A^2 - 12A + 4I$. Now substitute $A^2 = 3A - 2I$ to eliminate the $A^2$ term.","answer":"$A^4 = 9(3A - 2I) - 12A + 4I = 27A - 18I - 12A + 4I = 15A - 14I$"},{"prompt":"Step 3: For part (b), rearrange $A^2 - 3A + 2I = 0$ to solve for $A^{-1}$. Start by factoring out $A$ on the left.","hint":"Write $A(A - 3I) = -2I$. Divide both sides by $-2$ and rearrange.","answer":"$A^{-1} = \\frac{1}{2}(3I - A)$"}],"caption":"Cayley-Hamilton reduces infinite matrix powers to a finite recurrence, and rearranging gives the inverse formula without computing the determinant explicitly."}
```

Reducing powers this way, and getting the inverse for free from the same line, is exactly what makes this theorem worth remembering.
