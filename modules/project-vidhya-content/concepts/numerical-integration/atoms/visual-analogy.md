---
id: numerical-integration.visual-analogy
concept_id: numerical-integration
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Picture measuring a curved plot of land using stakes and string, no calculus. Drive stakes at equally spaced points and join adjacent stakes with straight fence segments — the enclosed area is a chain of trapezoids, cutting corners off convex bulges and adding extra area over concave dips. That undershoot-or-overshoot pattern is the trapezoidal rule's $O(h^2)$ error.

```gif-scene
{"type": "function-trace", "expression": "1 / (1 + x*x)", "x_range": [0, 4], "y_range": [0, 1.2]}
```

Now replace every pair of straight fences with a single parabolic arch spanning three stakes at a time. For $f(x)=1/(1+x^2)$ on $[0,4]$ — the curve shown, area $=\arctan4\approx1.3258$ — the arches hug the bell-shaped hump near $x=0$ far more closely than any straight line could, which is exactly why Simpson's rule cuts the error to $O(h^4)$ using the same number of stakes.
