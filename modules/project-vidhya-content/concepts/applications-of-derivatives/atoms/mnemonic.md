---
id: applications-of-derivatives.mnemonic
concept_id: applications-of-derivatives
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Hill curves down, valley curves up"** is the whole second derivative test in five words: at a critical point, $f''<0$ means the graph is bending like the top of a hill (a local maximum), and $f''>0$ means it is bending like the bottom of a valley (a local minimum). $f''=0$ means "can't tell from this alone" — go back to checking the sign of $f'$ directly.

**Normal is tangent, turned a quarter-circle.** If the tangent's slope is $m$, the normal's slope is $-\dfrac1m$ — never $m$ itself, and never just "$-m$."

**Rolle's is MVT with a zero on the right-hand side.** Same three conditions (continuous on $[a,b]$, differentiable on $(a,b)$), plus $f(a)=f(b)$ — which makes the guaranteed slope $\dfrac{f(b)-f(a)}{b-a}$ collapse to exactly $0$.

```interactive-spec
{"v": 1, "kind": "manipulable", "title": "Drag a -- watch the sign of f double-prime sort every critical point into max or min", "why": "For f(x) = x^3 - 3ax, the critical points sit at plus-or-minus the square root of a, no matter what a is -- drag a and watch the second derivative test call the same max/min pattern every time.", "inputs": [{"id": "a", "label": "a (spread of the two critical points)", "min": 0.5, "max": 4, "step": 0.5, "initial": 1}], "outputs": [{"label": "critical point (positive side) = sqrt(a)", "formula": "sqrt(a)", "digits": 2}, {"label": "f double-prime there = 6*sqrt(a)  -> positive -> LOCAL MIN", "formula": "6*sqrt(a)", "digits": 2}, {"label": "f double-prime at -sqrt(a) = -6*sqrt(a)  -> negative -> LOCAL MAX", "formula": "-6*sqrt(a)", "digits": 2}], "caption": "For f(x) = x^3 - 3ax, f prime(x) = 3x^2 - 3a = 0 gives x = plus-or-minus sqrt(a). f double-prime(x) = 6x, so the positive critical point always tests positive (a minimum) and the negative one always tests negative (a maximum) -- drag a and watch the pattern hold at every value."}
```
