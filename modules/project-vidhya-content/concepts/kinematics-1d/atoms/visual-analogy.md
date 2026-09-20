---
id: kinematics-1d.visual-analogy
concept_id: kinematics-1d
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

A cyclist pedals up a straight ramp and lets go — no more pushing, only gravity acting straight down the slope, slowing the cyclist at a steady rate. The cyclist rises, slows, stops for an instant, then rolls back down, speeding up the whole way — the exact same pattern as a ball thrown straight up, just relabelled onto a ramp instead of the vertical direction. Whenever a net *constant* force opposes the initial motion, this rise-stop-return shape appears, whatever the real setting.

The velocity-time graph for this motion is one straight line: it starts positive (moving up the ramp), crosses zero exactly at the turnaround instant, and continues into negative territory (moving down the ramp) at a constant slope — that slope *is* the acceleration, unchanging throughout, whether the cyclist is going up or coming back down. The diagram on this card traces that line for the same numbers as the ball example: $u=20$ m/s, deceleration $10$ m/s$^2$, turning around at $t=2$ s.

```gif-scene
{
  "type": "function-trace",
  "title": "Velocity vs time, constant deceleration then reversal",
  "expression": "20 - 10*x",
  "x_range": [0, 4],
  "y_range": [-25, 25],
  "frames": 30,
  "fps": 12
}
```

