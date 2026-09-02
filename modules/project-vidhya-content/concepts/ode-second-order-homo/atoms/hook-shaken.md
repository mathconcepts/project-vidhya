---
# for_stance: shaken — concrete numbers first, smallest true first step, full arithmetic, explicit check, no reassurance language.
id: ode-second-order-homo.hook.shaken
concept_id: ode-second-order-homo
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-second-order-homo.hook
for_stance: shaken
---

A system starts at rest, $y(0)=0$, with velocity $y'(0)=3$, obeying $y''+4y'+13y=0$. First step: write the characteristic equation $r^2+4r+13=0$ and solve it — roots $-2\pm 3i$. Real part $-2$ sets how fast the envelope shrinks; imaginary part $3$ sets how fast it swings. Combine both: $y=e^{-2t}(C_1\cos 3t+C_2\sin 3t)$. Apply the two conditions to pin down $C_1$ and $C_2$. Check: differentiate the result twice and confirm it satisfies the equation.

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
