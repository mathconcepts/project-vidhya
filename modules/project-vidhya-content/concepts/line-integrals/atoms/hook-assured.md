---
# Alternative body for line-integrals.hook, served when the learner stance
# is `assured`.
id: line-integrals.hook.assured
concept_id: line-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: line-integrals.hook
for_stance: assured
---

Two different integrals share the name "line integral," and confusing them is the costliest slip here. The **scalar** line integral $\int_C f\,ds$ weights by arc length — unchanged if the curve's direction reverses, since $ds>0$ regardless of travel direction. The **vector** line integral $\int_C \mathbf F\cdot d\mathbf r$ weights by displacement — and reversing the curve's direction flips its sign outright, because $d\mathbf r$ itself reverses.

A question naming "the line integral" on a reversed-orientation curve is testing exactly this: only one of the two kinds changes sign, and it is never the one carrying plain arc length.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Watching the loop close while the work total keeps climbing is the fastest way to see why a closed path can still do nonzero work — a fact that's easy to state and hard to believe from algebra alone.", "title": "A closed loop that still does work", "x_expr": "cos(t)", "y_expr": "sin(t)", "t_min": 0, "t_max": 6.283, "duration_sec": 8, "narration_steps": [{"at_progress": 0, "text": "The path is the unit circle, traced once counter-clockwise. The force field pushes tangentially — always in the direction you're already moving.", "text_shaken": "Watch a dot trace a full circle. At every point, the push points the same way the dot is already moving.", "text_assured": "$\\mathbf F(x,y)=(-y,x)$: tangential to every circle centered at the origin, magnitude equal to the radius.", "emphasize": false}, {"at_progress": 0.3, "text": "Since the push always matches the direction of travel, every step of the path adds positive work — none of it cancels.", "text_shaken": "The push always matches the direction the dot is moving, so work keeps adding up — nothing ever cancels.", "text_assured": "$\\mathbf F\\cdot\\mathbf r'=\\sin^2t+\\cos^2t=1$ at every instant — a constant integrand, not a coincidence of this particular field.", "emphasize": true}, {"at_progress": 0.75, "text": "The dot is closing in on where it started.", "text_shaken": "The dot is almost back to its starting point.", "text_assured": "As $t\\to2\\pi$, $\\mathbf r(t)\\to\\mathbf r(0)$ — the endpoint condition every conservative-field shortcut relies on.", "emphasize": false, "trap": {"text": "Students assume a path that returns to its start must do zero net work, the way going nowhere seems to accomplish nothing.", "avoid": "Check whether the field is conservative FIRST. Here it isn't — the loop closes, but the accumulated work is $2\\pi$, not $0$."}}, {"at_progress": 1, "text": "Back at the start — and the total work is $2\\pi$, not $0$. A closed loop only guarantees zero work when the field is conservative; this one isn't.", "text_shaken": "Back where it began — but the work is $2\\pi$, not $0$. Returning to the start does not mean nothing happened.", "text_assured": "$\\oint\\mathbf F\\cdot d\\mathbf r=2\\pi\\neq0$ — the signature of a non-conservative field; Green's theorem later ties this directly to $\\text{curl}\\,\\mathbf F$.", "emphasize": true}]}
```
