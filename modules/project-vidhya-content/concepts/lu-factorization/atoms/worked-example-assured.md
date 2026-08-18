---
# Alternative body for lu-factorization.worked_example, served when the
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
id: lu-factorization.worked-example.assured
concept_id: lu-factorization
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: lu-factorization.worked_example
for_stance: assured
---

## Solve for the entries

$A=\begin{pmatrix}4&3\\6&5\end{pmatrix}$, Doolittle form. Row 1 of $U$ equals row 1 of $A$ (since $L$'s first row is $(1,0)$): $u_{11}=4,\ u_{12}=3$. Then $\ell_{21}=6/u_{11}=3/2$, and $u_{22}=5-\ell_{21}u_{12}=5-9/2=1/2$.

$$\boxed{L=\begin{pmatrix}1&0\\3/2&1\end{pmatrix}, \quad U=\begin{pmatrix}4&3\\0&1/2\end{pmatrix}}$$

## Why this pays off

Barely matters at $2\times2$ — the win shows up when the same $A$ meets multiple $b$'s: factor once, then each solve is $Ly=b$ followed by $Ux=y$, both triangular and $O(n^2)$, instead of re-running $O(n^3)$ elimination every time.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: LU Factorization of a 2×2 Matrix","steps":[{"prompt":"What is the first entry $u_{11}$ of $U$?","hint":"In Doolittle form, the first row of $LU$ is just the first row of $U$ (since $L$ has 1s on diagonal). Match the (1,1) entry of $A$.","answer":"$u_{11} = 4$"},{"prompt":"Find $\\ell_{21}$, the (2,1) entry of $L$. You know $\\ell_{21} \\cdot u_{11} = 6$.","hint":"Divide: $\\ell_{21} = 6 / u_{11}$.","answer":"$\\ell_{21} = 6/4 = 3/2$"},{"prompt":"Now find $u_{22}$. Use the equation $\\ell_{21} u_{12} + u_{22} = 5$.","hint":"Substitute $(3/2)(3) + u_{22} = 5$. Solve for $u_{22}$.","answer":"$u_{22} = 5 - 9/2 = 1/2$"}],"caption":"Master the Doolittle algorithm: Extract each entry systematically from the matrix equation $LU = A$."}
```
