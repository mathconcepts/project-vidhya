---
# for_stance: assured — trusts the mechanics, spends its budget on the one distinction that costs marks: alpha and beta are not interchangeable.
id: ode-second-order-homo.hook.assured
concept_id: ode-second-order-homo
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-second-order-homo.hook
for_stance: assured
---

Complex roots $\alpha\pm i\beta$ don't just decorate the solution with trig functions — the two parts of the root are not interchangeable. $\alpha$ (the real part) is the only number controlling growth or decay: $e^{\alpha t}$. $\beta$ (the imaginary part) is the only number controlling oscillation speed: $\cos(\beta t)$, $\sin(\beta t)$. Swap them — write $e^{\beta t}\cos(\alpha t)$ — and the physics is wrong even though the algebra looks similar: a system with $\alpha<0$, $\beta$ large would render as slow decay with fast oscillation, when the true solution decays fast and oscillates slowly. Read $\alpha$ and $\beta$ off the SAME root before assigning either role.

```interactive-spec
{
  "v": 1,
  "kind": "simulation",
  "title": "Released spring: y'' + 4y' + 13y = 0",
  "x_expr": "t",
  "y_expr": "exp(-2*t)*sin(3*t)",
  "t_min": 0,
  "t_max": 4,
  "duration_sec": 5,
  "view_box": {"x_min": -0.2, "x_max": 4.2, "y_min": -0.4, "y_max": 0.4},
  "caption": "y = e^(-2t) sin(3t): released at rest, given velocity 3, then left alone.",
  "narration_steps": [
    {"at_progress": 0.1, "text": "Released at zero displacement with velocity 3 — nothing pushes on it after this instant."},
    {"at_progress": 0.5, "text": "The curve keeps the sin(3t) rhythm while e^(-2t) squeezes its height toward zero.", "emphasize": true},
    {"at_progress": 0.85, "text": "By t = 4 the swing has almost vanished — the shrink rate and the swing rate came from two different parts of one root.", "trap": {"text": "students read the -2 in the exponent as the swing's speed and the 3 inside sin(3t) as a separate decay factor", "avoid": "the correct check: for a root alpha ± i beta, alpha sets how fast the envelope e^(alpha t) shrinks and beta sets how fast sin/cos(beta t) oscillates — both numbers come off the SAME root, not two unrelated quantities"}}
  ]
}
```
