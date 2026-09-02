---
id: ode-higher-order.visual-analogy
concept_id: ode-higher-order
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

## A Polynomial Riding an Exponential

A repeated root doesn't just repeat the same curve — it multiplies in a polynomial passenger. $(C_1+C_2x+C_3x^2)e^{rx}$ is an exponential envelope $e^{rx}$ carrying a degree-$2$ polynomial along for the ride; for $r>0$ the polynomial briefly matters near the origin, but the exponential factor eventually wins by so much that the whole curve still looks purely exponential from far enough away — the polynomial only reshapes the near term.

Below is $(1+x+x^2)e^{x}$, the triple-root solution with $C_1=C_2=C_3=1$: notice it's not a straight exponential curve near $x=0$, where the polynomial passenger still has a say.

```gif-scene
{"type": "function-trace", "expression": "(1+x+x**2)*exp(x)", "x_range": [0, 2], "y_range": [0, 55]}
```
