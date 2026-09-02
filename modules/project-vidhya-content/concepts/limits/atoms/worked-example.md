---
id: limits.worked_example
concept_id: limits
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Evaluate $\displaystyle\lim_{x\to 0}\frac{1-\cos x}{x^2}$.

---

**Step 1 — Check the form.**

At $x=0$: $\dfrac{1-\cos 0}{0^2}=\dfrac{1-1}{0}=\dfrac{0}{0}$ — indeterminate. There is no common algebraic factor to cancel here, so L'Hôpital's rule is the right tool, not factoring.

---

**Step 2 — Apply L'Hôpital once.**

$$
\lim_{x\to 0}\frac{1-\cos x}{x^2} = \lim_{x\to 0}\frac{\sin x}{2x}
$$

Check the form again before declaring an answer: at $x=0$ this is $\dfrac{\sin 0}{2\cdot 0}=\dfrac{0}{0}$ — **still indeterminate**. Stopping here and reading off "$\frac{0}{0}=0$" is the single most common mistake on this problem.

---

**Step 3 — Apply L'Hôpital a second time.**

$$
\lim_{x\to 0}\frac{\sin x}{2x} = \lim_{x\to 0}\frac{\cos x}{2} = \frac{\cos 0}{2}
$$

$$
\boxed{\lim_{x\to 0}\frac{1-\cos x}{x^2}=\frac12}
$$

---

**Sanity check.** At $x=0.1$: $\dfrac{1-\cos(0.1)}{(0.1)^2}\approx\dfrac{0.004996}{0.01}\approx0.4996$ — already close to $0.5$, confirming the algebra.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: lim (1 - cos x)/x^2 as x approaches 0","steps":[{"prompt":"Substitute x = 0 directly. What form do you get, and can you factor anything?","hint":"Compute the numerator and denominator separately at x = 0.","answer":"0/0, indeterminate — and there is no common factor between 1 - cos x and x^2 to cancel, so factoring will not work here."},{"prompt":"Apply L'Hopital once: differentiate numerator and denominator. What do you get, and is it resolved yet?","hint":"d/dx(1 - cos x) = sin x; d/dx(x^2) = 2x. Check the new form at x = 0.","answer":"sin(x)/(2x), which is STILL 0/0 at x = 0 — not resolved. A second application is needed."},{"prompt":"Apply L'Hopital again and evaluate at x = 0. What is the limit?","hint":"d/dx(sin x) = cos x; d/dx(2x) = 2.","answer":"cos(x)/2 to cos(0)/2 = \\boxed{1/2}."}]}
```
