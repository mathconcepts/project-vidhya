---
# Alternative body for taylor-laurent.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: taylor-laurent.worked-example.shaken
concept_id: taylor-laurent
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: taylor-laurent.worked-example
for_stance: shaken
---

**Problem:** Laurent-expand $f(z)=\dfrac{z}{(z-1)(z-2)}$ for $1<|z|<2$; classify.

**Step 1 — partial fractions.** $\dfrac{z}{(z-1)(z-2)}=\dfrac{A}{z-1}+\dfrac{B}{z-2}$. Clear denominators: $z=A(z-2)+B(z-1)$. Set $z=1$: $1=-A\Rightarrow A=-1$. Set $z=2$: $2=B\Rightarrow B=2$. So $f(z)=\dfrac{-1}{z-1}+\dfrac2{z-2}$.

**Step 2 — expand each term for this annulus.** Since $|z|>1$: $\dfrac{-1}{z-1}=\dfrac{-1}z\cdot\dfrac1{1-1/z}=\sum_{n=1}^\infty\dfrac{-1}{z^n}$ — all negative powers. Since $|z|<2$: $\dfrac2{z-2}=-\sum_{n=0}^\infty\dfrac{z^n}{2^n}$ — all non-negative powers.

**Step 3 — combine.** $f(z)=\sum_{n=1}^\infty\dfrac{-1}{z^n}-\sum_{n=0}^\infty\dfrac{z^n}{2^n}$.

**Step 4 — classify.** The principal part has exactly one negative power, $-1/z$: a **simple pole at $z=1$**, residue $a_{-1}=-1$. $z=2$ doesn't appear here — it's outside this annulus; expanding for $|z|>2$ would show it as a simple pole with residue $+2$.

Which powers show up depends on the annulus; the pole's *order* doesn't — it's the same fact read from the series centered at that pole.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Laurent expansion in annulus","steps":[{"prompt":"Step 1: Why do we expand $\\frac{-1}{z-1}$ using $|z|>1$ but $\\frac{2}{z-2}$ using $|z|<2$?","hint":"The annulus is $1 < |z| < 2$. For the singularity at $z=1$, we need $|z|$ larger than 1. For the singularity at $z=2$, we need $|z|$ smaller than 2.","answer":"In the annulus $1 < |z| < 2$, the pole at $z=1$ is inside our region, so we expand $\\frac{1}{z-1}$ using the geometric series for $|z| > |1|$. The pole at $z=2$ is outside, so we expand $\\frac{1}{z-2}$ using the geometric series for $|z| < |2|$. Different regions, different series forms."},{"prompt":"Step 2: The principal part is $\\sum_{n=1}^\\infty \\frac{-1}{z^n}$. How many poles (and of what order) does this indicate at $z=0$?","hint":"Count the highest negative power in the principal part. If there are finitely many terms with $z^{-n}$ for $n \\geq 1$, that's a pole.","answer":"One negative power: $z^{-1}$. This indicates a **simple pole** (pole of order 1) at $z=1$ (the center of expansion). The residue $a_{-1} = -1$ is what we extract for the residue theorem."},{"prompt":"Step 3: If we instead expanded in the annulus $|z| > 2$, both singularities would appear as negative powers. Would the pole at $z=2$ have order 1 or higher?","hint":"Apply partial fractions again: the $\\frac{2}{z-2}$ term would appear as $\\frac{2}{z(1-2/z)}$ for $|z|>2$. Expand to find how many negative powers appear.","answer":"Expanding for $|z|>2$: $\\frac{2}{z-2} = \\frac{2}{z}\\cdot\\frac{1}{1-2/z} = \\frac{2}{z}\\sum \\frac{2^n}{z^n} = \\sum \\frac{2^{n+1}}{z^{n+1}}$. Only one negative power ($z^{-1}$ from the leading term), so it's also a **simple pole** with residue $+2$."}],"caption":"Key insight: The principal part structure (negative powers) instantly tells you the singularity type and residue without further calculation."}
```
