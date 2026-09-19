---
id: chemical-kinetics.visual-analogy
concept_id: chemical-kinetics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

Picture a large crowd leaving a stadium through one gate, where exactly $10\%$ of whoever is STILL inside leaves every minute — not a fixed number of people, a fixed FRACTION of however many remain. The first minute empties far more people (10% of a full stadium) than the tenth minute does (10% of a much smaller remaining crowd) — the crowd thins out fastest at the start and slows down, without ever fully stopping in a finite time.

This is exactly the shape of **first-order kinetics**: the rate of disappearance depends on how much reactant is still there, so the SAME fraction leaves in each successive time interval, and the concentration keeps halving in a fixed time — a **half-life** — no matter how much or how little remains. The diagram on this card traces exactly this decay: concentration falling fastest early on, and flattening out as it gets closer to zero, without a single straight line anywhere in the curve.

```gif-scene
{"type":"function-trace","expression":"exp(-0.693*x)","x_range":[0,6],"y_range":[0,1.05],"frames":30,"fps":12,"title":"First-order decay: [A]/[A]0 = e^(-kt), t in half-lives"}
```
