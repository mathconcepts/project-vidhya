---
id: residue-calculus.interleaved-drill
concept_id: residue-calculus
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: residue-calculus.micro-exercise
---

**Cross-concept check: residue-calculus → complex-integration.**

**Question 1 (residue-calculus):** Using this concept's worked example, evaluate $\oint_{|z|=2}\frac{e^z}{z^2}dz$ via the residue theorem, given $\text{Res}_{z=0}=1$.

*Answer:* $2\pi i\times1=2\pi i$.

**Question 2 (complex-integration):** Now evaluate the same integral using the generalized Cauchy integral formula instead, treating $e^z$ as the entire function and $z_0=0$.

*Answer:* $f^{(n)}(0)=\frac{n!}{2\pi i}\oint\frac{f(z)}{z^{n+1}}dz$ with $n+1=2\Rightarrow n=1$: $f'(0)=\frac1{2\pi i}\oint\frac{e^z}{z^2}dz$, so $\oint=2\pi i\,f'(0)=2\pi i\,e^0=2\pi i$ — the same answer, reached without ever naming a "residue."

**Why this drill exists:** residue calculus can feel like a brand-new toolkit bolted onto complex integration. For an integrand built as (entire function)$/(z-z_0)^{n+1}$, it is *exactly* Cauchy's differentiation formula wearing different notation — seeing both routes land on $2\pi i$ the same way stops the two topics from being memorized as unrelated.
