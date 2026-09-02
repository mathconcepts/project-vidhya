---
# for_stance: shaken — concrete equation first, smallest true step (test the homogeneous match), full arithmetic, explicit check.
id: ode-second-order-nonhomo.hook.shaken
concept_id: ode-second-order-nonhomo
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-second-order-nonhomo.hook
for_stance: shaken
---

$y''+y=\sin t$. First step: check whether $\sin t$ already solves the homogeneous equation $y''+y=0$ — it does, since $r=\pm i$. That match means the plain trial $A\cos t+B\sin t$ cannot work; multiply by $t$: try $y_p=t(A\cos t+B\sin t)$. Substituting gives $y_p''+y_p=2(-A\sin t+B\cos t)$, so matching to $\sin t$ requires $-2A=1,\,2B=0$, giving $A=-\tfrac12,\,B=0$. Result: $y_p=-\tfrac{t}{2}\cos t$. Check: differentiate twice and confirm the coefficient of $\sin t$ comes out to exactly $1$, matching the right-hand side.

```interactive-spec
{
  "v": 1,
  "kind": "simulation",
  "title": "Resonant forcing: y'' + y = sin t",
  "x_expr": "t",
  "y_expr": "-(t/2)*cos(t)",
  "t_min": 0,
  "t_max": 10,
  "duration_sec": 6,
  "view_box": {"x_min": -0.3, "x_max": 10.3, "y_min": -5.5, "y_max": 5.5},
  "caption": "y_p = -(t/2) cos t solves y'' + y = sin t: the push matches the system's own frequency.",
  "narration_steps": [
    {"at_progress": 0.1, "text": "Forced at the system's own natural frequency — push and swing stay in step the whole time."},
    {"at_progress": 0.55, "text": "Each cycle adds a little more height: the envelope grows as t/2, not the flat amplitude an ordinary forced response would settle into.", "emphasize": true},
    {"at_progress": 0.85, "text": "The growth never levels off — this is what an unmatched forcing term's steady response is NOT allowed to do.", "trap": {"text": "students guess the particular solution as A cos t + B sin t straight from the forcing term's shape", "avoid": "the correct check: test whether the guessed form already solves the homogeneous equation first; if it does, the whole trial must be multiplied by t before solving for the coefficients"}}
  ]
}
```
