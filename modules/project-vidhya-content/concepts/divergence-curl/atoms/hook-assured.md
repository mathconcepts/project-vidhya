---
# Alternative body for divergence-curl.hook, served when the learner stance
# is `assured`.
id: divergence-curl.hook.assured
concept_id: divergence-curl
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: divergence-curl.hook
for_stance: assured
---

Divergence and curl are **local, pointwise** numbers, built from partial derivatives at a point — not a visual read of how large the arrows look nearby in a plotted field. A field can carry huge arrow magnitudes everywhere and still have zero divergence (arrows all parallel, none spreading apart), or small arrows packed into a region of large divergence.

For $\mathbf F(x,y)=(x,y)$: arrow length keeps growing with distance from the origin, yet $\operatorname{div}\mathbf F=2$ is the same constant everywhere. Growing arrow magnitude is not what divergence measures — the rate of outward spreading per unit area is, and that rate can be perfectly uniform on a field whose arrows are not.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "F(x,y)=(x,y): spreads out, but does it spin?", "why": "This is the field from the hook, F(x,y)=(x,y). Watching a point's real path shows why divergence (spreading) and curl (spinning) are separate, independently-checked numbers, not two views of one thing.", "x_expr": "exp(t)*1", "y_expr": "exp(t)*0.5", "t_min": 0, "t_max": 0.6931471805599453, "duration_sec": 7, "ghost": {"x_expr": "exp(t)*cos(3*t)", "y_expr": "exp(t)*sin(3*t)"}, "narration_steps": [{"at_progress": 0, "text": "A point at $(1,0.5)$ sits in the field $\\mathbf F(x,y)=(x,y)$ from the hook. Predict: does the flow starting here spin around the origin, or only move away from it?", "text_shaken": "Start at $(1,0.5)$. Watch what happens to it in this field — does it turn, or just move outward?", "text_assured": "$(1,0.5)$ under $\\mathbf F(x,y)=(x,y)$: predict whether the resulting path changes direction (a sign of curl) or only distance (a sign of divergence).", "focus_point": true, "emphasize": false}, {"at_progress": 0.5, "text": "Now at about $(1.41,0.71)$ — twice as far from the origin as the start, but on the exact same ray: the angle from the origin, $\\approx 26.6°$, hasn't moved at all.", "text_shaken": "About $(1.41,0.71)$ now — farther out, but the same direction from the centre as before.", "text_assured": "$\\mathbf r(t)=e^t(1,0.5)$: radius scales by $e^t$, direction constant — velocity $\\mathbf r'(t)=\\mathbf r(t)=\\mathbf F(\\mathbf r(t))$, purely radial, zero tangential component.", "focus_point": true, "emphasize": false}, {"at_progress": 0.75, "text": "Still expanding straight outward, no turning.", "text_shaken": "Still moving straight outward, no turning.", "text_assured": "No tangential component ever appears in $\\mathbf F$ along this path — ruling out rotation before it could start.", "emphasize": false, "trap": {"text": "Students expect outward expansion to come bundled with rotation, the way water spinning down a drain both spreads and spins.", "avoid": "Divergence and curl are independent, computed separately: here $\\operatorname{div}\\mathbf F=2$ (a genuine source) while $\\operatorname{curl}\\mathbf F=0$ (no spin at all) — one operator answering yes and the other no, on the same field."}}, {"at_progress": 1.0, "text": "The point has reached $(2,1)$ — twice as far out as the start, still on the same ray. Divergence measures this outward spreading; curl would measure any turning, and here there is none.", "text_shaken": "Arrived at $(2,1)$ — twice as far out, same direction as the start. Expansion with no spin: that is a source with zero curl.", "text_assured": "$(2,1)=2\\cdot(1,0.5)$ — pure radial scaling. $\\operatorname{div}\\mathbf F=2\\ne0$, $\\operatorname{curl}\\mathbf F=0$: source present, spin absent, exactly as the pointwise definitions require you to check independently.", "focus_point": true, "emphasize": true}]}
```
