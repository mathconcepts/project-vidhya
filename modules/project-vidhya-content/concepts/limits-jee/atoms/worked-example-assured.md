---
id: limits-jee.worked-example-assured
concept_id: limits-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
variant_of: limits-jee.worked-example
for_stance: assured
---

**Problem.** Evaluate $\displaystyle\lim_{x\to0}\frac{e^{2x}-1}{\sin 3x}$.

---

$\frac{0}{0}$ at $x=0$ — but do not reach for L'Hôpital's rule by reflex. Both pieces already match a standard limit: $\dfrac{e^{2x}-1}{2x}\to1$, $\dfrac{\sin 3x}{3x}\to1$. Multiply and divide to expose them:

$$
\frac{e^{2x}-1}{\sin 3x}=\left(\frac{e^{2x}-1}{2x}\right)\left(\frac{3x}{\sin 3x}\right)\cdot\frac{2}{3}\;\longrightarrow\;1\cdot1\cdot\frac{2}{3}
$$

$$
\boxed{\lim_{x\to0}\frac{e^{2x}-1}{\sin 3x}=\frac{2}{3}}
$$

**The distinction that costs marks.** For a rational function of $x$ as $x\to\infty$, "match the highest powers" always suffices — that shortcut is safe. Here it is not: $\dfrac{e^{2x}-1}{\sin 3x}$ has no highest power to match, and the *coefficients inside* the exponential and the sine are exactly what the answer depends on. Swap the coefficients — say $\dfrac{e^{3x}-1}{\sin 2x}$ — and the limit flips to $\dfrac32$, not $\dfrac23$. Recognising the standard-limit shape is only safe once you have separately checked which constant sits with which function; mismatching them, or assuming the ratio is always (denominator's coefficient)/(numerator's coefficient) without deriving it, is the fast method's own trap.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Walk through: lim (e^(2x)-1)/sin(3x) as x approaches 0", "steps": [{"prompt": "Substitute x = 0 directly. What form do you get?", "hint": "Compute the numerator and denominator separately at x = 0: e^0 - 1 and sin(0).", "answer": "0/0, indeterminate. Direct substitution cannot answer this -- a different method is needed."}, {"prompt": "Before reaching for L'Hopital's rule, do you know a standard limit that matches this shape?", "hint": "Recall: as x approaches 0, (e^(ax)-1)/x approaches a, and sin(bx)/x approaches b, for any constants a and b.", "answer": "Yes -- split the fraction so the numerator looks like (e^(2x)-1)/(2x) times 2x, and the denominator looks like sin(3x)/(3x) times 3x."}, {"prompt": "Rewrite the limit using those two standard forms. What do you get?", "hint": "[(e^(2x)-1)/(2x)] times 2, all divided by [sin(3x)/(3x)] times 3, as x approaches 0.", "answer": "Both bracketed pieces approach 1, leaving 2/3. No derivative was needed."}, {"prompt": "Apply L'Hopital's rule instead, as a check. What do you get?", "hint": "Differentiate numerator and denominator separately: d/dx(e^(2x)-1) = 2e^(2x); d/dx(sin(3x)) = 3cos(3x).", "answer": "2e^(2x)/(3cos(3x)) at x = 0 gives 2(1)/(3(1)) = 2/3 -- the same answer, confirming it, but with two derivatives computed instead of one recognised pattern."}]}
```
