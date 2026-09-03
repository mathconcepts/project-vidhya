---
id: lu-factorization.worked_example
concept_id: lu-factorization
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Find the Doolittle LU factorization of $A = \begin{pmatrix} 4 & 3 \\ 6 & 5 \end{pmatrix}$.

---

**Step 1 — Fix the shape.** $L=\begin{pmatrix}1&0\\\ell_{21}&1\end{pmatrix}$, $U=\begin{pmatrix}u_{11}&u_{12}\\0&u_{22}\end{pmatrix}$. Four unknowns to find.

---

**Step 2 — Read off row 1.** Since $L$'s first row is $(1,0)$, row 1 of $LU$ equals row 1 of $U$: $u_{11}=4$, $u_{12}=3$.

---

**Step 3 — Solve for the rest.** $\ell_{21}u_{11}=6 \Rightarrow \ell_{21}=6/4=3/2$. $\ell_{21}u_{12}+u_{22}=5 \Rightarrow (3/2)(3)+u_{22}=5 \Rightarrow u_{22}=5-9/2=1/2$.

---

**Step 4 — Verify.** $\begin{pmatrix}1&0\\3/2&1\end{pmatrix}\begin{pmatrix}4&3\\0&1/2\end{pmatrix}=\begin{pmatrix}4&3\\6&5\end{pmatrix}=A$ ✓.

$$\boxed{L=\begin{pmatrix}1&0\\3/2&1\end{pmatrix}, \quad U=\begin{pmatrix}4&3\\0&1/2\end{pmatrix}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","why":"Watching the steps above is not the same as filling them in yourself — try rebuilding L and U for this exact matrix.","title":"Walk through: LU factorization of $A=\\begin{pmatrix}4&3\\\\6&5\\end{pmatrix}$","steps":[{"prompt":"What is $u_{11}$, the $(1,1)$ entry of $U$?","hint":"$L$'s first row is $(1,0)$, so row 1 of $LU$ is just row 1 of $U$.","answer":"$u_{11}=4$ (and $u_{12}=3$, matching row 1 of $A$ directly)."},{"prompt":"Find $\\ell_{21}$ from $\\ell_{21}u_{11}=6$.","hint":"Divide the $(2,1)$ entry of $A$ by $u_{11}$.","answer":"$\\ell_{21} = 6/4 = 3/2$"},{"prompt":"Find $u_{22}$ from $\\ell_{21}u_{12}+u_{22}=5$.","hint":"Substitute $(3/2)(3) + u_{22} = 5$ and solve.","answer":"$u_{22} = 5 - 9/2 = 1/2$"},{"prompt":"Verify: does $LU$ reproduce $A$?","hint":"Multiply the two triangular factors back together.","answer":"$\\begin{pmatrix}1&0\\\\3/2&1\\end{pmatrix}\\begin{pmatrix}4&3\\\\0&1/2\\end{pmatrix}=\\begin{pmatrix}4&3\\\\6&5\\end{pmatrix}=A$, confirmed."}],"caption":"Four unknowns, four equations, one row and one column at a time — no simultaneous system to solve."}
```
