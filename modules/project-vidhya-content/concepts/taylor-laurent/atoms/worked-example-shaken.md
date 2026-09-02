---
# Alternative body for taylor-laurent.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: taylor-laurent.worked-example.shaken
concept_id: taylor-laurent
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: taylor-laurent.worked-example
for_stance: shaken
---

**Problem:** Laurent-expand $f(z)=\dfrac{z}{(z-1)(z-2)}$ for $1<|z|<2$; classify.

**Step 1 — partial fractions.** $\dfrac{z}{(z-1)(z-2)}=\dfrac{A}{z-1}+\dfrac{B}{z-2}$. Clear denominators: $z=A(z-2)+B(z-1)$. Set $z=1$: $1=-A\Rightarrow A=-1$. Set $z=2$: $2=B\Rightarrow B=2$. So $f(z)=\dfrac{-1}{z-1}+\dfrac2{z-2}$.

**Step 2 — expand each term for this annulus.** Since $|z|>1$: $\dfrac{-1}{z-1}=\dfrac{-1}z\cdot\dfrac1{1-1/z}=\sum_{n=1}^\infty\dfrac{-1}{z^n}$ — all negative powers. Since $|z|<2$: $\dfrac2{z-2}=-\sum_{n=0}^\infty\dfrac{z^n}{2^n}$ — all non-negative powers.

**Step 3 — combine.** $f(z)=\sum_{n=1}^\infty\dfrac{-1}{z^n}-\sum_{n=0}^\infty\dfrac{z^n}{2^n}$.

**Step 4 — classify carefully.** This series is centered at $z=0$, not a singularity of $f$ — the negative power $-1/z$ is only tracking the pole at $z=1$. Re-expand $\frac{-1}{z-1}$ around $z=1$ directly: already one term, $-(z-1)^{-1}$, so $z=1$ is a **simple pole**, residue $a_{-1}=-1$. $z=2$ is outside this annulus; expanding for $|z|>2$ would show it too as a simple pole, residue $+2$.

Which powers show up in an expansion depends on the annulus you chose; a pole's *order* doesn't — read it from a series centered at the pole itself, never from one centered somewhere else.
