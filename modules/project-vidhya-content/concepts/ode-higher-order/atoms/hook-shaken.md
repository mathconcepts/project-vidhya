---
# for_stance: shaken — concrete equation first, smallest true step (factor the auxiliary polynomial), full arithmetic, explicit check.
id: ode-higher-order.hook.shaken
concept_id: ode-higher-order
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-higher-order.hook
for_stance: shaken
---

$y'''-6y''+11y'-6y=0$. Start by writing down the auxiliary equation: $r^3-6r^2+11r-6=0$. Test $r=1$: $1-6+11-6=0$ — a root. Divide: $r^3-6r^2+11r-6=(r-1)(r^2-5r+6)=(r-1)(r-2)(r-3)$. Roots: $1,2,3$.

General solution: $y=C_1e^{x}+C_2e^{2x}+C_3e^{3x}$.

Check: at $r=2$, $8-24+22-6=0$; at $r=3$, $27-54+33-6=0$. Both confirm.

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
