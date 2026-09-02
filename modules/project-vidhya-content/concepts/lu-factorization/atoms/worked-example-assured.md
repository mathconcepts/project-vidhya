---
# Alternative body for lu-factorization.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# The fenced interactive block below is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: lu-factorization.worked-example.assured
concept_id: lu-factorization
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: lu-factorization.worked_example
for_stance: assured
---

$A=\begin{pmatrix}4&3\\6&5\end{pmatrix}$, Doolittle. Row 1 of $U$ is row 1 of $A$ directly: $u_{11}=4,\ u_{12}=3$. Then $\ell_{21}=6/4=3/2$ and $u_{22}=5-(3/2)(3)=1/2$.

$$\boxed{L=\begin{pmatrix}1&0\\3/2&1\end{pmatrix}, \quad U=\begin{pmatrix}4&3\\0&1/2\end{pmatrix}}$$

Barely matters at $2\times2$ — the win is amortized cost when the same $A$ meets several $b$'s: factor once, then each solve is two $O(n^2)$ triangular passes instead of $O(n^3)$ elimination repeated.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: LU factorization of [[4,3],[6,5]]","steps":[{"prompt":"What is u11, the (1,1) entry of U?","hint":"L's first row is (1, 0), so row 1 of LU is just row 1 of U.","answer":"u11 = 4 (and u12 = 3, matching row 1 of A directly)."},{"prompt":"Find l21 from l21 * u11 = 6.","hint":"Divide the (2,1) entry of A by u11.","answer":"l21 = 6 / 4 = 3/2"},{"prompt":"Find u22 from l21*u12 + u22 = 5.","hint":"Substitute (3/2)(3) + u22 = 5 and solve.","answer":"u22 = 5 - 9/2 = 1/2"},{"prompt":"Verify: does L times U reproduce A?","hint":"Multiply the two triangular factors back together.","answer":"[[1,0],[3/2,1]] x [[4,3],[0,1/2]] = [[4,3],[6,5]] = A, confirmed."}],"caption":"Four unknowns, four equations, one row and one column at a time — no simultaneous system to solve."}
```
