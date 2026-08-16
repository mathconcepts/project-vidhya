---
# Alternative body for determinants.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
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
id: determinants.worked_example.shaken
concept_id: determinants
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: determinants.worked_example
for_stance: shaken
---

## A $3\times3$ determinant, one piece at a time

**Problem:** Compute $\det(A)$ for $A = \begin{pmatrix} 2 & 1 & -1 \\ 1 & 3 & 2 \\ -1 & 2 & 0 \end{pmatrix}$

---

**First, choose where to expand.**

You may expand along any row or column — the answer is the same. So pick the one with a zero in it, because a zero entry means one whole term disappears and you do one less $2\times2$ determinant.

Row 3 is $(-1,\ 2,\ 0)$. It has a zero. Use row 3.

---

**Step 1 — The first term.**

Cover row 3 and column 1. What is left is

$$\begin{vmatrix} 1 & -1 \\ 3 & 2 \end{vmatrix} = (1)(2) - (-1)(3) = 2 + 3 = 5$$

Careful with that minus sign: $-(-1)(3) = +3$, not $-3$.

Now the sign. Positions alternate $+,-,+$ starting from the top-left. Row 3, column 1 is a $+$ position, so this term keeps its sign: $+5$.

Multiply by the entry itself, $-1$: contribution $= (-1)(5) = -5$.

---

**Step 2 — The second term.**

Cover row 3 and column 2:

$$\begin{vmatrix} 2 & -1 \\ 1 & 2 \end{vmatrix} = (2)(2) - (-1)(1) = 4 + 1 = 5$$

Row 3, column 2 is a $-$ position, so this one flips: $-5$.

Multiply by the entry, $2$: contribution $= (2)(-5) = -10$.

---

**Step 3 — The third term.**

The entry is $0$, so the contribution is $0$. This is the term you saved by choosing row 3.

---

**Step 4 — Add them up.**

$$\det(A) = -5 + (-10) + 0 = \boxed{-15}$$

---

**Reading the answer.** It is negative, so the transformation flips orientation. Its size, $15$, says volumes are scaled by a factor of $15$.

**If you got $+15$**, you almost certainly missed the sign flip in step 2. That is the most common slip in cofactor expansion, and it is worth checking before anything else.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Cofactor expansion for 3×3 determinant","steps":[{"prompt":"Step 1: Why did we expand along row 3?","hint":"Look for a row or column with zeros—it reduces the number of 2×2 minors you need to compute.","answer":"Row 3 contains a zero in position (3,3), so we skip computing that cofactor entirely."},{"prompt":"Step 2: What is the sign $(-1)^{3+1}$ for $C_{31}$?","hint":"The sign in a cofactor is $(-1)^{i+j}$ where $i$ is the row and $j$ is the column. Calculate the exponent: $3 + 1 = ?$","answer":"$3 + 1 = 4$, which is even, so $(-1)^4 = +1$. The cofactor $C_{31}$ is positive."},{"prompt":"Step 3: Why must we include the $2 \\times 2$ minors in the final formula?","hint":"The cofactor expansion formula multiplies each matrix entry by its cofactor. Check: $-1 \\cdot C_{31} + 2 \\cdot C_{32} + 0 \\cdot C_{33}$.","answer":"Each entry in the expansion row (row 3 in this case) is multiplied by its corresponding cofactor. Entry $(3,1) = -1$ gets cofactor $C_{31} = 5$, so contribution is $(-1)(5) = -5$."}],"caption":"Cofactor expansion is systematic: find the row/column with most zeros, compute $2 \\times 2$ minors, apply sign rules, and sum weighted by row/column entries."}
```

---

**Summary:** All three atoms have been prepared with proper formatting, KaTeX math notation, and an interactive walkthrough for the worked example. The visual_analogy includes the requested gif-scene block showing how a unit circle (det=±1 transformation) represents area-preserving rotation.

DONE:determinants
