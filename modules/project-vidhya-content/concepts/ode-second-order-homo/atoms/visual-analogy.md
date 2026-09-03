---
id: ode-second-order-homo.visual-analogy
concept_id: ode-second-order-homo
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

## Three Ways a Released Spring Can Settle

A mass on a spring, pulled and let go with no further push, is governed by exactly $ay''+by'+cy=0$ — the damping coefficient $b$ decides which of three shapes the settling motion takes. Weak damping (complex roots) lets it overshoot and ring, like the hook's guitar string. Strong damping (distinct real roots) creeps back without ever crossing zero. The boundary between them — repeated real roots — is called **critical damping**: the fastest possible return with no overshoot at all, which is why real shock absorbers are tuned to sit exactly there.

The curve on this card is that boundary case: $(1+2x)e^{-3x}$, the repeated-root solution from the micro-exercise, released at $y=1$ with velocity $-1$.

```gif-scene
{"type": "function-trace", "expression": "(1+2*x)*exp(-3*x)", "x_range": [0, 3], "y_range": [-0.1, 1.2]}
```
