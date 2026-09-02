---
id: root-finding.visual-analogy
concept_id: root-finding
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Picture searching a number line, blindfolded, for a hidden coin, with only a friend calling out "left" or "right." The optimal strategy is always guessing the midpoint of what's left — that is bisection: guess the midpoint $c$, ask whether $f$ changed sign on the left half or the right half, discard the half with no sign change. Uncertainty halves every guess, guaranteed but slow.

Now suppose the friend can also say *how steeply* the reading is changing. Instead of blindly halving, you extrapolate: "if the trend holds, the coin is about here" — that's Newton-Raphson, jumping straight to the tangent line's own zero. When the curve near the root is nearly straight, this leap lands almost exactly; when it curves sharply, a single jump can overshoot.

```gif-scene
{"type": "function-trace", "expression": "x**3 - x - 2", "x_range": [-2, 3], "y_range": [-5, 5]}
```

For $f(x)=x^3-x-2$ (root near $x\approx1.521$), Newton-Raphson from $x_0=2$ jumps to $x_1\approx1.636$, then $x_2\approx1.530$ — already within $0.01$ of the root in two jumps, where bisection starting from $[1,2]$ would still be narrowing its bracket step by step.
