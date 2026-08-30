---
# Alternative body for complex-integration.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: complex-integration.worked-example.shaken
concept_id: complex-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: complex-integration-worked-example
for_stance: shaken
---

Start smaller than the actual problem: what is $\oint_C\frac{dz}{z-1}$ alone, on $|z|=2$? Since $|1|=1<2$, $z=1$ is inside, and Cauchy's formula with $f\equiv1$ gives exactly $2\pi i$.

Now the real integrand: $\dfrac{z}{z^2-1}=\dfrac{z}{(z-1)(z+1)}$, poles at $z=1$ and $z=-1$; both satisfy $|{\pm1}|=1<2$, so both are inside $C$.

**Split it.** $\dfrac{z}{(z-1)(z+1)}=\dfrac{A}{z-1}+\dfrac{B}{z+1}$. Multiply both sides by $(z-1)(z+1)$: $z=A(z+1)+B(z-1)$. Plug in $z=1$: $1=2A\Rightarrow A=\frac12$. Plug in $z=-1$: $-1=-2B\Rightarrow B=\frac12$.

**Apply the smaller result to each piece.** $\oint_C\frac{dz}{z-1}=2\pi i$, and by the same reasoning $\oint_C\frac{dz}{z+1}=2\pi i$. Total: $\frac12(2\pi i)+\frac12(2\pi i)=2\pi i$.

**Check** with residues: $2\pi i\sum\text{Res}$, residues $\frac12$ at each pole, sum $1$, times $2\pi i$ gives $2\pi i$ — matches.

The habit worth keeping: break a multi-pole integrand into single-pole pieces before reaching for a formula built for one.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: applying Cauchy's integral formula to contour poles","steps":[{"prompt":"Evaluate ∮_C 1/(z−2) dz where C is |z|=3 (counterclockwise). Is z=2 inside C?","hint":"Check |2| = 2 < 3. If the pole is inside, apply Cauchy's integral formula ∮ dz/(z−z₀) = 2πi.","answer":"Yes, |2|=2 < 3 so z=2 is inside C. By Cauchy's formula, ∮ dz/(z−2) = 2πi."},{"prompt":"Now evaluate ∮_C 1/(z−5) dz where C is still |z|=3. Is z=5 inside C?","hint":"Check |5|=5 > 3. If the singularity is outside the contour and f is analytic inside, Cauchy's theorem applies.","answer":"No, |5|=5 > 3 so z=5 is outside C. Since 1/(z−5) is analytic inside |z|=3, ∮ dz/(z−5) = 0."}]}
```
