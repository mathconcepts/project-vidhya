---
# for_stance: assured — the one distinction that costs marks: check the trial FAMILY against the homogeneous solutions, not the forcing term literally.
id: ode-second-order-nonhomo.hook.assured
concept_id: ode-second-order-nonhomo
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-second-order-nonhomo.hook
for_stance: assured
---

Resonance is a binary test, not a judgment call: does the trial family for $f(x)$ already appear among the homogeneous solutions? For $y''+y=\sin t$, the homogeneous solutions are $\cos t,\sin t$ — the same family the forcing term $\sin t$ belongs to — so the plain trial $A\cos t+B\sin t$ collapses under substitution (its $y_p''+y_p$ term cancels identically, leaving no way to match $\sin t$). Multiplying by $t$ once restores a nonzero left side without changing which frequency is forced. A tempting-but-wrong shortcut is checking only whether $f(x)$ itself, not its whole trial family, matches a root — $f(x)=t\sin t$ needs the SAME check against $\cos t,\sin t$, not against $t\sin t$ literally.

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
