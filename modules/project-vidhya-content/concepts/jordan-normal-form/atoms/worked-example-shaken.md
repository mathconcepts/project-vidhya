---
# Alternative body for jordan-normal-form.worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# Prose is held at or below the base atom's length; every step is written
# out in full with an explicit check, no praise, no reassurance.
id: jordan-normal-form.worked-example.shaken
concept_id: jordan-normal-form
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: jordan-normal-form.worked-example
for_stance: shaken
---

**Problem:** Jordan form of $A=\begin{pmatrix}4&1\\-1&2\end{pmatrix}$.

---

**Step 1 — Subtract $\lambda$ down the diagonal, expand the determinant.**

$$\det(A-\lambda I)=(4-\lambda)(2-\lambda)-(1)(-1)=\lambda^2-6\lambda+9$$

---

**Step 2 — Solve.**

$$\lambda^2-6\lambda+9=(\lambda-3)^2=0 \Rightarrow \lambda=3 \text{ (repeated)}$$

---

**Step 3 — Find the eigenvector.**

$$A-3I=\begin{pmatrix}1&1\\-1&-1\end{pmatrix},\quad v_1+v_2=0 \Rightarrow v=(1,-1)$$

Rank of $A-3I$ is $1$: only one independent eigenvector exists.

---

**Step 4 — Find the chain vector $w$, solving $(A-3I)w=v$.**

$$w_1+w_2=1 \Rightarrow w=(1,0)$$

---

**Step 5 — Check and assemble.**

$$Aw=\begin{pmatrix}4\\-1\end{pmatrix}=3w+v \ \checkmark$$

$$\boxed{J=\begin{pmatrix}3&1\\0&3\end{pmatrix}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: building the Jordan chain for a defective 2×2 matrix","steps":[{"prompt":"A has a repeated eigenvalue $\\lambda=3$ with algebraic multiplicity 2, but $\\operatorname{rank}(A-3I)=1$. What does that rank tell you about the geometric multiplicity, and what does it force about the Jordan form?","hint":"$\\dim\\ker(A-3I) = 2 - \\operatorname{rank}(A-3I)$. Compare that to the algebraic multiplicity.","answer":"Geometric multiplicity is $2-1=1$, strictly less than the algebraic multiplicity $2$. The matrix is defective, so it cannot be diagonalized — the eigenvalue must sit in a single $2\\times2$ Jordan block with a $1$ on the superdiagonal."},{"prompt":"Given the eigenvector $v=(1,-1)$, how do you find the generalized eigenvector $w$ that completes the Jordan chain, and how do you check it's right?","hint":"Solve $(A-3I)w=v$ for $w$, then verify $Aw=3w+v$ directly.","answer":"Solve $(A-3I)w=v$: $w_1+w_2=1$ gives $w=(1,0)$. Check by direct multiplication: $Aw=(4,-1)=3(1,0)+(1,-1)=3w+v$ — this is exactly the column relation that makes $J=\\begin{pmatrix}3&1\\\\0&3\\end{pmatrix}$ correct."}]}
```
