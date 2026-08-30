---
# Alternative body for residue-calculus.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: residue-calculus.worked-example.assured
concept_id: residue-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: residue-calculus-worked-example
for_stance: assured
---

$\oint_{|z|=3}\frac{dz}{(z-1)(z+2)}$: both simple poles ($1$, $-2$) lie inside ($|1|,|-2|<3$); residues $\frac13,-\frac13$ sum to $0$, confirmed by partial fractions the same way.

What changes the answer here: shrinking to $|z|=1.5$ drops $z=-2$ outside ($|-2|=2>1.5$), leaving only $\frac13$: the integral becomes $\frac{2\pi i}3$ instead — the function never changed, only which side of a new boundary each pole fell on.

Order matters in the formula, not just location: for $f=\frac1{(z-1)^2(z+2)}$, $z=1$ is order $2$, so $\text{Res}=\frac{d}{dz}\frac1{z+2}\Big|_{z=1}=-\frac1{(z+2)^2}\Big|_{z=1}=-\frac19$ — the simple-pole limit here gives $0$, not the residue, silently.

Never evaluate a pole sitting exactly on $C$: the theorem needs strictly inside or outside; "on" is undefined.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: residue theorem for 1/[(z−1)(z+2)] on |z|=1.5","steps":[{"prompt":"For f(z) = 1/[(z−1)(z+2)], which poles lie inside the contour |z|=1.5?","hint":"Check |1|=1 vs 1.5, and |−2|=2 vs 1.5. A pole is inside if its modulus is strictly less than the radius.","answer":"Only z=1 is inside |z|=1.5, since |1|=1 < 1.5 but |−2|=2 > 1.5."},{"prompt":"Compute the residue at z=1 and then evaluate ∮_{|z|=1.5} f(z) dz.","hint":"Res at simple pole z₀ of 1/[(z−1)(z+2)] is lim_{z→1}(z−1)·f(z) = 1/(1+2) = 1/3. Then apply the residue theorem.","answer":"Res = 1/3. The integral = 2πi × (1/3) = 2πi/3."}]}
```
