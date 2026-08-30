---
# Alternative body for conformal-mapping.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: conformal-mapping.worked-example.shaken
concept_id: conformal-mapping
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: conformal-mapping.worked-example
for_stance: shaken
---

**Problem:** show $f(z)=z+1/z$ is conformal except at $z=0,\pm1$.

**Step 1 — check analyticity.** $z$ is entire; $1/z$ is analytic except at $z=0$ (a pole there). So $f$ is analytic on $\mathbb C\setminus\{0\}$ — one point excluded already.

**Step 2 — differentiate.** $f'(z)=1-\dfrac1{z^2}$.

**Step 3 — solve $f'(z)=0$.** $1-\dfrac1{z^2}=0\Rightarrow z^2=1\Rightarrow z=\pm1$: two more points where conformality fails, even though $f$ is analytic right there.

**Step 4 — combine.** Excluded: $z=0$ (not analytic), $z=\pm1$ ($f'=0$). Everywhere else both conditions hold, so $f$ is conformal on $\mathbb C\setminus\{0,1,-1\}$.

**Check** with a number: at $z=2$, $f'(2)=1-\frac14=\frac34\neq0$ — conformal there, consistent with the claim.

Two separate checks, and both can fail independently — that's the whole method.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Joukowski conformal condition","steps":[{"prompt":"Step 1: Is $f(z) = z + 1/z$ analytic on $\\mathbb{C}$?","hint":"What singularities does $1/z$ have?","answer":"No. $f$ has a pole at $z=0$, so it is analytic on $\\mathbb{C} \\setminus \\{0\\}$."},{"prompt":"Step 2: Compute $f'(z)$.","hint":"Differentiate term-by-term. Recall $(z^{-1})' = -z^{-2}$.","answer":"$f'(z) = 1 - 1/z^2$."},{"prompt":"Step 3: Solve $f'(z) = 0$ for critical points.","hint":"Set $1 - 1/z^2 = 0$, multiply by $z^2$, and solve.","answer":"$z^2 = 1$, so $z = 1$ or $z = -1$ are the critical points."},{"prompt":"Step 4: Where is $f$ conformal?","hint":"Conformal = analytic AND $f'(z) \\neq 0$. Exclude the pole and critical points.","answer":"$f$ is conformal on $\\mathbb{C} \\setminus \\{0, 1, -1\\}$."}],"caption":"At a critical point, the conformal property breaks: angles collapse."}
```
