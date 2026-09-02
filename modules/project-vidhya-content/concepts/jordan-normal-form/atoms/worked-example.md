---
id: jordan-normal-form.worked-example
concept_id: jordan-normal-form
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find the Jordan normal form of $A = \begin{pmatrix}4&1\\-1&2\end{pmatrix}$.

---

**Step 1 — Characteristic polynomial.** $\det(A-\lambda I)=(4-\lambda)(2-\lambda)-(1)(-1)=\lambda^2-6\lambda+9=(\lambda-3)^2$. Eigenvalue $\lambda=3$, algebraic multiplicity $2$.

---

**Step 2 — Eigenspace.** $A-3I=\begin{pmatrix}1&1\\-1&-1\end{pmatrix}$, rank $1$, so $\dim\ker(A-3I)=2-1=1$. Geometric multiplicity $1<2$ — defective. Solving $(A-3I)v=0$: $v_1+v_2=0$, so $v=(1,-1)$.

---

**Step 3 — Generalized eigenvector.** Geometric multiplicity $1$ with algebraic multiplicity $2$ forces a single Jordan block of size $2$: one more chain vector is needed. Solve $(A-3I)w=v$: $w_1+w_2=1$, so $w=(1,0)$ works.

---

**Step 4 — Assemble.** With $P=\begin{pmatrix}1&1\\-1&0\end{pmatrix}$ (columns $v,w$):

$$\boxed{J = P^{-1}AP = \begin{pmatrix}3&1\\0&3\end{pmatrix}}$$

Check: $Aw=\begin{pmatrix}4\\-1\end{pmatrix}=3\begin{pmatrix}1\\0\end{pmatrix}+\begin{pmatrix}1\\-1\end{pmatrix}=3w+v$ ✓ — exactly the relation $J$ encodes.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: building the Jordan chain for a defective 2×2 matrix","steps":[{"prompt":"A has a repeated eigenvalue $\\lambda=3$ with algebraic multiplicity 2, but $\\operatorname{rank}(A-3I)=1$. What does that rank tell you about the geometric multiplicity, and what does it force about the Jordan form?","hint":"$\\dim\\ker(A-3I) = 2 - \\operatorname{rank}(A-3I)$. Compare that to the algebraic multiplicity.","answer":"Geometric multiplicity is $2-1=1$, strictly less than the algebraic multiplicity $2$. The matrix is defective, so it cannot be diagonalized — the eigenvalue must sit in a single $2\\times2$ Jordan block with a $1$ on the superdiagonal."},{"prompt":"Given the eigenvector $v=(1,-1)$, how do you find the generalized eigenvector $w$ that completes the Jordan chain, and how do you check it's right?","hint":"Solve $(A-3I)w=v$ for $w$, then verify $Aw=3w+v$ directly.","answer":"Solve $(A-3I)w=v$: $w_1+w_2=1$ gives $w=(1,0)$. Check by direct multiplication: $Aw=(4,-1)=3(1,0)+(1,-1)=3w+v$ — this is exactly the column relation that makes $J=\\begin{pmatrix}3&1\\\\0&3\\end{pmatrix}$ correct."}]}
```
