---
id: quadratic-forms.mnemonic
concept_id: quadratic-forms
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"The diagonal keeps it all; the cross-term splits in half."**

Going from $f$ to $A$:

- coefficient of $x_i^2$ → sits whole at $a_{ii}$
- coefficient of $x_i x_j$ → **halved**, then placed at *both* $a_{ij}$ and $a_{ji}$

Going the other way ($A$ to $f$), off-diagonals get **doubled**, because each one is met twice in the sum. Halve going in, double coming out — that single sentence is where almost every sign-and-factor slip lives.

**What "form" means:** *homogeneous* of degree exactly 2. Every term is degree 2 — no linear term, no constant. If you see a stray $x$ or a $+7$, it is not a quadratic form.

**Two-variable shortcut worth memorising.** Write $f = ax^2 + 2hxy + by^2$ (note the $2h$ — that convention pre-halves the cross-term for you). Then:

$$\text{positive definite} \iff a > 0 \ \text{ and } \ ab - h^2 > 0$$

That is Sylvester's criterion written out for $2\times2$, with nothing left to derive.

**Sanity-check reflex:** substitute $\mathbf{x} = \mathbf{e}_1$ — you must get $a_{11}$ back. Then substitute $(1,1,0,\ldots)$ — you must get $a_{11} + a_{22} + 2a_{12}$. Two seconds, and it catches a forgotten halving before it propagates into the eigenvalues.
