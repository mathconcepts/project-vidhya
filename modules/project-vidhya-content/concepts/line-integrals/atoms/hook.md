---
id: line-integrals.hook
concept_id: line-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Drag a crate across a floor with a constant push, and physics hands you one formula: work equals force times distance in the direction of the drag. Curve the path instead of dragging straight, or let the push itself change direction and strength from point to point — as a real force field would — and that one formula stops applying outright.

What replaces it is a **line integral**: chop the curved path into tiny straight pieces, multiply force by displacement on each piece, and add every piece up. Before formalizing that sum, predict: does the total work depend on exactly which path connects two fixed endpoints, or only on where the endpoints are?

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Watching the loop close while the work total keeps climbing is the fastest way to see why a closed path can still do nonzero work — a fact that's easy to state and hard to believe from algebra alone.", "title": "A closed loop that still does work", "x_expr": "cos(t)", "y_expr": "sin(t)", "t_min": 0, "t_max": 6.283, "duration_sec": 8, "narration_steps": [{"at_progress": 0, "text": "The path is the unit circle, traced once counter-clockwise. The force field pushes tangentially — always in the direction you're already moving.", "text_shaken": "Watch a dot trace a full circle. At every point, the push points the same way the dot is already moving.", "text_assured": "$\\mathbf F(x,y)=(-y,x)$: tangential to every circle centered at the origin, magnitude equal to the radius.", "emphasize": false}, {"at_progress": 0.3, "text": "Since the push always matches the direction of travel, every step of the path adds positive work — none of it cancels.", "text_shaken": "The push always matches the direction the dot is moving, so work keeps adding up — nothing ever cancels.", "text_assured": "$\\mathbf F\\cdot\\mathbf r'=\\sin^2t+\\cos^2t=1$ at every instant — a constant integrand, not a coincidence of this particular field.", "emphasize": true}, {"at_progress": 0.75, "text": "The dot is closing in on where it started.", "text_shaken": "The dot is almost back to its starting point.", "text_assured": "As $t\\to2\\pi$, $\\mathbf r(t)\\to\\mathbf r(0)$ — the endpoint condition every conservative-field shortcut relies on.", "emphasize": false, "trap": {"text": "Students assume a path that returns to its start must do zero net work, the way going nowhere seems to accomplish nothing.", "avoid": "Check whether the field is conservative FIRST. Here it isn't — the loop closes, but the accumulated work is $2\\pi$, not $0$."}}, {"at_progress": 1, "text": "Back at the start — and the total work is $2\\pi$, not $0$. A closed loop only guarantees zero work when the field is conservative; this one isn't.", "text_shaken": "Back where it began — but the work is $2\\pi$, not $0$. Returning to the start does not mean nothing happened.", "text_assured": "$\\oint\\mathbf F\\cdot d\\mathbf r=2\\pi\\neq0$ — the signature of a non-conservative field; Green's theorem later ties this directly to $\\text{curl}\\,\\mathbf F$.", "emphasize": true}]}
```
