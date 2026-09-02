---
id: ode-second-order-nonhomo.hook
concept_id: ode-second-order-nonhomo
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Push a swing at exactly its natural rhythm and each push adds energy in sync with the last — the swing doesn't settle into a steady arc, it grows without bound. That's resonance, and it shows up algebraically the moment the forcing term $f(x)$ in $ay''+by'+cy=f(x)$ happens to already be a homogeneous solution: the ordinary polynomial trial fails silently, solving a slightly wrong equation, unless it's multiplied by $x$ first. A non-homogeneous ODE's full answer is always the calm homogeneous background plus this one forced response — and the response's shape depends entirely on whether $f(x)$ collides with that background.

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
