---
id: limits-jee.worked-example
concept_id: limits-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Evaluate $\displaystyle\lim_{x\to0}\frac{e^{2x}-1}{\sin 3x}$.

---

**Step 1 — Check the form before doing anything else.**

At $x=0$: numerator $= e^0-1=0$, denominator $=\sin 0=0$. This is $\frac{0}{0}$ — indeterminate, and direct substitution answers nothing.

---

**Step 2 — Recognise the shape instead of reaching for L'Hôpital's rule.**

Both pieces match a standard limit exactly: $\dfrac{e^{2x}-1}{2x}\to1$ and $\dfrac{\sin 3x}{3x}\to1$ as $x\to0$. Recognising this is faster than differentiating twice, and on JEE Main it is the difference between a 15-second answer and a 60-second one.

---

**Step 3 — Multiply and divide to expose those exact standard forms.**

$$
\frac{e^{2x}-1}{\sin 3x} = \frac{e^{2x}-1}{2x}\cdot\frac{1}{\dfrac{\sin 3x}{3x}}\cdot\frac{2x}{3x}
$$

As $x\to0$, the first bracket $\to1$ and the second bracket $\to1$, leaving only the constant ratio $\dfrac{2x}{3x}=\dfrac{2}{3}$.

$$
\boxed{\lim_{x\to0}\frac{e^{2x}-1}{\sin 3x}=\frac{2}{3}}
$$

---

**Sanity check.** At $x=0.01$: $\dfrac{e^{0.02}-1}{\sin(0.03)}\approx\dfrac{0.020201}{0.029996}\approx0.6735$ — already close to $\frac{2}{3}\approx0.6667$, confirming the algebra.

**Same answer, the slower way.** Apply L'Hôpital's rule directly on the original $\frac{0}{0}$ form: differentiate top and bottom to get $\dfrac{2e^{2x}}{3\cos 3x}$, which at $x=0$ gives $\dfrac{2}{3}$ — correct, but two derivatives were computed to reach what one recognised pattern gave in a line.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Walk through: lim (e^(2x)-1)/sin(3x) as x approaches 0", "steps": [{"prompt": "Substitute x = 0 directly. What form do you get?", "hint": "Compute the numerator and denominator separately at x = 0: e^0 - 1 and sin(0).", "answer": "0/0, indeterminate. Direct substitution cannot answer this -- a different method is needed."}, {"prompt": "Before reaching for L'Hopital's rule, do you know a standard limit that matches this shape?", "hint": "Recall: as x approaches 0, (e^(ax)-1)/x approaches a, and sin(bx)/x approaches b, for any constants a and b.", "answer": "Yes -- split the fraction so the numerator looks like (e^(2x)-1)/(2x) times 2x, and the denominator looks like sin(3x)/(3x) times 3x."}, {"prompt": "Rewrite the limit using those two standard forms. What do you get?", "hint": "[(e^(2x)-1)/(2x)] times 2, all divided by [sin(3x)/(3x)] times 3, as x approaches 0.", "answer": "Both bracketed pieces approach 1, leaving 2/3. No derivative was needed."}, {"prompt": "Apply L'Hopital's rule instead, as a check. What do you get?", "hint": "Differentiate numerator and denominator separately: d/dx(e^(2x)-1) = 2e^(2x); d/dx(sin(3x)) = 3cos(3x).", "answer": "2e^(2x)/(3cos(3x)) at x = 0 gives 2(1)/(3(1)) = 2/3 -- the same answer, confirming it, but with two derivatives computed instead of one recognised pattern."}]}
```
