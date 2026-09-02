---
# Alternative body for taylor-laurent.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: taylor-laurent.worked-example.assured
concept_id: taylor-laurent
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: taylor-laurent.worked-example
for_stance: assured
---

$f(z)=\dfrac{z}{(z-1)(z-2)}=\dfrac{-1}{z-1}+\dfrac2{z-2}$. In $1<|z|<2$: expand the first term for $|z|>1$, the second for $|z|<2$ — the annulus dictates which geometric series converges, not preference.

$\dfrac{-1}{z-1}=\sum_{n=1}^\infty(-1)z^{-n}$, $\dfrac2{z-2}=-\sum_{n=0}^\infty(z/2)^n$; combined, the principal part is just $-z^{-1}$.

Mark-losing point: this expansion is centered at $z=0$, which is not itself a singularity — the one visible negative power is tracking the nearby pole at $z=1$, not classifying "$z=0$." Re-center directly at $z=1$ to read it properly: **simple pole**, $\text{Res}=-1$, matching $\lim_{z\to1}(z-1)f(z)=\frac1{1-2}=-1$. The pole at $z=2$ doesn't vanish — it's simply outside this annulus; re-centering at $z=2$ shows order $1$, residue $+2$ ($\lim_{z\to2}(z-2)f(z)=\frac2{2-1}=2$).

Classification shortcut once centered at the actual pole: count negative-power terms — none is removable, finitely many ($m$) is order $m$, infinite is essential.
