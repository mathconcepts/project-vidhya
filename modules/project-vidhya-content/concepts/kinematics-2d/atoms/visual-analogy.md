---
id: kinematics-2d.visual-analogy
concept_id: kinematics-2d
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

A gardener tilts a hose upward and water leaves the nozzle in a smooth curved stream, rising, arcing over, and falling back to the ground some distance away — whatever the tilt angle or the water pressure, the stream is always some parabola, never a straight line and never a perfect circle. That curved path is exactly a projectile's trajectory: horizontally the water drifts forward at a steady rate, while gravity constantly pulls each drop downward a little more the longer it has been in the air, and combining "steady drift" with "growing downward pull" is precisely what draws a parabola.

The diagram on this card traces that same shape using the worked example's own numbers — $u_x=16$ m/s, $u_y=12$ m/s — so the curve rises, peaks at $t=1.2$ s, and lands again at $t=2.4$ s, the time of flight found earlier.

```gif-scene
{
  "type": "parametric-curve",
  "title": "Projectile path traced over time",
  "x_expr": "16*t",
  "y_expr": "12*t - 5*t^2",
  "t_range": [0, 2.4],
  "x_range": [0, 40],
  "y_range": [0, 8],
  "frames": 30,
  "fps": 12
}
```

