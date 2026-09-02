---
id: ode-higher-order.hook
concept_id: ode-higher-order
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Three exponential racers leave the starting line together: $e^{x}$, $e^{2x}$, and $e^{3x}$, all at height $1$ when $x=0$. Add them up and for a while all three matter — but past a certain point only the fastest one is still visible on the graph; the slower two shrink to rounding error beside it. A higher-order homogeneous linear ODE with several distinct real roots behaves exactly like this: the largest root eventually dominates every solution in its family, no matter what the other constants were.

```interactive-spec
{
  "v": 1,
  "kind": "simulation",
  "title": "Three racers: y = e^t + e^2t + e^3t",
  "x_expr": "t",
  "y_expr": "exp(t)+exp(2*t)+exp(3*t)",
  "t_min": 0,
  "t_max": 1.3,
  "duration_sec": 5,
  "view_box": {"x_min": -0.1, "x_max": 1.4, "y_min": -2, "y_max": 60},
  "caption": "y = e^t + e^2t + e^3t solves y''' - 6y'' + 11y' - 6y = 0.",
  "narration_steps": [
    {"at_progress": 0.1, "text": "All three terms start together at height 1 when t = 0."},
    {"at_progress": 0.5, "text": "By the middle of the window the e^(3t) term already outweighs the other two combined.", "emphasize": true},
    {"at_progress": 0.9, "text": "Near the end, the curve is basically just e^(3t) — the other two roots have become invisible.", "trap": {"text": "students read the dominant curve at large t and conclude its constant must be the largest of the three", "avoid": "the correct check: which root dominates depends only on the root's own SIZE (3 > 2 > 1 here), never on the size of the constant multiplying it — even a tiny constant on the fastest root eventually wins"}}
  ]
}
```
