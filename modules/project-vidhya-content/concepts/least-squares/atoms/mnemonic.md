---
id: least-squares.mnemonic
concept_id: least-squares
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Normal" in "normal equations" means perpendicular, not ordinary.** That one word is the whole derivation. The best $\hat{x}$ is the one whose residual $r = b - A\hat{x}$ is perpendicular to every column of $A$:

$$A^T(b - A\hat{x}) = 0 \quad \Longrightarrow \quad A^TA\hat{x} = A^Tb$$

So you never memorise the normal equations — you write "residual $\perp$ columns," multiply out, and they fall out in one line.

**The one-move recipe: hit both sides with $A^T$.** $Ax = b$ has no solution. $A^TAx = A^Tb$ does. Squaring up the tall matrix is the entire method.

**The projection twin.** $A\hat{x} = Pb$ where $P = A(A^TA)^{-1}A^T$ is the hat matrix. Two properties are worth remembering because they're free marks: $P^2 = P$ (projecting a shadow again doesn't move it) and $P^T = P$.

**Sanity-check reflex:** after solving, compute $A^Tr$. It must be the zero vector — every entry, not just the first. If it isn't, the arithmetic slipped, and it slipped before you formed $A^Tb$. This check is faster than redoing the solve.
