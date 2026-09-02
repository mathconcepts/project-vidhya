---
# Alternative body for residue-calculus.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: residue-calculus.worked-example.shaken
concept_id: residue-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: residue-calculus.worked-example
for_stance: shaken
---

**Problem:** $\oint_C\frac{e^z}{z^2}dz$, $C:|z|=2$.

**Step 1 — find the pole and its order.** Only singularity: $z=0$. The denominator $z^2$ vanishes to order $2$ there — a pole of order $2$. Since $|0|=0<2$, it's inside $C$.

**Step 2 — apply the order-2 formula.** $\text{Res}_{z=0}=\dfrac1{1!}\lim_{z\to0}\dfrac{d}{dz}\left[z^2\cdot\dfrac{e^z}{z^2}\right]=\lim_{z\to0}\dfrac{d}{dz}[e^z]=\lim_{z\to0}e^z=1$.

**Step 3 — apply the residue theorem.** $2\pi i\times1=2\pi i$.

**Check** via the generalized Cauchy formula: $f(z)=e^z$ is entire, and $f'(0)=\frac1{2\pi i}\oint\frac{e^z}{z^2}dz$, so $\oint=2\pi i\,f'(0)=2\pi i\,e^0=2\pi i$ — matches.

**Watch for:** trying the simple-pole shortcut $\lim_{z\to0}z\cdot\frac{e^z}{z^2}=\lim_{z\to0}\frac{e^z}z$ instead — this limit doesn't exist, because the true pole order is $2$, not $1$. A pole exactly on $C$ is never defined; only strict inequality decides "inside."
