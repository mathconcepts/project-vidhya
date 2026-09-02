---
# Alternative body for determinants.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: determinants.worked-example.assured
concept_id: determinants
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: determinants.worked-example
for_stance: assured
---

**Problem:** $\det(A)$ for $A = \begin{pmatrix} 2 & 1 & -1 \\ 1 & 3 & 2 \\ -1 & 2 & 0 \end{pmatrix}$ — by row reduction instead of cofactors.

$R_2 \to R_2 - \tfrac12 R_1$, $R_3 \to R_3 + \tfrac12 R_1$ (neither changes the determinant):

$$\begin{pmatrix} 2 & 1 & -1 \\ 0 & \tfrac52 & \tfrac52 \\ 0 & \tfrac52 & -\tfrac12 \end{pmatrix} \xrightarrow{R_3 \to R_3 - R_2} \begin{pmatrix} 2 & 1 & -1 \\ 0 & \tfrac52 & \tfrac52 \\ 0 & 0 & -3 \end{pmatrix}$$

No swaps or scalings were used, so $\det(A) = 2 \cdot \tfrac52 \cdot (-3) = \boxed{-15}$.

**Cross-check by cofactors along row 3** (the row with the zero): $(-1)(+5) + (2)(-5) + 0 = -15$. ✓

**Why prefer reduction.** Cofactor expansion is $O(n!)$; this is $O(n^3)$ — comparable at $3\times3$, not at $4\times4$, which is a realistic paper. Two bookkeeping rules: a swap flips the sign, scaling a row by $k$ multiplies the determinant by $k$. Adding a multiple of a row is free.

**What the answer tells you.** $\det \neq 0 \Rightarrow A$ invertible, rank $3$, unique solution to $Ax=b$ for every $b$. A common follow-on: $\det(A^{-1}) = -1/15$ and $\det(2A) = 2^3(-15) = -120$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Cofactor expansion for 3×3 determinant","steps":[{"prompt":"Step 1: Why did we expand along row 3?","hint":"Look for a row or column with zeros—it reduces the number of 2×2 minors you need to compute.","answer":"Row 3 contains a zero in position (3,3), so we skip computing that cofactor entirely."},{"prompt":"Step 2: What is the sign $(-1)^{3+1}$ for $C_{31}$?","hint":"The sign in a cofactor is $(-1)^{i+j}$ where $i$ is the row and $j$ is the column. Calculate the exponent: $3 + 1 = ?$","answer":"$3 + 1 = 4$, which is even, so $(-1)^4 = +1$. The cofactor $C_{31}$ is positive."},{"prompt":"Step 3: Why must we include the $2 \\times 2$ minors in the final formula?","hint":"The cofactor expansion formula multiplies each matrix entry by its cofactor. Check: $-1 \\cdot C_{31} + 2 \\cdot C_{32} + 0 \\cdot C_{33}$.","answer":"Each entry in the expansion row (row 3 in this case) is multiplied by its corresponding cofactor. Entry $(3,1) = -1$ gets cofactor $C_{31} = 5$, so contribution is $(-1)(5) = -5$."}],"caption":"Cofactor expansion is systematic: find the row/column with most zeros, compute $2 \\times 2$ minors, apply sign rules, and sum weighted by row/column entries."}
```
