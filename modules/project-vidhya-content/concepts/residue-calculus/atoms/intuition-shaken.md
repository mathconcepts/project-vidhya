---
# Alternative body for residue-calculus.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: residue-calculus.intuition.shaken
concept_id: residue-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
variant_of: residue-calculus.intuition
for_stance: shaken
---

Take $f(z)=1/(z-2)^3$ at $z_0=2$. As a series in $(z-2)$ it is one term, $(z-2)^{-3}$. Negative-exponent terms form the **principal part**; the coefficient on $(z-2)^{-1}$ specifically is the **residue**. Here no $(z-2)^{-1}$ term exists, so the residue is $0$.

The count of negative exponents names the singularity: none — removable ($\sin z/z$ at $0$); just $c_{-1}(z-z_0)^{-1}$ — simple pole; stopping at $(z-z_0)^{-n}$ — pole of order $n$; infinitely many — essential.

Simple pole: $\text{Res}=\lim_{z\to z_0}(z-z_0)f(z)$, or $p(z_0)/q'(z_0)$ when $f=p/q$, $q'(z_0)\neq0$. Order $n$: $\text{Res}=\frac1{(n-1)!}\lim_{z\to z_0}\frac{d^{n-1}}{dz^{n-1}}[(z-z_0)^nf(z)]$.

Residue theorem: $\oint_Cf\,dz=2\pi i\sum\text{Res}$, over singularities inside $C$.

Count the negative exponents before picking a formula.
