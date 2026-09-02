---
# Alternative body for determinants.worked-example, served when the learner stance is
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
id: determinants.worked-example.shaken
concept_id: determinants
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: determinants.worked-example
for_stance: shaken
---

**Problem:** $\det(A)$ for $A = \begin{pmatrix} 2 & 1 & -1 \\ 1 & 3 & 2 \\ -1 & 2 & 0 \end{pmatrix}$.

---

**Expand along row 3** — it has a zero, so one term drops out: $(-1,\ 2,\ 0)$.

---

**Term 1.** $\begin{vmatrix} 1 & -1 \\ 3 & 2 \end{vmatrix} = (1)(2) - (-1)(3) = 5$. Sign $+$. Contribution $= (-1)(5) = -5$.

---

**Term 2.** $\begin{vmatrix} 2 & -1 \\ 1 & 2 \end{vmatrix} = (2)(2) - (-1)(1) = 5$. Sign $-$. Contribution $= (2)(-5) = -10$.

---

**Term 3.** Entry is $0$, so contribution is $0$.

---

**Add.**

$$\det(A) = -5 + (-10) + 0 = \boxed{-15}$$

Negative, so orientation flips; size $15$ scales volumes by that factor.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Cofactor expansion for 3×3 determinant","steps":[{"prompt":"Step 1: Why did we expand along row 3?","hint":"You may expand along any row or column and get the same answer, so pick the one with a zero in it — that term disappears and you do one less 2×2 determinant. Row 3 is (−1, 2, 0).","answer":"Row 3 contains a zero in position (3,3), so we skip computing that cofactor entirely."},{"prompt":"Step 2: What is the sign $(-1)^{3+1}$ for $C_{31}$?","hint":"Signs alternate $+,-,+$ starting top-left, so row 3 col 1 keeps its sign. Watch the double negative in the minor itself: $-(-1)(3) = +3$, not $-3$.","answer":"$3 + 1 = 4$, which is even, so $(-1)^4 = +1$. The cofactor $C_{31}$ is positive."},{"prompt":"Row 3, column 2 is a $-$ position. What happens to that term's sign?","hint":"The next position along the row flips: a $-$ sign. Miss this and $-10$ becomes $+10$, which is the most common slip in cofactor expansion.","answer":"The sign flips, so the contribution is $(2)(-5) = -10$, not $+10$."},{"prompt":"Step 3: Why must we include the $2 \\times 2$ minors in the final formula?","hint":"The cofactor expansion formula multiplies each matrix entry by its cofactor. Check: $-1 \\cdot C_{31} + 2 \\cdot C_{32} + 0 \\cdot C_{33}$.","answer":"Each entry in the expansion row (row 3 in this case) is multiplied by its corresponding cofactor. Entry $(3,1) = -1$ gets cofactor $C_{31} = 5$, so contribution is $(-1)(5) = -5$."}],"caption":"Cofactor expansion is systematic: find the row/column with the most zeros, compute the $2 \\times 2$ minors, apply sign rules, and sum weighted by row/column entries. A wrong sign in one term is the slip to check first."}
```
