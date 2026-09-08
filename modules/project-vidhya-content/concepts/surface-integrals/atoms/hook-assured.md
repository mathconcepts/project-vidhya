---
# Alternative body for surface-integrals.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: surface-integrals.hook.assured
concept_id: surface-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: surface-integrals.hook
for_stance: assured
---

Parametrize a tilted surface as a graph $z=f(x,y)$ and it is tempting to write $dS=dA$. It is not: the true element is $dS=\sqrt{1+f_x^2+f_y^2}\,dA$, and dropping that square root treats a slanted patch as if it had the area of its flat shadow, which is only correct when the surface happens to be horizontal, $f_x=f_y=0$. The stretch factor is exactly the tilt a net analogy warns about, now hiding inside the area element instead of the dot product.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "Tilting the net: flux follows cos(theta), not a straight line", "why": "This is the same net (1 m^2, flow 2 m/s) from the hook, now tilting. Watching its normal vector rotate shows why flux follows cos(theta) — a curve, not the straight-line drop a naive halfway guess assumes.", "x_expr": "cos(t)", "y_expr": "sin(t)", "t_min": 0, "t_max": 1.5707963267948966, "duration_sec": 6, "narration_steps": [{"at_progress": 0, "text": "The net's normal starts aligned with the flow — face-on, at $(1,0)$, catching the full $2\\,\\text{m}^3/\\text{s}$. As we tilt it toward edge-on, does the flux drop steadily, or does it stay high until the very last moment?", "text_shaken": "The normal starts at $(1,0)$: face-on, flux $=2\\,\\text{m}^3/\\text{s}$. Watch it tilt.", "text_assured": "$(1,0)$: face-on, flux $=Av=2$. Predict the shape of flux$(\\theta)$ as the net tilts to edge-on — linear, or a curve.", "focus_point": true, "emphasize": false}, {"at_progress": 0.5, "text": "Halfway to edge-on, the normal is at $(0.71,0.71)$ — $\\theta=45°$. The flux is $2\\cos45°\\approx1.41\\,\\text{m}^3/\\text{s}$, not half of $2$.", "text_shaken": "At $(0.71,0.71)$, $\\theta=45°$: flux $=2\\cos45°\\approx1.41$ — more than half the original flux, even at the halfway angle.", "text_assured": "$\\theta=45°$: flux $=2\\cos45°=\\sqrt2\\approx1.41$, comfortably above the linear-interpolation guess of $1$ — $\\cos\\theta$ falls slowly near $\\theta=0$.", "focus_point": true, "emphasize": false}, {"at_progress": 0.6666666666666666, "text": "At $\\theta=60°$ the flux has dropped to exactly $1\\,\\text{m}^3/\\text{s}$ — only now has it reached half its starting value, two-thirds of the way to edge-on.", "text_shaken": "At $\\theta=60°$: flux $=2\\cos60°=1$ — half the flux, but at two-thirds of the angle, not halfway.", "text_assured": "$\\theta=60°$: flux $=2\\cos60°=1$, the true halfway point of flux — arriving late in the angle sweep, the signature of a cosine, not a line.", "emphasize": false, "trap": {"text": "Students assume flux drops in a straight line with tilt angle — halfway in angle should mean half the flux.", "avoid": "Flux follows $A v\\cos\\theta$: at the halfway angle $45°$ the flux is still $\\approx1.41$, not $1$; the true half-flux point is $60°$, not $45°$ — cosine, not a straight line."}}, {"at_progress": 1.0, "text": "Edge-on now: normal at $(0,1)$, perpendicular to the flow, and the flux has fallen all the way to $0$ — the net catches nothing, exactly as the hook predicted.", "text_shaken": "Edge-on: normal at $(0,1)$, flux $=0$. No water passes through an edge-on net.", "text_assured": "$\\theta=90°$: flux $=2\\cos90°=0$ exactly — the degenerate case a surface integral's $\\mathbf F\\cdot\\hat{\\mathbf n}$ dot product handles automatically, without a separate rule.", "focus_point": true, "emphasize": true}]}
```
