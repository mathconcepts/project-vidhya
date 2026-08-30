---
# Alternative body for taylor-laurent.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: taylor-laurent.worked-example.assured
concept_id: taylor-laurent
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: taylor-laurent.worked-example
for_stance: assured
---

$f(z)=\dfrac{z}{(z-1)(z-2)}=\dfrac{-1}{z-1}+\dfrac2{z-2}$. In $1<|z|<2$: expand the first term for $|z|>1$, the second for $|z|<2$ — the annulus dictates which geometric series converges, not preference.

$\dfrac{-1}{z-1}=\sum_{n=1}^\infty(-1)z^{-n}$, $\dfrac2{z-2}=-\sum_{n=0}^\infty(z/2)^n$; combined, the principal part is just $-z^{-1}$ — one negative power, so $z=1$ is a **simple pole**, $\text{Res}=a_{-1}=-1$, matching $\lim_{z\to1}(z-1)f(z)=\frac1{1-2}=-1$.

Mark-losing point: $z=2$'s pole doesn't vanish, it's simply outside the annulus $1<|z|<2$ in use. Re-centering for $|z|>2$ would show it as order $1$, residue $+2$ ($\lim_{z\to2}(z-2)f(z)=\frac2{2-1}=2$) — same pole, different visible series depending on the region.

Classification shortcut once centered at the pole: count negative-power terms — none is removable, finitely many ($m$) is order $m$, infinite is essential.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Laurent expansion in annulus","steps":[{"prompt":"Step 1: Why do we expand $\\frac{-1}{z-1}$ using $|z|>1$ but $\\frac{2}{z-2}$ using $|z|<2$?","hint":"The annulus is $1 < |z| < 2$. For the singularity at $z=1$, we need $|z|$ larger than 1. For the singularity at $z=2$, we need $|z|$ smaller than 2.","answer":"In the annulus $1 < |z| < 2$, the pole at $z=1$ is inside our region, so we expand $\\frac{1}{z-1}$ using the geometric series for $|z| > |1|$. The pole at $z=2$ is outside, so we expand $\\frac{1}{z-2}$ using the geometric series for $|z| < |2|$. Different regions, different series forms."},{"prompt":"Step 2: The principal part is $\\sum_{n=1}^\\infty \\frac{-1}{z^n}$. How many poles (and of what order) does this indicate at $z=0$?","hint":"Count the highest negative power in the principal part. If there are finitely many terms with $z^{-n}$ for $n \\geq 1$, that's a pole.","answer":"One negative power: $z^{-1}$. This indicates a **simple pole** (pole of order 1) at $z=1$ (the center of expansion). The residue $a_{-1} = -1$ is what we extract for the residue theorem."},{"prompt":"Step 3: If we instead expanded in the annulus $|z| > 2$, both singularities would appear as negative powers. Would the pole at $z=2$ have order 1 or higher?","hint":"Apply partial fractions again: the $\\frac{2}{z-2}$ term would appear as $\\frac{2}{z(1-2/z)}$ for $|z|>2$. Expand to find how many negative powers appear.","answer":"Expanding for $|z|>2$: $\\frac{2}{z-2} = \\frac{2}{z}\\cdot\\frac{1}{1-2/z} = \\frac{2}{z}\\sum \\frac{2^n}{z^n} = \\sum \\frac{2^{n+1}}{z^{n+1}}$. Only one negative power ($z^{-1}$ from the leading term), so it's also a **simple pole** with residue $+2$."}],"caption":"Key insight: The principal part structure (negative powers) instantly tells you the singularity type and residue without further calculation."}
```
