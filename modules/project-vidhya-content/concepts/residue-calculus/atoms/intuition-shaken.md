---
# Alternative body for residue-calculus.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: residue-calculus.intuition.shaken
concept_id: residue-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: residue-calculus-intuition
for_stance: shaken
---

Take $f(z)=1/(z-2)^3$ at $z_0=2$. Written as a series in $(z-2)$ it collapses to a single piece, $(z-2)^{-3}$, exponent $-3$. Terms with a negative exponent make up the **principal part**; the specific coefficient multiplying $(z-2)^{-1}$ is what gets called the **residue**. For this $f$, no $(z-2)^{-1}$ shows up anywhere, so the residue here is $0$.

How many negative exponents a singularity carries decides its name: $\sin z/z$ at $z=0$ has none of them — removable. A function whose only bad term is $c_{-1}(z-z_0)^{-1}$ has a simple pole. One where the negative exponents stop exactly at $(z-z_0)^{-n}$ has a pole of order $n$. A function whose negative exponents keep going forever is essential.

At a simple pole, $\text{Res}=\lim_{z\to z_0}(z-z_0)f(z)$; when $f=p/q$ with $q(z_0)=0,q'(z_0)\neq0$, the shortcut is $p(z_0)/q'(z_0)$. At order $n$, $\text{Res}=\frac1{(n-1)!}\lim_{z\to z_0}\frac{d^{n-1}}{dz^{n-1}}[(z-z_0)^nf(z)]$ — plug in $n=1$ and it collapses back to the simple-pole limit above.

Residue theorem: $\oint_Cf\,dz=2\pi i\sum\text{Res}$, adding up only the singularities sitting inside $C$.

Count the negative exponents before picking a formula — guessing the type first is where a wrong number usually starts.
