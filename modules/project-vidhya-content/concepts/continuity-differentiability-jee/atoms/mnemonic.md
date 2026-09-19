---
id: continuity-differentiability-jee.mnemonic
concept_id: continuity-differentiability-jee
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Power the bracket, drop the power, times what's inside's own slope."** For $y=(ax+b)^n$: bring the power $n$ down as a multiplier, reduce the power by one, and multiply by $a$ — the derivative of what is inside the bracket. That last multiplication is the entire chain rule, compressed into one phrase:

$$
\frac{d}{dx}(ax+b)^n = n(ax+b)^{n-1}\cdot a
$$

**Continuity vs differentiability, in one line:** "smooth implies unbroken, but unbroken does not imply smooth." Differentiable always drags continuity along with it; continuous carries no such guarantee back.

**Implicit differentiation, one reminder:** every term containing $y$ picks up a $\dfrac{dy}{dx}$ tag the instant you differentiate it — treat $y$ as "some function of $x$ whose name you don't know yet," never as a plain number.

```interactive-spec
{"v": 1, "kind": "manipulable", "title": "Drag a, b, n -- watch the chain rule rebuild the derivative of (ax+b)^n", "why": "d/dx[(ax+b)^n] = n*a*(ax+b)^(n-1) is the chain rule's own pattern -- drag a, b, n and watch the derivative rebuild at x=1 every time, not only for one memorised example.", "inputs": [{"id": "a", "label": "a (slope inside the bracket)", "min": 0.5, "max": 3, "step": 0.5, "initial": 2}, {"id": "b", "label": "b (constant inside the bracket)", "min": -2, "max": 2, "step": 0.5, "initial": 1}, {"id": "n", "label": "n (the power)", "min": 1, "max": 4, "step": 1, "initial": 3}], "outputs": [{"label": "inner value at x=1: a(1)+b", "formula": "a+b", "digits": 2}, {"label": "derivative at x=1: n*a*(a+b)^(n-1)", "formula": "n*a*(a+b)^(n-1)", "digits": 2}], "caption": "Start at a=2, b=1, n=3: inner value = 3, derivative = 3*2*3^2 = 54. Drag any slider and the derivative rebuilds from the SAME pattern -- outer power rule, times the inner slope -- every time."}
```
