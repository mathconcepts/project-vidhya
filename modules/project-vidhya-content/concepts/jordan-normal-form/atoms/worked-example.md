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
