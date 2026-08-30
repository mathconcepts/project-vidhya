---
# Alternative body for complex-integration.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: complex-integration.worked-example.assured
concept_id: complex-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: complex-integration-worked-example
for_stance: assured
---

$\dfrac{z}{z^2-1}=\frac12\left(\dfrac1{z-1}+\dfrac1{z+1}\right)$, poles $\pm1$ both inside $|z|=2$. Cauchy's formula on each piece gives $\frac12(2\pi i)+\frac12(2\pi i)=2\pi i$; equivalently $2\pi i\sum\text{Res}=2\pi i(\frac12+\frac12)=2\pi i$ — same number either route, once the residues are this easy to read.

What separates right from wrong here: which poles are *inside*, not merely singularities of the integrand. Shrink the contour to $|z|=0.5$ and both poles move outside; the integral drops to $0$ by Cauchy's theorem — same function, smaller loop.

Faster route with $\ge2$ poles inside: skip the Integral Formula per term and go straight to $2\pi i\sum\text{Res}$, reading each simple-pole residue off as $\lim_{z\to z_0}(z-z_0)f(z)$ — no partial-fraction bookkeeping required.

Common false generalization: a pole *on* the contour makes the integral undefined, not zero — check strict inequality, never $\le$, when deciding "inside".

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: applying Cauchy's integral formula to contour poles","steps":[{"prompt":"Evaluate ∮_C 1/(z−2) dz where C is |z|=3 (counterclockwise). Is z=2 inside C?","hint":"Check |2| = 2 < 3. If the pole is inside, apply Cauchy's integral formula ∮ dz/(z−z₀) = 2πi.","answer":"Yes, |2|=2 < 3 so z=2 is inside C. By Cauchy's formula, ∮ dz/(z−2) = 2πi."},{"prompt":"Now evaluate ∮_C 1/(z−5) dz where C is still |z|=3. Is z=5 inside C?","hint":"Check |5|=5 > 3. If the singularity is outside the contour and f is analytic inside, Cauchy's theorem applies.","answer":"No, |5|=5 > 3 so z=5 is outside C. Since 1/(z−5) is analytic inside |z|=3, ∮ dz/(z−5) = 0."}]}
```
