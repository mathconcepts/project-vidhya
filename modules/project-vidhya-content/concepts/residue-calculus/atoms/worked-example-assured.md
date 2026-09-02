---
# Alternative body for residue-calculus.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: residue-calculus.worked-example.assured
concept_id: residue-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: residue-calculus.worked-example
for_stance: assured
---

$\oint_{|z|=2}\frac{e^z}{z^2}dz$: pole of order $2$ at $z=0$, inside $C$. $\text{Res}=\lim_{z\to0}\frac{d}{dz}[z^2\cdot e^z/z^2]=\lim_{z\to0}\frac{d}{dz}e^z=1$, so the integral is $2\pi i$.

Cross-check via the generalized Cauchy formula: $f(z)=e^z$ entire, $f'(0)=\frac{1!}{2\pi i}\oint e^z/z^2\,dz\Rightarrow\oint=2\pi i\,f'(0)=2\pi i$ — same number, confirming residue calculus for a pole built from an entire function over $(z-z_0)^{n+1}$ is exactly Cauchy's derivative formula in different notation.

What changes the answer: the simple-pole limit $\lim_{z\to0}z\cdot e^z/z^2=\lim_{z\to0}e^z/z$ doesn't exist — order matters in the *formula*, not just in locating the pole. Using $m=1$ where the true order is $2$ produces a divergent limit instead of a wrong-but-finite number, which is at least a visible tell that the order was misjudged.

Never evaluate a pole sitting exactly on $C$: the theorem needs strictly inside or outside; "on" is undefined.
