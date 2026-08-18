---
# Alternative body for lu-factorization.worked_example, served when the
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
id: lu-factorization.worked-example.shaken
concept_id: lu-factorization
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: lu-factorization.worked_example
for_stance: shaken
---

## Set it up

$A=\begin{pmatrix}4&3\\6&5\end{pmatrix}$. In Doolittle form, $L=\begin{pmatrix}1&0\\\ell_{21}&1\end{pmatrix}$, $U=\begin{pmatrix}u_{11}&u_{12}\\0&u_{22}\end{pmatrix}$.

Row 1 of $LU$ is just row 1 of $U$: $u_{11}=4,\ u_{12}=3$.

$\ell_{21}u_{11}=6 \Rightarrow \ell_{21}=3/2$, and $\ell_{21}u_{12}+u_{22}=5 \Rightarrow u_{22}=1/2$.

## Check it multiplies back to $A$

$$\begin{pmatrix}1&0\\3/2&1\end{pmatrix}\begin{pmatrix}4&3\\0&1/2\end{pmatrix}=\begin{pmatrix}4&3\\6&5\end{pmatrix}=A \quad\checkmark$$

$$\boxed{L=\begin{pmatrix}1&0\\3/2&1\end{pmatrix}, \quad U=\begin{pmatrix}4&3\\0&1/2\end{pmatrix}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: LU Factorization of a 2×2 Matrix","steps":[{"prompt":"What is the first entry $u_{11}$ of $U$?","hint":"In Doolittle form, the first row of $LU$ is just the first row of $U$ (since $L$ has 1s on diagonal). Match the (1,1) entry of $A$.","answer":"$u_{11} = 4$"},{"prompt":"Find $\\ell_{21}$, the (2,1) entry of $L$. You know $\\ell_{21} \\cdot u_{11} = 6$.","hint":"Divide: $\\ell_{21} = 6 / u_{11}$.","answer":"$\\ell_{21} = 6/4 = 3/2$"},{"prompt":"Now find $u_{22}$. Use the equation $\\ell_{21} u_{12} + u_{22} = 5$.","hint":"Substitute $(3/2)(3) + u_{22} = 5$. Solve for $u_{22}$.","answer":"$u_{22} = 5 - 9/2 = 1/2$"}],"caption":"Master the Doolittle algorithm: Extract each entry systematically from the matrix equation $LU = A$."}
```
