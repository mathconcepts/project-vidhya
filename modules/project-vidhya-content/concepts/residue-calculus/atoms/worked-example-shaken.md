---
# Alternative body for residue-calculus.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: residue-calculus.worked-example.shaken
concept_id: residue-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: residue-calculus-worked-example
for_stance: shaken
---

**Problem:** $\oint_C\frac{dz}{(z-1)(z+2)}$, $C:|z|=3$.

**Step 1 — poles.** $z=1$ and $z=-2$, both simple.

**Step 2 — inside $C$?** $|1|=1<3$ and $|-2|=2<3$ — both inside.

**Step 3 — residues.** At $z=1$: $\lim_{z\to1}(z-1)f(z)=\frac1{1+2}=\frac13$. At $z=-2$: $\lim_{z\to-2}(z+2)f(z)=\frac1{-2-1}=-\frac13$.

**Step 4 — sum and multiply.** $2\pi i\left(\frac13-\frac13\right)=0$.

**Check** via partial fractions: $\frac1{(z-1)(z+2)}=\frac{1/3}{z-1}-\frac{1/3}{z+2}$, giving $\frac13(2\pi i)-\frac13(2\pi i)=0$, matching.

**Watch for:** shrinking $C$ to $|z|=1.5$ leaves only $z=1$ inside, giving $\frac{2\pi i}3$ instead. For $f=\frac1{(z-1)^2(z+2)}$, $z=1$ is order $2$: $\text{Res}=\frac{d}{dz}\frac1{z+2}\Big|_{z=1}=-\frac1{(z+2)^2}\Big|_{z=1}=-\frac19$, not $\frac13$. A pole exactly on $C$ is never defined — check strict inequality only.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: residue theorem for 1/[(z−1)(z+2)] on |z|=1.5","steps":[{"prompt":"For f(z) = 1/[(z−1)(z+2)], which poles lie inside the contour |z|=1.5?","hint":"Check |1|=1 vs 1.5, and |−2|=2 vs 1.5. A pole is inside if its modulus is strictly less than the radius.","answer":"Only z=1 is inside |z|=1.5, since |1|=1 < 1.5 but |−2|=2 > 1.5."},{"prompt":"Compute the residue at z=1 and then evaluate ∮_{|z|=1.5} f(z) dz.","hint":"Res at simple pole z₀ of 1/[(z−1)(z+2)] is lim_{z→1}(z−1)·f(z) = 1/(1+2) = 1/3. Then apply the residue theorem.","answer":"Res = 1/3. The integral = 2πi × (1/3) = 2πi/3."}]}
```
