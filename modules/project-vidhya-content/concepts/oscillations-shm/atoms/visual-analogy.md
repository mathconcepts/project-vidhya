---
id: oscillations-shm.visual-analogy
concept_id: oscillations-shm
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

A seismograph needle, tracing an earthquake's shaking onto a slowly unrolling paper strip, draws exactly the same shape a simple pendulum's height traces over time: a smooth wave, rising to a peak, falling through the middle, dipping to a trough, and rising again — over and over, at a fixed rhythm set entirely by the system itself, not by how hard it was first pushed.

The curve on this card unrolls the same way that paper strip would: the horizontal axis is time (in units of the oscillation's own angle, so one full hump-and-dip cycle covers $2\pi$), and the vertical axis is displacement, scaled so the peak is $1$ and the trough is $-1$. Watch where the curve is steepest — that is where the pendulum is moving fastest — and where it flattens out at the very top and bottom, where the pendulum briefly stops before swinging back.

```gif-scene
{"type":"parametric-curve","x_expr":"t","y_expr":"cos(t)","t_range":[0,12.566370614359172],"x_range":[0,12.566370614359172],"y_range":[-1.2,1.2],"frames":30,"fps":12,"title":"Displacement vs. time, unrolling like a seismograph strip"}
```
