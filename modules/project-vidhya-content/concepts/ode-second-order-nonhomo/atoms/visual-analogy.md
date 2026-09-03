---
id: ode-second-order-nonhomo.visual-analogy
concept_id: ode-second-order-nonhomo
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

## The Radio-Tuning Picture

Think of $y_h$ and $y_p$ as two signals riding on the same wire. $y_h$ is whatever the system was doing on its own before anyone forced it — if the system is damped (its roots have negative real part), that signal fades out, the way static fades once a station locks in. $y_p$ is the forced response, driven entirely by $f(x)$, and it never fades: as long as the push continues, the response continues.

For $y''+2y'+5y=10\cos t$, the homogeneous roots are $-1\pm2i$ — decaying and oscillatory — so $y_h=e^{-t}(C_1\cos2t+C_2\sin2t)$ dies out, while $y_p=2\cos t+\sin t$ persists forever at the forcing frequency. The curve on this card shows an early wobble from $y_h$ settling into a clean, unchanging oscillation — the **steady state** — once the transient has burned off.

```gif-scene
{"type": "function-trace", "expression": "exp(-x)*cos(2*x) + 2*cos(x) + sin(x)", "x_range": [0, 10], "y_range": [-2.5, 3.5]}
```
