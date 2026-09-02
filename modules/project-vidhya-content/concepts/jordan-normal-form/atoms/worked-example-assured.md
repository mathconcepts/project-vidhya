---
# Alternative body for jordan-normal-form.worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinction that actually costs
# marks (when block sizes stop being forced) rather than re-deriving J.
id: jordan-normal-form.worked-example.assured
concept_id: jordan-normal-form
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: jordan-normal-form.worked-example
for_stance: assured
---

**Problem:** Jordan form of $A=\begin{pmatrix}4&1\\-1&2\end{pmatrix}$.

**By the multiplicities.** $\operatorname{tr}(A)=6$, $\det(A)=9 \Rightarrow \lambda^2-6\lambda+9=(\lambda-3)^2$ — repeated $\lambda=3$, no need to expand $\det(A-\lambda I)$ term by term.

$\operatorname{rank}(A-3I)=1\Rightarrow$ geometric multiplicity $1$ against algebraic multiplicity $2$: exactly one Jordan block, size $2$.

$$\boxed{J=\begin{pmatrix}3&1\\0&3\end{pmatrix}}$$

**Where this stops being forced.** Block sizes are automatic whenever geometric multiplicity is $1$ (one block, sized to the full algebraic multiplicity) or algebraic multiplicity is at most $3$. The first real fork is algebraic multiplicity $4$ with geometric multiplicity $2$: the split could be $3+1$ or $2+2$, and only $\operatorname{rank}(A-\lambda I)^2$ — not $\operatorname{rank}(A-\lambda I)$ alone — tells them apart.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: building the Jordan chain for a defective 2×2 matrix","steps":[{"prompt":"A has a repeated eigenvalue $\\lambda=3$ with algebraic multiplicity 2, but $\\operatorname{rank}(A-3I)=1$. What does that rank tell you about the geometric multiplicity, and what does it force about the Jordan form?","hint":"$\\dim\\ker(A-3I) = 2 - \\operatorname{rank}(A-3I)$. Compare that to the algebraic multiplicity.","answer":"Geometric multiplicity is $2-1=1$, strictly less than the algebraic multiplicity $2$. The matrix is defective, so it cannot be diagonalized — the eigenvalue must sit in a single $2\\times2$ Jordan block with a $1$ on the superdiagonal."},{"prompt":"Given the eigenvector $v=(1,-1)$, how do you find the generalized eigenvector $w$ that completes the Jordan chain, and how do you check it's right?","hint":"Solve $(A-3I)w=v$ for $w$, then verify $Aw=3w+v$ directly.","answer":"Solve $(A-3I)w=v$: $w_1+w_2=1$ gives $w=(1,0)$. Check by direct multiplication: $Aw=(4,-1)=3(1,0)+(1,-1)=3w+v$ — this is exactly the column relation that makes $J=\\begin{pmatrix}3&1\\\\0&3\\end{pmatrix}$ correct."}]}
```
