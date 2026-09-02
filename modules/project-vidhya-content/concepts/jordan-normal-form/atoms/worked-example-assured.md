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
