---
id: limits-jee.worked-example-shaken
concept_id: limits-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
variant_of: limits-jee.worked-example
for_stance: shaken
---

**Problem.** Evaluate $\displaystyle\lim_{x\to0}\frac{e^{2x}-1}{\sin 3x}$.

---

**Step 1 — Substitute $x=0$ and read off the form.**

Numerator: $e^{0}-1=1-1=0$. Denominator: $\sin 0=0$. Both are $0$, so this is $\frac{0}{0}$. Write that down before doing anything else — direct substitution cannot answer this.

---

**Step 2 — Match each piece to a standard limit.**

$\dfrac{e^{2x}-1}{2x}\to1$ and $\dfrac{\sin 3x}{3x}\to1$ as $x\to0$. Multiply and divide by $2x$ on top and $3x$ on the bottom to expose exactly these two shapes:

$$
\frac{e^{2x}-1}{\sin 3x}=\left(\frac{e^{2x}-1}{2x}\right)\cdot\left(\frac{3x}{\sin 3x}\right)\cdot\frac{2}{3}
$$

---

**Step 3 — Take the limit of each factor separately.**

$\left(\dfrac{e^{2x}-1}{2x}\right)\to1$, $\left(\dfrac{3x}{\sin 3x}\right)\to1$, leaving only $\dfrac{2}{3}$.

$$
\boxed{\lim_{x\to0}\frac{e^{2x}-1}{\sin 3x}=\frac{2}{3}}
$$

---

**Check it yourself.** At $x=0.01$: $e^{0.02}-1=0.020201$, $\sin(0.03)=0.029996$. Divide: $0.020201\div0.029996=0.6735$. Compare to $\frac23=0.6667$ — close, confirming the answer.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Walk through: lim (e^(2x)-1)/sin(3x) as x approaches 0", "steps": [{"prompt": "Substitute x = 0 directly. What form do you get?", "hint": "Compute the numerator and denominator separately at x = 0: e^0 - 1 and sin(0).", "answer": "0/0, indeterminate. Direct substitution cannot answer this -- a different method is needed."}, {"prompt": "Before reaching for L'Hopital's rule, do you know a standard limit that matches this shape?", "hint": "Recall: as x approaches 0, (e^(ax)-1)/x approaches a, and sin(bx)/x approaches b, for any constants a and b.", "answer": "Yes -- split the fraction so the numerator looks like (e^(2x)-1)/(2x) times 2x, and the denominator looks like sin(3x)/(3x) times 3x."}, {"prompt": "Rewrite the limit using those two standard forms. What do you get?", "hint": "[(e^(2x)-1)/(2x)] times 2, all divided by [sin(3x)/(3x)] times 3, as x approaches 0.", "answer": "Both bracketed pieces approach 1, leaving 2/3. No derivative was needed."}, {"prompt": "Apply L'Hopital's rule instead, as a check. What do you get?", "hint": "Differentiate numerator and denominator separately: d/dx(e^(2x)-1) = 2e^(2x); d/dx(sin(3x)) = 3cos(3x).", "answer": "2e^(2x)/(3cos(3x)) at x = 0 gives 2(1)/(3(1)) = 2/3 -- the same answer, confirming it, but with two derivatives computed instead of one recognised pattern."}]}
```
