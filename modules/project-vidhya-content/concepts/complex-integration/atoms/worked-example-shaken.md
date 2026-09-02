---
# Alternative body for complex-integration.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: complex-integration.worked-example.shaken
concept_id: complex-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: complex-integration.worked-example
for_stance: shaken
---

Start smaller than the actual problem: what is $\oint_C\frac{dz}{z-1}$ alone, on $|z|=2$? Since $|1|=1<2$, $z=1$ is inside, and Cauchy's formula with $f\equiv1$ gives exactly $2\pi i$.

Now the real integrand: $\dfrac{z}{z^2-1}=\dfrac{z}{(z-1)(z+1)}$, poles at $z=1$ and $z=-1$; both satisfy $|{\pm1}|=1<2$, so both are inside $C$ — the single-pole formula can't be applied to this yet.

**Split it.** $\dfrac{z}{(z-1)(z+1)}=\dfrac{A}{z-1}+\dfrac{B}{z+1}$. Multiply both sides by $(z-1)(z+1)$: $z=A(z+1)+B(z-1)$. Plug in $z=1$: $1=2A\Rightarrow A=\frac12$. Plug in $z=-1$: $-1=-2B\Rightarrow B=\frac12$.

**Apply the smaller result to each piece.** $\oint_C\frac{dz}{z-1}=2\pi i$, and by the same reasoning $\oint_C\frac{dz}{z+1}=2\pi i$. Total: $\frac12(2\pi i)+\frac12(2\pi i)=2\pi i$.

**Check** with residues: $2\pi i\sum\text{Res}$, residues $\frac12$ at each pole, sum $1$, times $2\pi i$ gives $2\pi i$ — matches.

The habit worth keeping: split a multi-pole integrand into single-pole pieces before reaching for a formula built for one.
