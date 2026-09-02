---
# for_stance: assured — the one distinction that costs marks: dominance is decided by the largest real part among ALL roots, including complex ones, not just the biggest real root.
id: ode-higher-order.hook.assured
concept_id: ode-higher-order
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-higher-order.hook
for_stance: assured
---

Dominance is decided by the largest real part among every root — real or complex, not by which root looks the most straightforward. A pair $\alpha\pm i\beta$ with $\alpha=4$ eventually beats a real root $r=3$, even though the complex pair also oscillates, because $e^{4x}$ outgrows $e^{3x}$ regardless of the $\cos(\beta x)$ or $\sin(\beta x)$ riding on top of it. A tempting-but-wrong shortcut is scanning only the real roots for "the biggest one" and treating complex roots as a separate, oscillation-only category — their real part competes in the exact same growth race as everything else.

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
