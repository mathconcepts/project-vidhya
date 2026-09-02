---
# Alternative body for limits.worked_example, served when the learner
# stance is `shaken`. Same steps, concrete-first, explicit check.
id: limits.worked_example.shaken
concept_id: limits
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: limits.worked_example
for_stance: shaken
---

Same problem: $\lim_{x\to0}\dfrac{1-\cos x}{x^2}$. One step at a time.

**Step 1.** Plug in $x=0$: $\dfrac{1-\cos0}{0^2}=\dfrac{1-1}{0}=\dfrac00$. Indeterminate. No factor to cancel — use L'Hôpital.

**Step 2.** Differentiate top and bottom: $\dfrac{\sin x}{2x}$. Plug in $x=0$ again: $\dfrac{\sin 0}{0}=\dfrac00$. Still indeterminate — not finished yet.

**Step 3.** Differentiate again: $\dfrac{\cos x}{2}$. Plug in $x=0$: $\dfrac{\cos 0}{2}=\dfrac12$.

$$
\boxed{\lim_{x\to 0}\frac{1-\cos x}{x^2}=\frac12}
$$

**Check.** At $x=0.1$: $\dfrac{1-\cos(0.1)}{(0.1)^2}\approx\dfrac{0.004996}{0.01}\approx0.4996$ — matches.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: lim (1 - cos x)/x^2 as x approaches 0","steps":[{"prompt":"Substitute x = 0 directly. What form do you get, and can you factor anything?","hint":"Compute the numerator and denominator separately at x = 0.","answer":"0/0, indeterminate — and there is no common factor between 1 - cos x and x^2 to cancel, so factoring will not work here."},{"prompt":"Apply L'Hopital once: differentiate numerator and denominator. What do you get, and is it resolved yet?","hint":"d/dx(1 - cos x) = sin x; d/dx(x^2) = 2x. Check the new form at x = 0.","answer":"sin(x)/(2x), which is STILL 0/0 at x = 0 — not resolved. A second application is needed."},{"prompt":"Apply L'Hopital again and evaluate at x = 0. What is the limit?","hint":"d/dx(sin x) = cos x; d/dx(2x) = 2.","answer":"cos(x)/2 to cos(0)/2 = \\boxed{1/2}."}]}
```
